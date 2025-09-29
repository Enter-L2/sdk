// Package enterl2 provides a Go SDK for interacting with the Enter L2 network
package enterl2

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/shopspring/decimal"
)

// Client represents the main Enter L2 client
type Client struct {
	config     *Config
	l2Client   *ethclient.Client
	l1Client   *ethclient.Client
	privateKey *ecdsa.PrivateKey
	address    common.Address

	// Services
	Payment *PaymentService
	Bridge  *BridgeService
	Naming  *NamingService
	Staking *StakingService
	Wallet  *WalletService
}

// Config holds the configuration for the Enter L2 client
type Config struct {
	// Network endpoints
	L2RPCURL string
	L1RPCURL string
	APIURL   string
	WSURL    string

	// Network settings
	ChainID *big.Int
	Timeout time.Duration

	// Contract addresses
	Contracts ContractAddresses
}

// ContractAddresses holds the addresses of deployed contracts
type ContractAddresses struct {
	StateManager  common.Address
	Bridge        common.Address
	WalletFactory common.Address
	NameRegistry  common.Address
	PhoneResolver common.Address
	StakingPool   common.Address
	USDC          common.Address
	USDT          common.Address
}

// WalletType represents the type of wallet
type WalletType uint8

const (
	WalletTypeConsumer WalletType = 0
	WalletTypeMerchant WalletType = 1
)

// TransactionType represents the type of transaction
type TransactionType uint8

const (
	TransactionTypeTransfer         TransactionType = 0
	TransactionTypeDeposit          TransactionType = 1
	TransactionTypeWithdrawal       TransactionType = 2
	TransactionTypeNameRegistration TransactionType = 3
	TransactionTypeStaking          TransactionType = 4
)

// TransactionStatus represents the status of a transaction
type TransactionStatus uint8

const (
	TransactionStatusPending   TransactionStatus = 0
	TransactionStatusConfirmed TransactionStatus = 1
	TransactionStatusFailed    TransactionStatus = 2
	TransactionStatusCancelled TransactionStatus = 3
)

// NewClient creates a new Enter L2 client
func NewClient(config *Config) (*Client, error) {
	// Connect to L2 network
	l2Client, err := ethclient.Dial(config.L2RPCURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to L2: %w", err)
	}

	// Connect to L1 network if URL provided
	var l1Client *ethclient.Client
	if config.L1RPCURL != "" {
		l1Client, err = ethclient.Dial(config.L1RPCURL)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to L1: %w", err)
		}
	}

	// Set default timeout
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}

	client := &Client{
		config:   config,
		l2Client: l2Client,
		l1Client: l1Client,
	}

	// Initialize services
	client.Payment = NewPaymentService(client)
	client.Bridge = NewBridgeService(client)
	client.Naming = NewNamingService(client)
	client.Staking = NewStakingService(client)
	client.Wallet = NewWalletService(client)

	return client, nil
}

// Connect connects the client with a private key
func (c *Client) Connect(privateKeyHex string) error {
	// Parse private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return fmt.Errorf("invalid private key: %w", err)
	}

	// Get address from private key
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return fmt.Errorf("error casting public key to ECDSA")
	}

	address := crypto.PubkeyToAddress(*publicKeyECDSA)

	c.privateKey = privateKey
	c.address = address

	return nil
}

// GetAddress returns the current address
func (c *Client) GetAddress() common.Address {
	return c.address
}

// IsConnected returns true if the client is connected with a private key
func (c *Client) IsConnected() bool {
	return c.privateKey != nil
}

// GetBalance returns the balance for a specific token
func (c *Client) GetBalance(ctx context.Context, tokenAddress *common.Address) (*big.Int, error) {
	if tokenAddress == nil {
		// Get ETH balance
		return c.l2Client.BalanceAt(ctx, c.address, nil)
	}

	// Get ERC20 token balance
	// This would use the ERC20 contract ABI to call balanceOf
	// For brevity, returning a placeholder
	return big.NewInt(0), fmt.Errorf("ERC20 balance not implemented in this example")
}

// GetTransaction returns transaction details by hash
func (c *Client) GetTransaction(ctx context.Context, hash common.Hash) (*TransactionResponse, error) {
	tx, isPending, err := c.l2Client.TransactionByHash(ctx, hash)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	var receipt *types.Receipt
	if !isPending {
		receipt, err = c.l2Client.TransactionReceipt(ctx, hash)
		if err != nil {
			return nil, fmt.Errorf("failed to get receipt: %w", err)
		}
	}

	response := &TransactionResponse{
		Hash:   hash,
		From:   c.getFromAddress(tx),
		To:     tx.To(),
		Amount: tx.Value(),
		Status: TransactionStatusPending,
	}

	if receipt != nil {
		response.BlockNumber = receipt.BlockNumber
		response.GasUsed = big.NewInt(int64(receipt.GasUsed))
		if receipt.Status == types.ReceiptStatusSuccessful {
			response.Status = TransactionStatusConfirmed
		} else {
			response.Status = TransactionStatusFailed
		}
	}

	return response, nil
}

// WaitForTransaction waits for a transaction to be confirmed
func (c *Client) WaitForTransaction(ctx context.Context, hash common.Hash, confirmations uint64) (*TransactionResponse, error) {
	// Create a context with timeout
	timeoutCtx, cancel := context.WithTimeout(ctx, c.config.Timeout)
	defer cancel()

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-timeoutCtx.Done():
			return nil, fmt.Errorf("timeout waiting for transaction")
		case <-ticker.C:
			tx, err := c.GetTransaction(timeoutCtx, hash)
			if err != nil {
				continue
			}

			if tx.Status == TransactionStatusConfirmed {
				// Check confirmations
				if confirmations > 0 {
					currentBlock, err := c.l2Client.BlockNumber(timeoutCtx)
					if err != nil {
						continue
					}

					if currentBlock-tx.BlockNumber.Uint64() >= confirmations {
						return tx, nil
					}
				} else {
					return tx, nil
				}
			} else if tx.Status == TransactionStatusFailed {
				return tx, fmt.Errorf("transaction failed")
			}
		}
	}
}

// SendTransaction sends a signed transaction
func (c *Client) SendTransaction(ctx context.Context, tx *types.Transaction) (common.Hash, error) {
	if c.privateKey == nil {
		return common.Hash{}, fmt.Errorf("client not connected")
	}

	// Get chain ID
	chainID, err := c.l2Client.NetworkID(ctx)
	if err != nil {
		return common.Hash{}, fmt.Errorf("failed to get chain ID: %w", err)
	}

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), c.privateKey)
	if err != nil {
		return common.Hash{}, fmt.Errorf("failed to sign transaction: %w", err)
	}

	// Send transaction
	err = c.l2Client.SendTransaction(ctx, signedTx)
	if err != nil {
		return common.Hash{}, fmt.Errorf("failed to send transaction: %w", err)
	}

	return signedTx.Hash(), nil
}

// GetTransactOpts returns transaction options for contract calls
func (c *Client) GetTransactOpts(ctx context.Context) (*bind.TransactOpts, error) {
	if c.privateKey == nil {
		return nil, fmt.Errorf("client not connected")
	}

	chainID, err := c.l2Client.NetworkID(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	auth, err := bind.NewKeyedTransactorWithChainID(c.privateKey, chainID)
	if err != nil {
		return nil, fmt.Errorf("failed to create transactor: %w", err)
	}

	auth.Context = ctx
	return auth, nil
}

// GetCallOpts returns call options for contract calls
func (c *Client) GetCallOpts(ctx context.Context) *bind.CallOpts {
	return &bind.CallOpts{
		Context: ctx,
		From:    c.address,
	}
}

// Close closes the client connections
func (c *Client) Close() {
	if c.l2Client != nil {
		c.l2Client.Close()
	}
	if c.l1Client != nil {
		c.l1Client.Close()
	}
}

// Helper function to extract from address from transaction
func (c *Client) getFromAddress(tx *types.Transaction) common.Address {
	// This would normally recover the from address from the transaction signature
	// For brevity, returning zero address
	return common.Address{}
}

// TransactionResponse represents a transaction response
type TransactionResponse struct {
	Hash        common.Hash
	Type        TransactionType
	Status      TransactionStatus
	From        common.Address
	To          *common.Address
	Amount      *big.Int
	Token       *common.Address
	Fee         *big.Int
	FeePayer    common.Address
	FeeToken    common.Address
	BlockNumber *big.Int
	BlockHash   *common.Hash
	TxIndex     *uint
	GasUsed     *big.Int
	Timestamp   *time.Time
	Description *string
}

// PaymentRequest represents a payment request
type PaymentRequest struct {
	To          common.Address
	Amount      *big.Int
	Token       *common.Address
	Description *string
	GasLimit    *uint64
}

// WalletInfo represents wallet information
type WalletInfo struct {
	Address          common.Address
	Type             WalletType
	Owner            common.Address
	WhitelistEnabled bool
	DailyLimit       *big.Int
	Operators        []common.Address
}

// TokenBalance represents a token balance
type TokenBalance struct {
	Token    common.Address
	Symbol   string
	Decimals uint8
	Balance  *big.Int
}

// Error types
type EnterL2Error struct {
	Message string
	Code    string
	Data    interface{}
}

func (e *EnterL2Error) Error() string {
	return e.Message
}

// NewEnterL2Error creates a new Enter L2 error
func NewEnterL2Error(message, code string, data interface{}) *EnterL2Error {
	return &EnterL2Error{
		Message: message,
		Code:    code,
		Data:    data,
	}
}
