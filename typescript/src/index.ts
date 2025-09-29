/**
 * Enter L2 TypeScript SDK
 * 
 * A comprehensive SDK for interacting with the Enter L2 network,
 * providing easy-to-use interfaces for payments, staking, naming, and more.
 */

// Core client
export { EnterL2Client } from './client/EnterL2Client';
export { EnterL2Provider } from './providers/EnterL2Provider';

// Wallet management
export { WalletManager } from './wallet/WalletManager';
export { ConsumerWallet } from './wallet/ConsumerWallet';
export { MerchantWallet } from './wallet/MerchantWallet';

// Services
export { PaymentService } from './services/PaymentService';
export { BridgeService } from './services/BridgeService';
export { NamingService } from './services/NamingService';
export { StakingService } from './services/StakingService';

// Utilities
export { TransactionBuilder } from './utils/TransactionBuilder';
export { FeeCalculator } from './utils/FeeCalculator';
export { AddressUtils } from './utils/AddressUtils';

// Types
export * from './types';

// Constants
export * from './constants';

// Version
export const VERSION = '1.0.0';
