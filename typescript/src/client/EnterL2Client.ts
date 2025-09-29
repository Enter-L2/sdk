import { ethers } from 'ethers';
import { EventEmitter } from 'eventemitter3';
import { EnterL2Provider } from '../providers/EnterL2Provider';
import { WalletManager } from '../wallet/WalletManager';
import { PaymentService } from '../services/PaymentService';
import { BridgeService } from '../services/BridgeService';
import { NamingService } from '../services/NamingService';
import { StakingService } from '../services/StakingService';
import { 
  EnterL2Config, 
  TransactionResponse, 
  WalletType,
  NetworkInfo 
} from '../types';

/**
 * Main client for interacting with Enter L2 network
 */
export class EnterL2Client extends EventEmitter {
  private provider: EnterL2Provider;
  private signer?: ethers.Signer;
  
  // Services
  public readonly wallet: WalletManager;
  public readonly payment: PaymentService;
  public readonly bridge: BridgeService;
  public readonly naming: NamingService;
  public readonly staking: StakingService;

  constructor(config: EnterL2Config) {
    super();
    
    // Initialize provider
    this.provider = new EnterL2Provider(config);
    
    // Initialize services
    this.wallet = new WalletManager(this.provider);
    this.payment = new PaymentService(this.provider);
    this.bridge = new BridgeService(this.provider);
    this.naming = new NamingService(this.provider);
    this.staking = new StakingService(this.provider);
    
    // Set up event forwarding
    this.setupEventForwarding();
  }

  /**
   * Connect with an Ethereum signer
   */
  async connect(signer: ethers.Signer): Promise<void> {
    this.signer = signer;
    await this.provider.setSigner(signer);
    
    const address = await signer.getAddress();
    this.emit('connected', { address });
  }

  /**
   * Disconnect the current signer
   */
  disconnect(): void {
    this.signer = undefined;
    this.provider.setSigner(undefined);
    this.emit('disconnected');
  }

  /**
   * Get the current signer
   */
  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  /**
   * Get the current address
   */
  async getAddress(): Promise<string | undefined> {
    return this.signer ? await this.signer.getAddress() : undefined;
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return !!this.signer;
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    return this.provider.getNetworkInfo();
  }

  /**
   * Get account balance for a specific token
   */
  async getBalance(tokenAddress?: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    const address = await this.signer.getAddress();
    return this.provider.getBalance(address, tokenAddress);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<TransactionResponse | null> {
    return this.provider.getTransaction(hash);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    hash: string, 
    confirmations: number = 1, 
    timeout: number = 60000
  ): Promise<TransactionResponse> {
    return this.provider.waitForTransaction(hash, confirmations, timeout);
  }

  /**
   * Create a consumer wallet
   */
  async createConsumerWallet(): Promise<string> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.wallet.createWallet(WalletType.CONSUMER);
  }

  /**
   * Create a merchant wallet
   */
  async createMerchantWallet(
    whitelistEnabled: boolean = false,
    dailyLimit?: string
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.wallet.createWallet(WalletType.MERCHANT, {
      whitelistEnabled,
      dailyLimit,
    });
  }

  /**
   * Send a payment
   */
  async sendPayment(
    to: string,
    amount: string,
    tokenAddress?: string,
    description?: string
  ): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.payment.sendPayment({
      to,
      amount,
      tokenAddress,
      description,
    });
  }

  /**
   * Deposit tokens from L1 to L2
   */
  async deposit(
    tokenAddress: string,
    amount: string,
    l2Recipient?: string
  ): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    const recipient = l2Recipient || await this.signer.getAddress();
    return this.bridge.deposit(tokenAddress, amount, recipient);
  }

  /**
   * Withdraw tokens from L2 to L1
   */
  async withdraw(
    tokenAddress: string,
    amount: string,
    l1Recipient?: string
  ): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    const recipient = l1Recipient || await this.signer.getAddress();
    return this.bridge.withdraw(tokenAddress, amount, recipient);
  }

  /**
   * Register a name
   */
  async registerName(name: string, resolver?: string): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.naming.registerName(name, resolver);
  }

  /**
   * Stake tokens
   */
  async stake(amount: string, lockPeriod: number = 0): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.staking.stake(amount, lockPeriod);
  }

  /**
   * Unstake tokens
   */
  async unstake(amount: string): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.staking.unstake(amount);
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(): Promise<TransactionResponse> {
    if (!this.signer) {
      throw new Error('Client not connected');
    }
    
    return this.staking.claimRewards();
  }

  /**
   * Set up event forwarding from services
   */
  private setupEventForwarding(): void {
    // Forward provider events
    this.provider.on('block', (block) => this.emit('block', block));
    this.provider.on('transaction', (tx) => this.emit('transaction', tx));
    this.provider.on('error', (error) => this.emit('error', error));
    
    // Forward service events
    this.payment.on('paymentSent', (data) => this.emit('paymentSent', data));
    this.payment.on('paymentReceived', (data) => this.emit('paymentReceived', data));
    
    this.bridge.on('depositInitiated', (data) => this.emit('depositInitiated', data));
    this.bridge.on('depositCompleted', (data) => this.emit('depositCompleted', data));
    this.bridge.on('withdrawalInitiated', (data) => this.emit('withdrawalInitiated', data));
    this.bridge.on('withdrawalCompleted', (data) => this.emit('withdrawalCompleted', data));
    
    this.naming.on('nameRegistered', (data) => this.emit('nameRegistered', data));
    this.naming.on('nameTransferred', (data) => this.emit('nameTransferred', data));
    
    this.staking.on('staked', (data) => this.emit('staked', data));
    this.staking.on('unstaked', (data) => this.emit('unstaked', data));
    this.staking.on('rewardsClaimed', (data) => this.emit('rewardsClaimed', data));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.provider.destroy();
    this.removeAllListeners();
  }
}
