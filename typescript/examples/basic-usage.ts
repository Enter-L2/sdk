/**
 * Basic usage example for Enter L2 SDK
 */

import { EnterL2Client, WalletType } from '../src';
import { ethers } from 'ethers';

async function main() {
  // Initialize the client
  const client = new EnterL2Client({
    rpcUrl: 'https://rpc.enterl2.com',
    l1RpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    apiUrl: 'https://api.enterl2.com',
    wsUrl: 'wss://ws.enterl2.com',
    chainId: 42161, // Enter L2 chain ID
  });

  // Connect with a wallet
  const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
  const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
  
  await client.connect(wallet);
  console.log('Connected to Enter L2 with address:', await client.getAddress());

  // Set up event listeners
  client.on('paymentReceived', (payment) => {
    console.log('Payment received:', payment);
  });

  client.on('depositCompleted', (deposit) => {
    console.log('Deposit completed:', deposit);
  });

  try {
    // 1. Create a consumer wallet
    console.log('\n1. Creating consumer wallet...');
    const consumerWallet = await client.createConsumerWallet();
    console.log('Consumer wallet created:', consumerWallet);

    // 2. Create a merchant wallet
    console.log('\n2. Creating merchant wallet...');
    const merchantWallet = await client.createMerchantWallet(
      true, // whitelist enabled
      '10000000000000000000000' // 10,000 USDC daily limit
    );
    console.log('Merchant wallet created:', merchantWallet);

    // 3. Check balance
    console.log('\n3. Checking balance...');
    const balance = await client.getBalance();
    console.log('Current balance:', balance, 'ETH');

    // 4. Deposit USDC from L1 to L2
    console.log('\n4. Depositing USDC...');
    const usdcAddress = '0xA0b86a33E6441b8dB2B2B0b0b0b0b0b0b0b0b0b0'; // USDC
    const depositTx = await client.deposit(
      usdcAddress,
      '1000000', // 1 USDC (6 decimals)
      consumerWallet
    );
    console.log('Deposit transaction:', depositTx.hash);

    // Wait for deposit confirmation
    await client.waitForTransaction(depositTx.hash);
    console.log('Deposit confirmed!');

    // 5. Send a payment
    console.log('\n5. Sending payment...');
    const paymentTx = await client.sendPayment(
      merchantWallet,
      '500000', // 0.5 USDC
      usdcAddress,
      'Payment for coffee'
    );
    console.log('Payment transaction:', paymentTx.hash);

    // 6. Register a name
    console.log('\n6. Registering name...');
    const nameTx = await client.registerName('alice');
    console.log('Name registration transaction:', nameTx.hash);

    // 7. Stake tokens
    console.log('\n7. Staking tokens...');
    const stakeTx = await client.stake(
      '1000000000000000000000', // 1000 tokens
      31536000 // 1 year lock period
    );
    console.log('Staking transaction:', stakeTx.hash);

    // 8. Get transaction history
    console.log('\n8. Getting transaction history...');
    const history = await client.payment.getPaymentHistory(
      await client.getAddress()!,
      10 // last 10 transactions
    );
    console.log('Transaction history:', history.length, 'transactions');

    // 9. Estimate fees for a payment
    console.log('\n9. Estimating fees...');
    const feeEstimate = await client.payment.estimateFees({
      to: merchantWallet,
      amount: '1000000',
      tokenAddress: usdcAddress,
    });
    console.log('Fee estimate:', feeEstimate);

    // 10. Create a payment request
    console.log('\n10. Creating payment request...');
    const paymentRequest = client.payment.createPaymentRequest(
      merchantWallet,
      '2000000', // 2 USDC
      usdcAddress,
      'Payment for lunch'
    );
    console.log('Payment request URL:', paymentRequest);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up
    client.disconnect();
    client.destroy();
  }
}

// Advanced usage examples
async function advancedExamples() {
  const client = new EnterL2Client({
    rpcUrl: 'https://rpc.enterl2.com',
    l1RpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  });

  // Connect with MetaMask (browser environment)
  if (typeof window !== 'undefined' && window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    await client.connect(signer);
  }

  // Batch operations
  console.log('Performing batch operations...');
  
  const operations = [
    client.sendPayment('0x...', '1000000'),
    client.sendPayment('0x...', '2000000'),
    client.sendPayment('0x...', '3000000'),
  ];

  const results = await Promise.allSettled(operations);
  console.log('Batch results:', results);

  // Real-time monitoring
  console.log('Setting up real-time monitoring...');
  
  client.on('block', (block) => {
    console.log('New block:', block.number);
  });

  client.on('transaction', (tx) => {
    console.log('New transaction:', tx.hash);
  });

  // Subscribe to specific events
  const userAddress = await client.getAddress();
  if (userAddress) {
    client.payment.subscribeToPayments(userAddress);
    client.bridge.subscribeToDeposits(userAddress);
    client.staking.subscribeToStakingEvents(userAddress);
  }

  // Error handling
  client.on('error', (error) => {
    console.error('Client error:', error);
    
    // Implement retry logic
    if (error.code === 'NETWORK_ERROR') {
      console.log('Retrying in 5 seconds...');
      setTimeout(() => {
        // Retry operation
      }, 5000);
    }
  });
}

// Run examples
if (require.main === module) {
  main().catch(console.error);
}
