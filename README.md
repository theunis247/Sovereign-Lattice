# Sovereign Lattice - Quantum Cryptocurrency Platform

A revolutionary platform that combines AI-powered scientific research with blockchain technology, where users earn real QBS (Quantum Breakthrough Shares) tokens through scientific contributions.

## 🌟 Features

### 🔬 AI-Powered Scientific Mining
- **DeepSeek Integration**: Use your personal API key for breakthrough evaluation
- **Scientific Grading**: AI evaluates discoveries with S, A, B, C grades
- **Evolution System**: Advance breakthroughs for additional rewards
- **Personal Credits**: Full control over your AI usage and costs

### 💎 Real Cryptocurrency
- **ERC-20 QBS Token**: Legitimate cryptocurrency on Ethereum/Polygon
- **Blockchain Rewards**: Mining mints real tokens to your wallet
- **MetaMask Integration**: Professional wallet connectivity
- **Multi-Network**: Ethereum, Polygon, and testnet support

### 🔐 Security & Privacy
- **Client-Side Encryption**: API keys never leave your device
- **Military-Grade Security**: AES-256-GCM encryption
- **Secure Storage**: PBKDF2 key derivation with 100k iterations
- **No Data Collection**: Complete privacy and user control

### 🚀 Professional Features
- **Dual-Mode Operation**: Works online and offline
- **Transaction History**: Full blockchain transaction tracking
- **Token Transfers**: Send QBS tokens to other wallets
- **Real-Time Sync**: Automatic balance and state synchronization

## 🚀 Quick Start

### 1. Installation
```bash
git clone <repository>
cd sovereign-lattice
npm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
PRIVATE_KEY=your_wallet_private_key_for_deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Deploy Smart Contract (Optional)
```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.cjs --network sepolia --config hardhat.config.cjs

# Update networkConfig.ts with contract address
```

### 4. Start the Application
```bash
npm run dev
```

### 5. Setup Your Account
1. **Create Account**: Register with secure credentials
2. **Connect Wallet**: Link your MetaMask wallet
3. **Add API Key**: Configure your DeepSeek API key in settings
4. **Start Mining**: Begin earning QBS tokens through scientific contributions

## 🔧 Development

### Smart Contract Development
```bash
# Compile contracts
npx hardhat compile --config hardhat.config.cjs

# Run tests
npx hardhat test --config hardhat.config.cjs

# Deploy to local network
npx hardhat node --config hardhat.config.cjs
npx hardhat run scripts/deploy.cjs --network localhost --config hardhat.config.cjs
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 How It Works

### Scientific Mining Process
1. **Start Mining**: Click mine to begin scientific problem solving
2. **AI Evaluation**: DeepSeek AI evaluates your breakthrough
3. **Grade Assignment**: Receive S, A, B, or C grade based on scientific merit
4. **Token Reward**: Earn QBS tokens based on grade multiplier
5. **Blockchain Minting**: Tokens are minted directly to your wallet

### Grade System
- **S Grade (10x)**: Impossible breakthroughs + 0.005 QBS bonus
- **A Grade (5x)**: Nobel-level theoretical work
- **B Grade (2x)**: Valid scientific logic with constants
- **C Grade (1x)**: Basic scientific contributions

### Evolution System
- **Advance Discoveries**: Spend 25 QRK to evolve breakthroughs
- **Higher Levels**: Reach Mk 2, Mk 3, etc. advancement levels
- **Additional Rewards**: Earn bonus QBS tokens for evolution

## 🌐 Network Support

### Testnets (Recommended for Testing)
- **Sepolia**: Ethereum testnet
- **Mumbai**: Polygon testnet

### Mainnets (Production)
- **Ethereum**: High security, higher fees
- **Polygon**: Lower fees, faster transactions

## 🔑 API Key Management

### Getting DeepSeek API Key
1. Visit [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. Create account and generate API key
3. Add key to application settings
4. Start mining with your personal credits

### Security Features
- **Client-Side Encryption**: Keys encrypted in browser
- **No Transmission**: Keys never sent to servers
- **User Control**: Full ownership of API usage
- **Easy Management**: Update or remove keys anytime

## 💰 Tokenomics

### QBS Token Details
- **Name**: Quantum Breakthrough Shares
- **Symbol**: QBS
- **Decimals**: 18
- **Max Supply**: 10,000 QBS
- **Standard**: ERC-20 compatible

### Distribution
- **Mining Rewards**: Earned through scientific contributions
- **Evolution Bonuses**: Additional rewards for advancement
- **Initial Liquidity**: 1,000 QBS for platform operations

## 🛡️ Security

### Smart Contract Security
- **Access Control**: Only authorized miners can mint
- **Supply Cap**: Hard limit of 10,000 QBS tokens
- **Pausable**: Emergency pause functionality
- **Burnable**: Token burning capability
- **Auditable**: Open source and verifiable

### Application Security
- **No Private Key Storage**: Uses MetaMask for security
- **Encrypted API Keys**: Military-grade client-side encryption
- **Secure Communication**: HTTPS and secure protocols
- **Privacy First**: No user data collection

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for:
- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check the deployment guide
- **Issues**: Report bugs on GitHub
- **Community**: Join our Discord/Telegram
- **Email**: Contact support team

### Common Issues
- **MetaMask Connection**: Ensure MetaMask is installed and unlocked
- **API Key Errors**: Verify DeepSeek API key is valid
- **Network Issues**: Check you're on supported network
- **Transaction Failures**: Ensure sufficient gas and network connectivity

## 🚀 Roadmap

### Phase 1: Core Platform ✅
- [x] AI-powered mining system
- [x] Blockchain integration
- [x] MetaMask connectivity
- [x] Token transfers and history

### Phase 2: Advanced Features
- [ ] Governance system
- [ ] Staking mechanisms
- [ ] NFT certificates
- [ ] Mobile application

### Phase 3: Ecosystem Growth
- [ ] DEX integration
- [ ] Cross-chain bridges
- [ ] Academic partnerships
- [ ] Research publication system

## 🌟 Why Sovereign Lattice?

**Revolutionary Concept**: First platform to combine AI-powered scientific research with real cryptocurrency rewards.

**Real Value**: Earn actual blockchain tokens with economic value through intellectual contributions.

**User Ownership**: Complete control over your API keys, data, and rewards.

**Scientific Impact**: Contribute to human knowledge while earning cryptocurrency.

**Professional Grade**: Enterprise-level security and blockchain integration.

---

**Transform scientific research into cryptocurrency rewards. Start mining breakthroughs today!** 🚀

## 📊 Stats

- **Smart Contract**: Production-ready ERC-20 token
- **Security**: Military-grade encryption (AES-256-GCM)
- **Networks**: Multi-chain support (Ethereum, Polygon)
- **AI Integration**: DeepSeek API with personal key management
- **User Experience**: Professional crypto platform interface

**Join the future of scientific cryptocurrency mining!** 🔬💎