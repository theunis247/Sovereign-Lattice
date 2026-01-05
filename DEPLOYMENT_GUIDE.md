# QBS Token Deployment Guide

This guide walks you through deploying the QBS Token smart contract to testnets and mainnet.

## Prerequisites

1. **Node.js and npm** installed
2. **MetaMask** wallet with test ETH
3. **Testnet ETH** from faucets
4. **API Keys** for block explorers (optional but recommended)

## Step 1: Get Testnet ETH

### Sepolia Testnet
- Visit: https://sepoliafaucet.com/
- Connect your MetaMask wallet
- Request test ETH (you'll need ~0.1 ETH for deployment)

### Mumbai Testnet (Polygon)
- Visit: https://faucet.polygon.technology/
- Select Mumbai network
- Request test MATIC

## Step 2: Configure Environment Variables

Update your `.env.local` file with deployment credentials:

```bash
# Blockchain Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key
PRIVATE_KEY=your_wallet_private_key_for_deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**⚠️ Security Warning**: Never commit your private key to version control!

## Step 3: Deploy to Sepolia Testnet

1. **Compile the contract**:
   ```bash
   npx hardhat compile --config hardhat.config.cjs
   ```

2. **Deploy to Sepolia**:
   ```bash
   npx hardhat run scripts/deploy.cjs --network sepolia --config hardhat.config.cjs
   ```

3. **Save the contract address** from the deployment output

## Step 4: Deploy to Mumbai Testnet

1. **Deploy to Mumbai**:
   ```bash
   npx hardhat run scripts/deploy.cjs --network polygonMumbai --config hardhat.config.cjs
   ```

2. **Save the contract address** from the deployment output

## Step 5: Update Network Configuration

Update `services/networkConfig.ts` with your deployed contract addresses:

```typescript
export const CONTRACT_ADDRESSES: Record<number, string> = {
  1: '', // Ethereum Mainnet - TBD
  11155111: '0xYourSepoliaContractAddress', // Sepolia
  137: '', // Polygon - TBD
  80001: '0xYourMumbaiContractAddress', // Mumbai
  1337: '' // Local - TBD
};
```

## Step 6: Verify Contracts (Optional but Recommended)

### Verify on Sepolia
```bash
npx hardhat verify --network sepolia --config hardhat.config.cjs 0xYourSepoliaContractAddress "0xYourWalletAddress"
```

### Verify on Mumbai
```bash
npx hardhat verify --network polygonMumbai --config hardhat.config.cjs 0xYourMumbaiContractAddress "0xYourWalletAddress"
```

## Step 7: Test the Integration

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Test the flow**:
   - Connect MetaMask to Sepolia network
   - Set up your DeepSeek API key in settings
   - Start mining to earn QBS tokens
   - Verify tokens are minted to your wallet

## Step 8: Authorize Mining (Important!)

After deployment, you need to authorize your application to mint tokens:

1. **Connect to the deployed contract** using a blockchain explorer or script
2. **Call `authorizeMiner`** with your application's wallet address
3. **This allows the mining system** to mint QBS tokens as rewards

### Using Hardhat Console:
```bash
npx hardhat console --network sepolia --config hardhat.config.cjs
```

```javascript
const QBSToken = await ethers.getContractFactory("QBSToken");
const qbs = await QBSToken.attach("0xYourContractAddress");
await qbs.authorizeMiner("0xYourMiningWalletAddress");
```

## Mainnet Deployment (Production)

**⚠️ Only deploy to mainnet after thorough testing on testnets!**

1. **Get real ETH/MATIC** for deployment costs
2. **Update hardhat.config.cjs** with mainnet configurations
3. **Deploy using mainnet networks**:
   ```bash
   npx hardhat run scripts/deploy.cjs --network mainnet --config hardhat.config.cjs
   ```

## Troubleshooting

### Common Issues:

1. **"Insufficient funds"**: Get more test ETH from faucets
2. **"Nonce too high"**: Reset MetaMask account in Advanced settings
3. **"Contract verification failed"**: Check constructor parameters match deployment
4. **"Mining not working"**: Ensure miner address is authorized in contract

### Getting Help:

- Check Hardhat documentation: https://hardhat.org/docs
- Ethereum testnet faucets: https://faucetlink.to/sepolia
- Polygon faucets: https://faucet.polygon.technology/

## Security Checklist

- [ ] Private keys stored securely (not in code)
- [ ] Contract verified on block explorers
- [ ] Mining authorization properly configured
- [ ] Test all functions on testnet before mainnet
- [ ] Smart contract audited (for mainnet deployment)

## Contract Features

Your deployed QBS token includes:

- ✅ **ERC-20 Standard**: Full compatibility with wallets and exchanges
- ✅ **Mining Rewards**: Mint tokens for scientific breakthroughs
- ✅ **Evolution System**: Additional rewards for advancement
- ✅ **Access Control**: Only authorized miners can mint
- ✅ **Supply Cap**: Maximum 10,000 QBS tokens
- ✅ **Pausable**: Emergency pause functionality
- ✅ **Burnable**: Token burning capability

## Next Steps

After successful deployment:

1. **Share contract addresses** with your community
2. **Add to token lists** for wallet visibility
3. **Create liquidity pools** on DEXs (if desired)
4. **Monitor usage** through blockchain explorers
5. **Plan mainnet deployment** after thorough testing

Your quantum simulator is now a fully functional cryptocurrency platform! 🎉