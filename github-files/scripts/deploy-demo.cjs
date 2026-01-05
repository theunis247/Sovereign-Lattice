#!/usr/bin/env node

/**
 * Quick deployment script for sharing the project
 * Builds and prepares the project for various hosting platforms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing Sovereign Lattice for deployment...\n');

// 1. Build the project
console.log('📦 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// 2. Create deployment info
const deploymentInfo = {
  name: 'Sovereign Lattice - Quantum Cryptocurrency Platform',
  description: 'AI-powered scientific research meets blockchain rewards',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  nodeVersion: '18.x',
  environmentVariables: {
    required: [
      'DEEPSEEK_API_KEY (for AI evaluation)',
      'PRIVATE_KEY (for blockchain deployment)',
      'SEPOLIA_RPC_URL (for testnet)',
      'ETHERSCAN_API_KEY (for verification)'
    ],
    optional: [
      'POLYGON_RPC_URL',
      'MUMBAI_RPC_URL',
      'POLYGONSCAN_API_KEY'
    ]
  },
  features: [
    '🔬 AI-powered scientific mining',
    '💎 Real ERC-20 cryptocurrency (QBS tokens)',
    '🔐 Military-grade security',
    '🚀 MetaMask integration',
    '📊 Transaction history',
    '🌐 Multi-network support'
  ]
};

// 3. Create deployment guide
const deploymentGuide = `# 🌐 Quick Deployment Guide

## Platform Options

### 1. Vercel (Recommended)
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### 2. Netlify
\`\`\`bash
npm run build
# Upload dist/ folder to netlify.com
\`\`\`

### 3. GitHub Pages
\`\`\`bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
\`\`\`

## Environment Variables Needed

### Required:
- \`DEEPSEEK_API_KEY\`: Your DeepSeek API key for AI evaluation
- \`PRIVATE_KEY\`: Wallet private key for blockchain deployment
- \`SEPOLIA_RPC_URL\`: Ethereum testnet RPC URL
- \`ETHERSCAN_API_KEY\`: For contract verification

### Optional:
- \`POLYGON_RPC_URL\`: Polygon mainnet RPC
- \`MUMBAI_RPC_URL\`: Polygon testnet RPC
- \`POLYGONSCAN_API_KEY\`: For Polygon verification

## Features Your Friend Will See:
${deploymentInfo.features.map(feature => `- ${feature}`).join('\n')}

## Demo Instructions:
1. Visit the deployed URL
2. Create your secure account
3. Connect MetaMask wallet
4. Add DeepSeek API key in settings
5. Start mining quantum breakthroughs!
6. Earn real QBS cryptocurrency tokens

## Live Demo Flow:
- **Scientific Mining**: AI evaluates breakthroughs
- **Token Rewards**: Earn QBS based on grade (S/A/B/C)
- **Evolution System**: Advance discoveries for bonuses
- **Blockchain Integration**: Real cryptocurrency transactions
- **Professional UI**: Modern crypto platform interface

Your friend will experience a fully functional cryptocurrency platform! 🎉
`;

// Write deployment files
fs.writeFileSync('DEPLOYMENT_INFO.json', JSON.stringify(deploymentInfo, null, 2));
fs.writeFileSync('QUICK_DEPLOY.md', deploymentGuide);

console.log('📋 Deployment files created:');
console.log('   - DEPLOYMENT_INFO.json');
console.log('   - QUICK_DEPLOY.md\n');

console.log('🎯 Next Steps:');
console.log('1. Choose a hosting platform (Vercel recommended)');
console.log('2. Set up environment variables');
console.log('3. Deploy and share the URL with your friend');
console.log('4. Your friend can experience the full crypto platform!\n');

console.log('🌟 Your Sovereign Lattice platform is ready for the world!');