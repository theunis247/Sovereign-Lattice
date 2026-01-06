# Production Server Deployment Instructions

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
   ```bash
   npm ci --only=production
   ```

2. **Make startup script executable:**
   ```bash
   chmod +x start-server.sh
   ```

3. **Start the server:**
   ```bash
   ./start-server.sh
   ```

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
```bash
node -e "
const fs = require('fs');
console.log('Database exists:', fs.existsSync('data/users'));
console.log('Founder exists:', fs.existsSync('data/users/0xd3d9dbc928c765d19fef1da0bb4df83736975730.json'));
console.log('Environment:', process.env.NODE_ENV);
"
```
