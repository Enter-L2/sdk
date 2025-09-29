# Enter L2 SDK

Multi-language SDKs for interacting with the Enter L2 network - a ZK Rollup-based stablecoin payment network with merchant-paid fees and consumer-friendly wallets.

## Overview

The Enter L2 SDK provides easy-to-use libraries for:
- **Payment Processing**: Send and receive payments with automatic fee handling
- **Wallet Management**: Create and manage consumer and merchant wallets
- **Bridge Operations**: Deposit and withdraw tokens between L1 and L2
- **Name Services**: Register and resolve ENS-like names with phone verification
- **Staking**: Stake tokens and earn rewards from network fees
- **Real-time Events**: Subscribe to network events and transaction updates

## Supported Languages

- **TypeScript/JavaScript** - Full-featured SDK for web and Node.js applications
- **Go** - High-performance SDK for backend services
- **Python** - Comprehensive SDK with async support
- **Rust** - Coming soon
- **Java** - Coming soon

## Quick Start

### TypeScript/JavaScript

```bash
npm install @enter-l2/sdk
```

```typescript
import { EnterL2Client } from '@enter-l2/sdk';
import { ethers } from 'ethers';

// Initialize client
const client = new EnterL2Client({
  rpcUrl: 'https://rpc.enterl2.com',
  l1RpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
});

// Connect with wallet
const provider = new ethers.JsonRpcProvider('...');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
await client.connect(wallet);

// Send payment
const tx = await client.sendPayment(
  '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b',
  '1000000', // 1 USDC
  '0xA0b86a33E6441b8dB2B2B0b0b0b0b0b0b0b0b0b0' // USDC address
);

console.log('Payment sent:', tx.hash);
```

### Go

```bash
go get github.com/enter-l2/sdk-go
```

```go
package main

import (
    "context"
    "fmt"
    "math/big"
    
    enterl2 "github.com/enter-l2/sdk-go"
    "github.com/ethereum/go-ethereum/common"
)

func main() {
    // Initialize client
    config := &enterl2.Config{
        L2RPCURL: "https://rpc.enterl2.com",
        L1RPCURL: "https://mainnet.infura.io/v3/YOUR_KEY",
    }
    
    client, err := enterl2.NewClient(config)
    if err != nil {
        panic(err)
    }
    defer client.Close()
    
    // Connect with private key
    err = client.Connect("YOUR_PRIVATE_KEY")
    if err != nil {
        panic(err)
    }
    
    // Send payment
    ctx := context.Background()
    tx, err := client.Payment.SendPayment(ctx, &enterl2.PaymentRequest{
        To:     common.HexToAddress("0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b"),
        Amount: big.NewInt(1000000), // 1 USDC
        Token:  &common.Address{...}, // USDC address
    })
    
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Payment sent: %s\n", tx.Hash.Hex())
}
```

### Python

```bash
pip install enterl2-sdk
```

```python
import asyncio
from decimal import Decimal
from enterl2 import EnterL2Client, EnterL2Config

async def main():
    # Initialize client
    config = EnterL2Config(
        rpc_url="https://rpc.enterl2.com",
        l1_rpc_url="https://mainnet.infura.io/v3/YOUR_KEY",
    )
    
    async with EnterL2Client(config) as client:
        # Connect with private key
        client.connect("YOUR_PRIVATE_KEY")
        
        # Send payment
        tx = await client.send_payment(
            to="0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
            amount=Decimal("1"),  # 1 USDC
            token_address="0xA0b86a33E6441b8dB2B2B0b0b0b0b0b0b0b0b0b0"
        )
        
        print(f"Payment sent: {tx.hash}")

if __name__ == "__main__":
    asyncio.run(main())
```

## Features

### 🏦 Wallet Management

Create and manage different types of wallets:

```typescript
// Consumer wallet (receive-only from merchants)
const consumerWallet = await client.createConsumerWallet();

// Merchant wallet (full functionality)
const merchantWallet = await client.createMerchantWallet(
  true,  // whitelist enabled
  '10000000000000000000000' // 10,000 USDC daily limit
);
```

### 💸 Payment Processing

Send payments with automatic fee handling:

```typescript
// Merchant pays fees for consumer transactions
const payment = await client.sendPayment(
  consumerWallet,
  '5000000', // 5 USDC
  usdcAddress,
  'Coffee payment'
);

// Real-time payment events
client.on('paymentReceived', (payment) => {
  console.log('Received payment:', payment);
});
```

### 🌉 Bridge Operations

Move tokens between L1 and L2:

```typescript
// Deposit from L1 to L2
const deposit = await client.deposit(
  usdcAddress,
  '100000000', // 100 USDC
  l2RecipientAddress
);

// Withdraw from L2 to L1
const withdrawal = await client.withdraw(
  usdcAddress,
  '50000000', // 50 USDC
  l1RecipientAddress
);
```

### 🏷️ Name Services

Register and resolve names:

```typescript
// Register a name
await client.registerName('alice');

// Register phone number
await client.naming.registerPhone('+1234567890');

// Verify phone
await client.naming.verifyPhone('+1234567890', '123456');

// Resolve name to address
const address = await client.naming.resolveName('alice');
```

### 🥩 Staking

Stake tokens and earn rewards:

```typescript
// Stake with lock period for higher rewards
await client.stake(
  '1000000000000000000000', // 1000 tokens
  31536000 // 1 year lock period
);

// Claim rewards
await client.claimRewards();

// Get staking positions
const positions = await client.staking.getPositions();
```

### 📊 Real-time Events

Subscribe to network events:

```typescript
// Transaction events
client.on('transaction', (tx) => {
  console.log('New transaction:', tx.hash);
});

// Block events
client.on('block', (block) => {
  console.log('New block:', block.number);
});

// Payment events
client.on('paymentSent', (payment) => {
  console.log('Payment sent:', payment);
});

client.on('paymentReceived', (payment) => {
  console.log('Payment received:', payment);
});
```

## Configuration

### Network Configurations

```typescript
// Mainnet
const mainnetConfig = {
  rpcUrl: 'https://rpc.enterl2.com',
  l1RpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  chainId: 42161,
  contracts: {
    stateManager: '0x...',
    bridge: '0x...',
    walletFactory: '0x...',
    // ... other contracts
  }
};

// Testnet
const testnetConfig = {
  rpcUrl: 'https://testnet-rpc.enterl2.com',
  l1RpcUrl: 'https://goerli.infura.io/v3/YOUR_KEY',
  chainId: 421613,
  // ... testnet contracts
};
```

### Advanced Configuration

```typescript
const client = new EnterL2Client({
  rpcUrl: 'https://rpc.enterl2.com',
  l1RpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
  apiUrl: 'https://api.enterl2.com',
  wsUrl: 'wss://ws.enterl2.com',
  timeout: 30000,
  retries: 3,
  contracts: {
    // Custom contract addresses
  }
});
```

## Error Handling

```typescript
import { EnterL2Error, TransactionError, NetworkError } from '@enter-l2/sdk';

try {
  await client.sendPayment(to, amount);
} catch (error) {
  if (error instanceof TransactionError) {
    console.error('Transaction failed:', error.txHash);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.statusCode);
  } else if (error instanceof EnterL2Error) {
    console.error('Enter L2 error:', error.code);
  }
}
```

## Testing

Each SDK includes comprehensive test suites:

```bash
# TypeScript
npm test

# Go
go test ./...

# Python
pytest
```

## Examples

Check the `examples/` directory in each SDK for complete working examples:

- **Basic Usage**: Simple payment and wallet operations
- **Advanced Features**: Staking, naming, and bridge operations
- **Real-time Apps**: WebSocket events and live updates
- **Integration**: Backend service integration patterns

## Documentation

- **API Reference**: [docs.enterl2.com/sdk](https://docs.enterl2.com/sdk)
- **Tutorials**: [docs.enterl2.com/tutorials](https://docs.enterl2.com/tutorials)
- **Examples**: [github.com/enter-l2/examples](https://github.com/enter-l2/examples)

## Support

- **Discord**: [discord.gg/enterl2](https://discord.gg/enterl2)
- **GitHub Issues**: [github.com/enter-l2/sdk/issues](https://github.com/enter-l2/sdk/issues)
- **Email**: dev@enterl2.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
