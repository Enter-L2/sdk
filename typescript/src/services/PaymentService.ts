import { EventEmitter } from 'eventemitter3';
import { ethers } from 'ethers';
import { EnterL2Provider } from '../providers/EnterL2Provider';
import { TransactionBuilder } from '../utils/TransactionBuilder';
import { FeeCalculator } from '../utils/FeeCalculator';
import {
  PaymentRequest,
  TransactionResponse,
  TransactionType,
  PaymentEvent,
  FeeEstimate,
  EnterL2Error,
} from '../types';

/**
 * Service for handling payments on Enter L2
 */
export class PaymentService extends EventEmitter {
  private provider: EnterL2Provider;
  private txBuilder: TransactionBuilder;
  private feeCalculator: FeeCalculator;

  constructor(provider: EnterL2Provider) {
    super();
    this.provider = provider;
    this.txBuilder = new TransactionBuilder(provider);
    this.feeCalculator = new FeeCalculator(provider);
  }

  /**
   * Send a payment
   */
  async sendPayment(request: PaymentRequest): Promise<TransactionResponse> {
    try {
      const signer = this.provider.getSigner();
      if (!signer) {
        throw new EnterL2Error('No signer available');
      }

      const from = await signer.getAddress();

      // Validate payment request
      await this.validatePaymentRequest(request, from);

      // Estimate fees
      const feeEstimate = await this.estimateFees(request, from);

      // Build transaction
      const tx = await this.txBuilder.buildPaymentTransaction({
        ...request,
        from,
        feeEstimate,
      });

      // Sign and send transaction
      const signedTx = await signer.signTransaction(tx);
      const response = await this.provider.sendTransaction(signedTx);

      // Emit event
      this.emit('paymentSent', {
        hash: response.hash,
        from,
        to: request.to,
        amount: request.amount,
        token: request.tokenAddress || 'ETH',
        timestamp: Date.now(),
      } as PaymentEvent);

      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Estimate payment fees
   */
  async estimateFees(request: PaymentRequest, from?: string): Promise<FeeEstimate> {
    const sender = from || (await this.provider.getSigner()?.getAddress());
    if (!sender) {
      throw new EnterL2Error('No sender address available');
    }

    return this.feeCalculator.estimatePaymentFees({
      ...request,
      from: sender,
    });
  }

  /**
   * Get payment history for an address
   */
  async getPaymentHistory(
    address: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TransactionResponse[]> {
    return this.provider.getTransactionHistory(address, {
      type: TransactionType.TRANSFER,
      limit,
      offset,
    });
  }

  /**
   * Get pending payments
   */
  async getPendingPayments(address: string): Promise<TransactionResponse[]> {
    return this.provider.getPendingTransactions(address, TransactionType.TRANSFER);
  }

  /**
   * Cancel a pending payment (if possible)
   */
  async cancelPayment(txHash: string): Promise<boolean> {
    try {
      return await this.provider.cancelTransaction(txHash);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create a payment request (for QR codes, etc.)
   */
  createPaymentRequest(
    to: string,
    amount: string,
    tokenAddress?: string,
    description?: string
  ): string {
    const params = new URLSearchParams({
      to,
      amount,
      ...(tokenAddress && { token: tokenAddress }),
      ...(description && { description }),
    });

    return `enterl2://pay?${params.toString()}`;
  }

  /**
   * Parse a payment request URL
   */
  parsePaymentRequest(url: string): PaymentRequest {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== 'enterl2:' || urlObj.pathname !== '//pay') {
        throw new Error('Invalid payment request URL');
      }

      const params = urlObj.searchParams;
      const to = params.get('to');
      const amount = params.get('amount');

      if (!to || !amount) {
        throw new Error('Missing required parameters');
      }

      return {
        to,
        amount,
        tokenAddress: params.get('token') || undefined,
        description: params.get('description') || undefined,
      };
    } catch (error) {
      throw new EnterL2Error(`Invalid payment request: ${error.message}`);
    }
  }

  /**
   * Validate payment request
   */
  private async validatePaymentRequest(request: PaymentRequest, from: string): Promise<void> {
    // Validate addresses
    if (!ethers.isAddress(request.to)) {
      throw new EnterL2Error('Invalid recipient address');
    }

    if (!ethers.isAddress(from)) {
      throw new EnterL2Error('Invalid sender address');
    }

    // Validate amount
    try {
      const amount = ethers.parseUnits(request.amount, 18);
      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }
    } catch (error) {
      throw new EnterL2Error(`Invalid amount: ${error.message}`);
    }

    // Validate token address if provided
    if (request.tokenAddress && !ethers.isAddress(request.tokenAddress)) {
      throw new EnterL2Error('Invalid token address');
    }

    // Check if recipient can receive payments (for consumer wallets)
    const recipientWalletInfo = await this.provider.getWalletInfo(request.to);
    if (recipientWalletInfo?.type === 0) { // Consumer wallet
      const senderWalletInfo = await this.provider.getWalletInfo(from);
      if (senderWalletInfo?.type !== 1) { // Not a merchant wallet
        throw new EnterL2Error('Consumer wallets can only receive payments from merchants');
      }
    }

    // Check balance
    const balance = await this.provider.getBalance(from, request.tokenAddress);
    const amount = ethers.parseUnits(request.amount, 18);
    const balanceBN = ethers.parseUnits(balance, 18);

    if (balanceBN < amount) {
      throw new EnterL2Error('Insufficient balance');
    }
  }

  /**
   * Subscribe to payment events for an address
   */
  subscribeToPayments(address: string): void {
    this.provider.subscribeToEvents('payment', {
      filter: {
        $or: [
          { from: address },
          { to: address }
        ]
      },
      callback: (event: PaymentEvent) => {
        if (event.from === address) {
          this.emit('paymentSent', event);
        } else {
          this.emit('paymentReceived', event);
        }
      }
    });
  }

  /**
   * Unsubscribe from payment events
   */
  unsubscribeFromPayments(): void {
    this.provider.unsubscribeFromEvents('payment');
  }
}
