#!/bin/bash
# Real Database Setup for Production Server

echo "🗄️ Setting up real database for production..."

# Install database dependencies
npm install sqlite3 pg mysql2

# Create data directory
mkdir -p data
mkdir -p config
mkdir -p logs

# Initialize SQLite database
node -e "
const SQLiteDatabase = require('./services/SQLiteDatabase.js');
const db = new SQLiteDatabase();
db.initialize().then(() => {
  console.log('✅ Database initialized successfully');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
"

echo "✅ Real database setup complete!"
echo "🔐 Founder login: Freedom24/7365 / Security Code: 77777"
echo "💰 Balance: 1000 QBS"
