"""
Enter L2 Python Client

Main client for interacting with the Enter L2 network.
"""

import asyncio
from typing import Optional, Dict, Any, List
from decimal import Decimal

from web3 import Web3
from web3.middleware import geth_poa_middleware
from eth_account import Account
from eth_account.signers.local import LocalAccount

from .provider import EnterL2Provider
from .wallet import WalletManager
from .services import PaymentService, BridgeService, NamingService, StakingService
from .types import (
    EnterL2Config,
    WalletType,
    TransactionResponse,
    NetworkInfo,
    EnterL2Error,
)
from .utils import AddressUtils


class EnterL2Client:
    """
    Main client for interacting with Enter L2 network
    """
    
    def __init__(self, config: EnterL2Config):
        """
        Initialize the Enter L2 client
        
        Args:
            config: Configuration for the client
        """
        self.config = config
        self.provider = EnterL2Provider(config)
        self._account: Optional[LocalAccount] = None
        
        # Initialize services
        self.wallet = WalletManager(self.provider)
        self.payment = PaymentService(self.provider)
        self.bridge = BridgeService(self.provider)
        self.naming = NamingService(self.provider)
        self.staking = StakingService(self.provider)
        
        # Event callbacks
        self._event_callbacks: Dict[str, List[callable]] = {}
    
    def connect(self, private_key: str) -> None:
        """
        Connect with a private key
        
        Args:
            private_key: Ethereum private key (hex string)
        """
        try:
            self._account = Account.from_key(private_key)
            self.provider.set_account(self._account)
        except Exception as e:
            raise EnterL2Error(f"Failed to connect: {str(e)}")
    
    def disconnect(self) -> None:
        """Disconnect the current account"""
        self._account = None
        self.provider.set_account(None)
    
    @property
    def address(self) -> Optional[str]:
        """Get the current address"""
        return self._account.address if self._account else None
    
    @property
    def is_connected(self) -> bool:
        """Check if client is connected"""
        return self._account is not None
    
    async def get_network_info(self) -> NetworkInfo:
        """Get network information"""
        return await self.provider.get_network_info()
    
    async def get_balance(self, token_address: Optional[str] = None) -> Decimal:
        """
        Get account balance for a specific token
        
        Args:
            token_address: Token contract address (None for native token)
            
        Returns:
            Balance as Decimal
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        return await self.provider.get_balance(self.address, token_address)
    
    async def get_transaction(self, tx_hash: str) -> Optional[TransactionResponse]:
        """
        Get transaction by hash
        
        Args:
            tx_hash: Transaction hash
            
        Returns:
            Transaction response or None if not found
        """
        return await self.provider.get_transaction(tx_hash)
    
    async def wait_for_transaction(
        self, 
        tx_hash: str, 
        confirmations: int = 1, 
        timeout: int = 60
    ) -> TransactionResponse:
        """
        Wait for transaction confirmation
        
        Args:
            tx_hash: Transaction hash
            confirmations: Number of confirmations to wait for
            timeout: Timeout in seconds
            
        Returns:
            Confirmed transaction response
        """
        return await self.provider.wait_for_transaction(tx_hash, confirmations, timeout)
    
    async def create_consumer_wallet(self) -> str:
        """
        Create a consumer wallet
        
        Returns:
            Wallet address
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        return await self.wallet.create_wallet(WalletType.CONSUMER)
    
    async def create_merchant_wallet(
        self, 
        whitelist_enabled: bool = False,
        daily_limit: Optional[Decimal] = None
    ) -> str:
        """
        Create a merchant wallet
        
        Args:
            whitelist_enabled: Enable whitelist for the wallet
            daily_limit: Daily spending limit
            
        Returns:
            Wallet address
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        options = {
            'whitelist_enabled': whitelist_enabled,
            'daily_limit': daily_limit,
        }
        
        return await self.wallet.create_wallet(WalletType.MERCHANT, options)
    
    async def send_payment(
        self,
        to: str,
        amount: Decimal,
        token_address: Optional[str] = None,
        description: Optional[str] = None
    ) -> TransactionResponse:
        """
        Send a payment
        
        Args:
            to: Recipient address
            amount: Amount to send
            token_address: Token contract address (None for native token)
            description: Payment description
            
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        request = {
            'to': to,
            'amount': amount,
            'token_address': token_address,
            'description': description,
        }
        
        return await self.payment.send_payment(request)
    
    async def deposit(
        self,
        token_address: str,
        amount: Decimal,
        l2_recipient: Optional[str] = None
    ) -> TransactionResponse:
        """
        Deposit tokens from L1 to L2
        
        Args:
            token_address: Token contract address
            amount: Amount to deposit
            l2_recipient: L2 recipient address (defaults to current address)
            
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        recipient = l2_recipient or self.address
        return await self.bridge.deposit(token_address, amount, recipient)
    
    async def withdraw(
        self,
        token_address: str,
        amount: Decimal,
        l1_recipient: Optional[str] = None
    ) -> TransactionResponse:
        """
        Withdraw tokens from L2 to L1
        
        Args:
            token_address: Token contract address
            amount: Amount to withdraw
            l1_recipient: L1 recipient address (defaults to current address)
            
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        recipient = l1_recipient or self.address
        return await self.bridge.withdraw(token_address, amount, recipient)
    
    async def register_name(
        self, 
        name: str, 
        resolver: Optional[str] = None
    ) -> TransactionResponse:
        """
        Register a name
        
        Args:
            name: Name to register
            resolver: Resolver address
            
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        return await self.naming.register_name(name, resolver)
    
    async def stake(
        self, 
        amount: Decimal, 
        lock_period: int = 0
    ) -> TransactionResponse:
        """
        Stake tokens
        
        Args:
            amount: Amount to stake
            lock_period: Lock period in seconds
            
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        return await self.staking.stake(amount, lock_period)
    
    async def unstake(self, amount: Decimal) -> TransactionResponse:
        """
        Unstake tokens
        
        Args:
            amount: Amount to unstake
            
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        return await self.staking.unstake(amount)
    
    async def claim_rewards(self) -> TransactionResponse:
        """
        Claim staking rewards
        
        Returns:
            Transaction response
        """
        if not self.is_connected:
            raise EnterL2Error("Client not connected")
        
        return await self.staking.claim_rewards()
    
    def on(self, event: str, callback: callable) -> None:
        """
        Register event callback
        
        Args:
            event: Event name
            callback: Callback function
        """
        if event not in self._event_callbacks:
            self._event_callbacks[event] = []
        self._event_callbacks[event].append(callback)
    
    def off(self, event: str, callback: callable) -> None:
        """
        Unregister event callback
        
        Args:
            event: Event name
            callback: Callback function
        """
        if event in self._event_callbacks:
            try:
                self._event_callbacks[event].remove(callback)
            except ValueError:
                pass
    
    def emit(self, event: str, data: Any) -> None:
        """
        Emit an event
        
        Args:
            event: Event name
            data: Event data
        """
        if event in self._event_callbacks:
            for callback in self._event_callbacks[event]:
                try:
                    callback(data)
                except Exception as e:
                    # Log error but don't break other callbacks
                    print(f"Error in event callback: {e}")
    
    async def close(self) -> None:
        """Close the client and cleanup resources"""
        await self.provider.close()
        self._event_callbacks.clear()
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
