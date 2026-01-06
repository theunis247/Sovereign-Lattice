#!/usr/bin/env node
/**
 * Deploy to Production Server
 * Complete deployment script for hosted server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying to production server...');

async function deployToProductionServer() {
  try {
    // Step 1: Set up production environment
    console.log('\n1️⃣ Configuring production environment...');
    
    const envConfig = `NODE_ENV=production
DATABASE_PERSISTENT=true
DB_TYPE=file-based
FOUNDER_INITIALIZED=true
PORT=25578`;
    
    fs.writeFileSync('.env', envConfig);
    console.log('✅ Environment variables configured');
    
    // Step 2: Initialize production database
    console.log('\n2️⃣ Initializing production database...');
    execSync('node scripts/fix-production-database.cjs', { stdio: 'inherit' });
    
    // Step 3: Build for production
    console.log('\n3️⃣ Building for production...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 4: Create deployment package
    console.log('\n4️⃣ Creating deployment package...');
    
    const deploymentFiles = [
      'dist/',
      'data/',
      'logs/',
      'scripts/',
      'package.json',
      'package-lock.json',
      '.env',
      'ecosystem.config.cjs',
      'vite.config.ts'
    ];
    
    console.log('📦 Files to upload to your server:');
    deploymentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ⚠️ ${file} (missing)`);
      }
    });
    
    // Step 5: Create server startup script
    console.log('\n5️⃣ Creating server startup script...');
    
    const serverScript = `#!/bin/bash
# Production Server Startup Script

echo "🚀 Starting Sovereign Lattice Platform..."

# Install dependencies
npm ci --only=production

# Initialize database if needed
if [ ! -d "data" ]; then
  echo "📊 Initializing production database..."
  node scripts/fix-production-database.cjs
fi

# Start with PM2 (recommended)
if command -v pm2 &> /dev/null; then
  echo "🔧 Starting with PM2..."
  pm2 start ecosystem.config.cjs
  pm2 save
else
  echo "🔧 Starting with Node.js..."
  NODE_ENV=production npm run serve:prod
fi

echo "✅ Server started successfully!"
echo "🌐 Access at: http://your-domain.com:25578"
`;
    
    fs.writeFileSync('start-server.sh', serverScript);
    console.log('✅ Server startup script created');
    
    // Step 6: Create deployment instructions
    console.log('\n6️⃣ Creating deployment instructions...');
    
    const instructions = `# Production Server Deployment Instructions

## 📦 Upload Files
Upload these files/folders to your server:
- dist/ (built application)
- data/ (database files)
- logs/ (log directory)
- scripts/ (utility scripts)
- package.json
- package-lock.json
- .env
- ecosystem.config.cjs
- start-server.sh

## 🚀 Server Setup Commands

1. **Install Node.js dependencies:**
   \`\`\`bash
   npm ci --only=production
   \`\`\`

2. **Make startup script executable:**
   \`\`\`bash
   chmod +x start-server.sh
   \`\`\`

3. **Start the server:**
   \`\`\`bash
   ./start-server.sh
   \`\`\`

## 🔐 Login Credentials
- Username: Freedom24/7365
- Password: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU
- Security Code: 77777
- Expected Balance: 1000 QBS

## 🌐 Access
- URL: http://your-domain.com:25578
- The application will use file-based storage (not IndexedDB)
- All user data persists in the data/ directory

## 🔧 Troubleshooting
If login fails:
1. Check that data/ directory exists on server
2. Verify .env file has NODE_ENV=production
3. Check server logs for errors
4. Ensure port 25578 is open

## 📊 Verify Deployment
Run this on your server to verify:
\`\`\`bash
node -e "
const fs = require('fs');
console.log('Database exists:', fs.existsSync('data/users'));
console.log('Founder exists:', fs.existsSync('data/users/0xd3d9dbc928c765d19fef1da0bb4df83736975730.json'));
console.log('Environment:', process.env.NODE_ENV);
"
\`\`\`
`;
    
    fs.writeFileSync('PRODUCTION_DEPLOYMENT_INSTRUCTIONS.md', instructions);
    console.log('✅ Deployment instructions created');
    
    console.log('\n🎉 Production deployment preparation complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Upload all files to your server');
    console.log('2. Run: chmod +x start-server.sh');
    console.log('3. Run: ./start-server.sh');
    console.log('4. Access: http://your-domain.com:25578');
    console.log('5. Login with founder credentials');
    console.log('');
    console.log('🔍 Key Difference from Localhost:');
    console.log('   • Localhost: Uses IndexedDB (browser storage)');
    console.log('   • Production: Uses file-based storage (data/ directory)');
    console.log('   • This fixes the "NODE NOT FOUND" error on hosted servers');
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    return false;
  }
}

deployToProductionServer();