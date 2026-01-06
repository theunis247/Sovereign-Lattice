#!/usr/bin/env node

/**
 * Fallback Deployment Strategy
 * Simple sequential startup for minimal environments without PM2
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Starting fallback deployment for minimal environment...');

async function fallbackDeployment() {
  try {
    // Detect environment capabilities
    const capabilities = await detectEnvironmentCapabilities();
    console.log('🔍 Environment capabilities detected:', capabilities);

    // Initialize data persistence
    console.log('📊 Initializing data persistence...');
    await runScript('init-database.cjs');

    // Create founder profile
    console.log('👑 Setting up founder profile...');
    await runScript('create-founder-profile.cjs');

    // Build application if needed
    if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
      console.log('🏗️ Building application...');
      await runCommand('npm', ['run', 'build']);
    }

    // Choose deployment strategy based on capabilities
    if (capabilities.hasNodeServe) {
      console.log('🚀 Using node serve for static file serving...');
      await startWithNodeServe();
    } else if (capabilities.hasVitePreview) {
      console.log('🚀 Using Vite preview server...');
      await startWithVitePreview();
    } else {
      console.log('🚀 Using basic HTTP server...');
      await startWithBasicServer();
    }

  } catch (error) {
    console.error('❌ Fallback deployment failed:', error.message);
    process.exit(1);
  }
}

async function detectEnvironmentCapabilities() {
  const capabilities = {
    hasNodeServe: false,
    hasVitePreview: false,
    hasPM2: false,
    hasPs: false,
    isMinimal: false
  };

  try {
    // Check for serve package
    await runCommand('npx', ['serve', '--version'], { silent: true });
    capabilities.hasNodeServe = true;
  } catch (error) {
    console.log('ℹ️ serve package not available');
  }

  try {
    // Check for Vite
    await runCommand('npx', ['vite', '--version'], { silent: true });
    capabilities.hasVitePreview = true;
  } catch (error) {
    console.log('ℹ️ Vite not available');
  }

  try {
    // Check for PM2
    await runCommand('pm2', ['--version'], { silent: true });
    capabilities.hasPM2 = true;
  } catch (error) {
    console.log('ℹ️ PM2 not available');
  }

  try {
    // Check for ps command
    await runCommand('ps', ['--version'], { silent: true });
    capabilities.hasPs = true;
  } catch (error) {
    console.log('ℹ️ ps command not available (minimal environment detected)');
    capabilities.isMinimal = true;
  }

  return capabilities;
}

async function startWithNodeServe() {
  const port = process.env.PORT || '25578';
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`🌐 Starting serve on ${host}:${port}...`);
  
  const serverProcess = spawn('npx', ['serve', '-s', 'dist', '-l', port, '-H', host], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_PERSISTENT: 'true',
      BACKUP_ENABLED: 'true'
    }
  });

  setupProcessHandlers(serverProcess);
  
  console.log(`✅ Server started at http://${host}:${port}`);
}

async function startWithVitePreview() {
  const port = process.env.PORT || '25578';
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`🌐 Starting Vite preview on ${host}:${port}...`);
  
  const serverProcess = spawn('npx', ['vite', 'preview', '--host', host, '--port', port], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_PERSISTENT: 'true',
      BACKUP_ENABLED: 'true'
    }
  });

  setupProcessHandlers(serverProcess);
  
  console.log(`✅ Server started at http://${host}:${port}`);
}

async function startWithBasicServer() {
  const port = process.env.PORT || '25578';
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`🌐 Starting basic HTTP server on ${host}:${port}...`);
  
  // Create a simple HTTP server
  const serverScript = `
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for SPA
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, 'dist', pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback to index.html for SPA routing
      fs.readFile(path.join(__dirname, 'dist', 'index.html'), (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } else {
      const ext = path.extname(filePath);
      const contentType = getContentType(ext);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

function getContentType(ext) {
  switch (ext) {
    case '.html': return 'text/html';
    case '.js': return 'application/javascript';
    case '.css': return 'text/css';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    default: return 'text/plain';
  }
}

server.listen(${port}, '${host}', () => {
  console.log('✅ Basic HTTP server started at http://${host}:${port}');
});
`;

  const serverPath = path.join(process.cwd(), 'basic-server.js');
  fs.writeFileSync(serverPath, serverScript);
  
  const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_PERSISTENT: 'true',
      BACKUP_ENABLED: 'true'
    }
  });

  setupProcessHandlers(serverProcess);
  
  // Clean up server file on exit
  process.on('exit', () => {
    try {
      fs.unlinkSync(serverPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });
}

function setupProcessHandlers(serverProcess) {
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
}

async function runScript(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  if (fs.existsSync(scriptPath)) {
    await runCommand('node', [scriptPath]);
  } else {
    console.warn(`⚠️ Script ${scriptName} not found, skipping...`);
  }
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Run fallback deployment
fallbackDeployment();