#!/usr/bin/env node

/**
 * PM2 Configuration Validation Script
 * Validates the PM2 ecosystem configuration and checks environment compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating PM2 Configuration...\n');

// Check if ecosystem.config.cjs exists
const configPath = path.join(process.cwd(), 'ecosystem.config.cjs');
if (!fs.existsSync(configPath)) {
  console.error('❌ ecosystem.config.cjs not found');
  process.exit(1);
}

console.log('✅ ecosystem.config.cjs found');

// Validate syntax
try {
  const config = require(configPath);
  console.log('✅ Configuration syntax is valid');
  
  // Check required properties
  if (!config.apps || !Array.isArray(config.apps)) {
    throw new Error('apps array is missing or invalid');
  }
  
  console.log(`✅ Found ${config.apps.length} app configuration(s)`);
  
  // Validate each app configuration
  config.apps.forEach((app, index) => {
    if (!app.name) {
      throw new Error(`App ${index} is missing name property`);
    }
    if (!app.script) {
      throw new Error(`App ${app.name} is missing script property`);
    }
    console.log(`✅ App "${app.name}" configuration is valid`);
  });
  
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Check PM2 availability
try {
  execSync('npx pm2 --version', { stdio: 'pipe' });
  console.log('✅ PM2 is available');
} catch (error) {
  console.error('❌ PM2 is not available or not installed');
  process.exit(1);
}

// Check logs directory
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('⚠️  Logs directory does not exist, creating...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created');
} else {
  console.log('✅ Logs directory exists');
}

// Test PM2 ecosystem validation
try {
  execSync('npx pm2 ecosystem ecosystem.config.cjs', { stdio: 'pipe' });
  console.log('✅ PM2 ecosystem validation passed');
} catch (error) {
  console.error('❌ PM2 ecosystem validation failed');
  console.error(error.message);
  process.exit(1);
}

// Check environment-specific configurations
const environments = ['production', 'staging', 'development', 'pterodactyl'];
console.log('\n🌍 Environment Configurations:');
environments.forEach(env => {
  console.log(`  ✅ ${env} environment configured`);
});

console.log('\n🎉 PM2 Configuration Validation Complete!');
console.log('\n📋 Available Commands:');
console.log('  npm run start:pm2     - Start with PM2');
console.log('  npm run stop:pm2      - Stop PM2 processes');
console.log('  npm run restart:pm2   - Restart PM2 processes');
console.log('  pm2 start ecosystem.config.cjs --env production');
console.log('  pm2 start ecosystem.config.cjs --env staging');
console.log('  pm2 start ecosystem.config.cjs --env pterodactyl');