"""
Enter L2 Python SDK

A comprehensive Python SDK for interacting with the Enter L2 network,
providing easy-to-use interfaces for payments, staking, naming, and more.
"""

from .__version__ import __version__

# Core client
from .client import EnterL2Client
from .provider import EnterL2Provider

# Wallet management
from .wallet import WalletManager, ConsumerWallet, MerchantWallet

# Services
from .services import (
    PaymentService,
    BridgeService, 
    NamingService,
    StakingService,
)

# Utilities
from .utils import (
    TransactionBuilder,
    FeeCalculator,
    AddressUtils,
    format_units,
    parse_units,
)

# Types and enums
from .types import (
    WalletType,
    TransactionType,
    TransactionStatus,
    TransactionResponse,
    PaymentRequest,
    WalletInfo,
    TokenBalance,
    NetworkInfo,
    EnterL2Error,
    TransactionError,
    NetworkError,
)

# Constants
from .constants import (
    MAINNET_CONFIG,
    TESTNET_CONFIG,
    DEFAULT_TIMEOUT,
    SUPPORTED_TOKENS,
)

__all__ = [
    # Version
    "__version__",
    
    # Core
    "EnterL2Client",
    "EnterL2Provider",
    
    # Wallet
    "WalletManager",
    "ConsumerWallet", 
    "MerchantWallet",
    
    # Services
    "PaymentService",
    "BridgeService",
    "NamingService", 
    "StakingService",
    
    # Utilities
    "TransactionBuilder",
    "FeeCalculator",
    "AddressUtils",
    "format_units",
    "parse_units",
    
    # Types
    "WalletType",
    "TransactionType",
    "TransactionStatus",
    "TransactionResponse",
    "PaymentRequest",
    "WalletInfo",
    "TokenBalance",
    "NetworkInfo",
    "EnterL2Error",
    "TransactionError",
    "NetworkError",
    
    # Constants
    "MAINNET_CONFIG",
    "TESTNET_CONFIG", 
    "DEFAULT_TIMEOUT",
    "SUPPORTED_TOKENS",
]
