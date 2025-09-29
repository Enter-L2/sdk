import { BigNumberish } from 'ethers';

/**
 * Configuration for Enter L2 client
 */
export interface EnterL2Config {
  /** L2 RPC URL */
  rpcUrl: string;
  /** L1 RPC URL for bridge operations */
  l1RpcUrl?: string;
  /** API endpoint for backend services */
  apiUrl?: string;
  /** WebSocket URL for real-time events */
  wsUrl?: string;
  /** Network chain ID */
  chainId?: number;
  /** Contract addresses */
  contracts?: ContractAddresses;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Contract addresses on the network
 */
export interface ContractAddresses {
  stateManager?: string;
  bridge?: string;
  walletFactory?: string;
  nameRegistry?: string;
  phoneResolver?: string;
  stakingPool?: string;
  usdc?: string;
  usdt?: string;
}

/**
 * Network information
 */
export interface NetworkInfo {
  chainId: number;
  name: string;
  blockNumber: number;
  gasPrice: string;
  contracts: ContractAddresses;
}

/**
 * Wallet types
 */
export enum WalletType {
  CONSUMER = 0,
  MERCHANT = 1,
}

/**
 * Transaction types
 */
export enum TransactionType {
  TRANSFER = 0,
  DEPOSIT = 1,
  WITHDRAWAL = 2,
  NAME_REGISTRATION = 3,
  STAKING = 4,
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 0,
  CONFIRMED = 1,
  FAILED = 2,
  CANCELLED = 3,
}

/**
 * Transaction response
 */
export interface TransactionResponse {
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to: string;
  amount: string;
  token?: string;
  fee: string;
  feePayer: string;
  feeToken: string;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  gasUsed?: string;
  timestamp?: number;
  description?: string;
}

/**
 * Payment request
 */
export interface PaymentRequest {
  to: string;
  amount: string;
  tokenAddress?: string;
  description?: string;
  gasLimit?: BigNumberish;
}

/**
 * Wallet creation options
 */
export interface WalletCreationOptions {
  whitelistEnabled?: boolean;
  dailyLimit?: string;
  operators?: string[];
}

/**
 * Wallet information
 */
export interface WalletInfo {
  address: string;
  type: WalletType;
  owner: string;
  whitelistEnabled: boolean;
  dailyLimit: string;
  operators: string[];
  balances: TokenBalance[];
}

/**
 * Token balance
 */
export interface TokenBalance {
  token: string;
  symbol: string;
  decimals: number;
  balance: string;
  formattedBalance: string;
}

/**
 * Bridge deposit request
 */
export interface DepositRequest {
  tokenAddress: string;
  amount: string;
  l2Recipient: string;
  l1TxHash?: string;
}

/**
 * Bridge withdrawal request
 */
export interface WithdrawalRequest {
  tokenAddress: string;
  amount: string;
  l1Recipient: string;
  nonce?: number;
}

/**
 * Bridge operation status
 */
export interface BridgeOperation {
  id: string;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  tokenAddress: string;
  amount: string;
  l1TxHash?: string;
  l2TxHash?: string;
  timestamp: number;
}

/**
 * Name registration request
 */
export interface NameRegistrationRequest {
  name: string;
  resolver?: string;
  duration?: number;
}

/**
 * Name information
 */
export interface NameInfo {
  name: string;
  owner: string;
  resolver: string;
  expiresAt: number;
  isPrimary: boolean;
}

/**
 * Phone verification request
 */
export interface PhoneVerificationRequest {
  phoneNumber: string;
  verificationCode?: string;
}

/**
 * Staking request
 */
export interface StakingRequest {
  amount: string;
  lockPeriod?: number;
}

/**
 * Staking position
 */
export interface StakingPosition {
  id: string;
  amount: string;
  lockPeriod: number;
  lockedUntil: number;
  multiplier: number;
  rewards: string;
  status: 'active' | 'unstaked' | 'slashed';
}

/**
 * Fee estimate
 */
export interface FeeEstimate {
  gasLimit: string;
  gasPrice: string;
  totalFee: string;
  feePayer: string;
  feeToken: string;
}

/**
 * Event data interfaces
 */
export interface PaymentEvent {
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  timestamp: number;
}

export interface DepositEvent {
  hash: string;
  user: string;
  token: string;
  amount: string;
  l1TxHash: string;
  timestamp: number;
}

export interface WithdrawalEvent {
  hash: string;
  user: string;
  token: string;
  amount: string;
  l1Recipient: string;
  timestamp: number;
}

export interface NameRegistrationEvent {
  hash: string;
  name: string;
  owner: string;
  resolver: string;
  expiresAt: number;
  timestamp: number;
}

export interface StakingEvent {
  hash: string;
  user: string;
  amount: string;
  lockPeriod: number;
  timestamp: number;
}

/**
 * Error types
 */
export class EnterL2Error extends Error {
  constructor(
    message: string,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'EnterL2Error';
  }
}

export class TransactionError extends EnterL2Error {
  constructor(
    message: string,
    public txHash?: string,
    code?: string,
    data?: any
  ) {
    super(message, code, data);
    this.name = 'TransactionError';
  }
}

export class NetworkError extends EnterL2Error {
  constructor(
    message: string,
    public statusCode?: number,
    code?: string,
    data?: any
  ) {
    super(message, code, data);
    this.name = 'NetworkError';
  }
}

/**
 * Utility types
 */
export type Address = string;
export type Hash = string;
export type Amount = string;
export type Timestamp = number;
