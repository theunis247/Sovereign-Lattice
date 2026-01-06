#!/usr/bin/env node

/**
 * Production Start Script
 * Starts the application in production mode with data persistence
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting application in production mode...');

async function startProduction() {
  try {
    // Verify data persistence setup
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      console.error('❌ Data directory not found. Run npm run db:init first.');
      process.exit(1);
    }

    // Verify founder profile exists
    const founderRegistryPath = path.join(dataDir, 'founder-registry.json');
    if (!fs.existsSync(founderRegistryPath)) {
      console.error('❌ Founder profile not found. Run npm run profile:create-founder first.');
      process.exit(1);
    }

    console.log('✅ Data persistence verified');
    console.log('✅ Founder profile verified');

    // Set production environment variables
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_PERSISTENT = 'true';
    process.env.BACKUP_ENABLED = 'true';
    process.env.PORT = process.env.PORT || '25578';

    // Start the preview server
    console.log(`🌐 Starting server on port ${process.env.PORT}...`);
    
    const serverProcess = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', process.env.PORT], {
      stdio: 'inherit',
      env: process.env
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(code);
      }
    });

    console.log('✅ Production server started successfully');
    console.log(`🌐 Access the application at: http://localhost:${process.env.PORT}`);
    
  } catch (error) {
    console.error('❌ Production start failed:', error.message);
    process.exit(1);
  }
}

// Start production server
startProduction();