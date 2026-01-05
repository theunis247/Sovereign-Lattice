#!/usr/bin/env node

/**
 * Simple Static File Server - Fallback for environments without PM2
 */

import { spawn } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting application with simple static file server...');

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true });
}

// Check if dist directory exists
if (!fs.existsSync('dist')) {
  console.error('❌ Build artifacts not found. Run "npm run build" first.');
  process.exit(1);
}

// Start the application using vite preview
const child = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', process.env.PORT || '25578'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production' }
});

// Log output
const logStream = fs.createWriteStream('logs/app.log', { flags: 'a' });

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(data);
});

child.on('close', (code) => {
  console.log(`Application exited with code ${code}`);
  logStream.end();
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Terminating...');
  child.kill('SIGTERM');
});
