#!/bin/bash
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
