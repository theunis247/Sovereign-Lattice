# Design Document

## Overview

This design transforms the Quantum Simulator into a real cryptocurrency ecosystem with blockchain integration, MetaMask wallet connectivity, and personalized API key management. The system will support both on-chain and off-chain operations, providing a seamless transition between simulation and real crypto functionality.

## Architecture

### Current Architecture
```
App.tsx -> Local Storage -> Simulated Balances
```

### New Hybrid Architecture
```
App.tsx -> Wallet Connector -> MetaMask -> Blockchain
         -> API Key Manager -> Encrypted Storage
         -> DeepSeek Client -> User's API Key
         -> Transaction Handler -> Smart Contract
```

### Dual-Mode Operation
- **Connected Mode**: Real blockchain transactions, MetaMask integration
- **Offline Mode**: Local simulation with sync capability

## Components and Interfaces

### MetaMask Wallet Integration

```typescript
interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string;
  isMetaMaskInstalled: boolean;
}

interface WalletConnector {
  connect(): Promise<WalletState>;
  disconnect(): void;
  switchNetwork(chainId: number): Promise<void>;
  getBalance(address: string): Promise<string>;
  sendTransaction(tx: TransactionRequest): Promise<string>;
}
```

### Smart Contract Integration

```typescript
interface QBSTokenContract {
  address: string;
  abi: any[];
  mint(to: string, amount: string): Promise<string>;
  transfer(to: string, amount: string): Promise<string>;
  balanceOf(address: string): Promise<string>;
  totalSupply(): Promise<string>;
}

interface ContractManager {
  getContract(network: string): QBSTokenContract;
  deployContract(network: string): Promise<string>;
  verifyContract(address: string): Promise<boolean>;
}
```

### API Key Management

```typescript
interface APIKeyManager {
  storeKey(userId: string, apiKey: string): Promise<void>;
  getKey(userId: string): Promise<string | null>;
  removeKey(userId: string): Promise<void>;
  validateKey(apiKey: string): Promise<boolean>;
  encryptKey(key: string): Promise<string>;
  decryptKey(encryptedKey: string): Promise<string>;
}

interface SecureStorage {
  encrypt(data: string, password: string): Promise<string>;
  decrypt(encryptedData: string, password: string): Promise<string>;
  generateSalt(): string;
  deriveKey(password: string, salt: string): Promise<CryptoKey>;
}
```

### Transaction Management

```typescript
interface TransactionManager {
  queueTransaction(tx: PendingTransaction): void;
  processQueue(): Promise<void>;
  getTransactionStatus(hash: string): Promise<TransactionStatus>;
  estimateGas(tx: TransactionRequest): Promise<string>;
  waitForConfirmation(hash: string): Promise<TransactionReceipt>;
}

interface PendingTransaction {
  id: string;
  type: 'MINING_REWARD' | 'TRANSFER' | 'EVOLUTION_COST';
  amount: string;
  recipient: string;
  timestamp: number;
  retryCount: number;
}
```

## Data Models

### Enhanced User Model

```typescript
interface User {
  // Existing fields...
  walletAddress?: string;
  isWalletConnected: boolean;
  preferredNetwork: string;
  encryptedApiKey?: string;
  apiKeyHash?: string;
  pendingTransactions: PendingTransaction[];
  blockchainBalance: string;
  lastSyncTimestamp: number;
  offlineRewards: OfflineReward[];
}

interface OfflineReward {
  id: string;
  amount: string;
  type: 'MINING' | 'EVOLUTION';
  timestamp: number;
  processed: boolean;
}
```

### Network Configuration

```typescript
interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contractAddress: string;
  symbol: string;
  decimals: number;
}

const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/...',
    explorerUrl: 'https://etherscan.io',
    contractAddress: '0x...',
    symbol: 'QBS',
    decimals: 18
  },
  {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    contractAddress: '0x...',
    symbol: 'QBS',
    decimals: 18
  }
];
```

## Smart Contract Design

### QBS Token Contract (Solidity)

```solidity
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QBSToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10000 * 10**18; // 10,000 QBS max
    mapping(address => bool) public miners;
    
    event MiningReward(address indexed miner, uint256 amount, string blockId);
    
    constructor() ERC20("Quantum Breakthrough Shares", "QBS") {}
    
    function addMiner(address miner) external onlyOwner {
        miners[miner] = true;
    }
    
    function mintReward(address to, uint256 amount, string memory blockId) 
        external 
        returns (bool) 
    {
        require(miners[msg.sender], "Not authorized miner");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit MiningReward(to, amount, blockId);
        return true;
    }
}
```

## Error Handling

### Blockchain Error Types
1. **Network Errors**: RPC failures, network congestion
2. **Transaction Errors**: Insufficient gas, failed transactions
3. **Wallet Errors**: User rejection, MetaMask not installed
4. **Contract Errors**: Invalid contract calls, insufficient balance
5. **API Key Errors**: Invalid keys, quota exceeded

### Fallback Strategies
- **Offline Mode**: Continue with local state when blockchain unavailable
- **Transaction Queuing**: Retry failed transactions automatically
- **API Key Fallback**: Use system key if user key fails (with permission)
- **Network Switching**: Automatically suggest alternative networks

## Security Considerations

### API Key Security
- Client-side encryption using Web Crypto API
- Keys never transmitted to servers
- Secure key derivation using PBKDF2
- Option to clear all stored credentials

### Blockchain Security
- Transaction validation before submission
- Gas estimation and limit protection
- Contract address verification
- Multi-signature support for admin functions

### Wallet Security
- Read-only access to wallet information
- User confirmation for all transactions
- Secure connection verification
- Network validation and warnings

## User Experience Design

### Wallet Connection Flow
1. **Detection**: Check if MetaMask is installed
2. **Connection**: Request wallet connection with clear permissions
3. **Network**: Verify or switch to supported network
4. **Sync**: Synchronize local state with blockchain state
5. **Ready**: Enable blockchain features

### API Key Setup Flow
1. **Input**: Secure form for API key entry
2. **Validation**: Test API key with DeepSeek service
3. **Encryption**: Encrypt and store key locally
4. **Confirmation**: Show successful setup message
5. **Usage**: Use personal key for mining operations

### Mining Reward Flow
1. **Local Evaluation**: Use user's API key for breakthrough analysis
2. **Reward Calculation**: Determine QBS token amount based on grade
3. **Transaction**: Submit minting transaction to blockchain
4. **Confirmation**: Wait for blockchain confirmation
5. **Update**: Refresh user balance and transaction history

## Performance Considerations

### Blockchain Optimization
- Batch multiple rewards into single transaction
- Gas price optimization based on network conditions
- Transaction queuing for failed operations
- Efficient contract interaction patterns

### Storage Optimization
- Encrypted local storage for sensitive data
- Efficient sync mechanisms for blockchain state
- Caching of frequently accessed contract data
- Cleanup of old transaction data

## Testing Strategy

### Smart Contract Testing
- Unit tests for all contract functions
- Integration tests with test networks
- Gas optimization testing
- Security audit preparation

### Frontend Integration Testing
- MetaMask connection scenarios
- Transaction flow testing
- Error handling validation
- Cross-network compatibility

### API Key Management Testing
- Encryption/decryption validation
- Key storage security testing
- API key validation testing
- Fallback scenario testing

## Deployment Strategy

### Smart Contract Deployment
1. **Testnet Deployment**: Deploy on Goerli/Mumbai for testing
2. **Audit**: Security audit of smart contracts
3. **Mainnet Deployment**: Deploy on Ethereum and Polygon
4. **Verification**: Verify contracts on block explorers

### Frontend Deployment
1. **Environment Configuration**: Set up network configurations
2. **Contract Integration**: Connect to deployed contracts
3. **Testing**: Comprehensive testing on all networks
4. **Production**: Deploy with proper monitoring

## Future Enhancements

### Advanced Features
- Multi-signature wallet support
- Hardware wallet integration (Ledger, Trezor)
- Cross-chain bridge functionality
- Governance token mechanics

### DeFi Integration
- Liquidity pool creation
- Staking mechanisms
- Yield farming opportunities
- DEX integration for trading

### Mobile Support
- WalletConnect integration
- Mobile-optimized interface
- Push notifications for transactions
- Offline-first mobile experience