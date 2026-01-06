#!/usr/bin/env node

/**
 * Environment Detection Script
 * Detects hosting environment and chooses appropriate deployment strategy
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Detecting deployment environment...');

async function detectEnvironment() {
  try {
    const environment = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      isPterodactyl: false,
      isDocker: false,
      isVPS: false,
      isMinimal: false,
      hasSystemCommands: {
        ps: false,
        systemctl: false,
        pm2: false,
        serve: false,
        vite: false
      },
      recommendedStrategy: 'fallback'
    };

    // Detect Pterodactyl environment
    if (process.env.P_SERVER_UUID || fs.existsSync('/home/container')) {
      environment.isPterodactyl = true;
      environment.isMinimal = true;
      console.log('🦕 Pterodactyl environment detected');
    }

    // Detect Docker environment
    if (fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER) {
      environment.isDocker = true;
      console.log('🐳 Docker environment detected');
    }

    // Check for system commands
    for (const command of Object.keys(environment.hasSystemCommands)) {
      try {
        await runCommand(command, ['--version'], { silent: true });
        environment.hasSystemCommands[command] = true;
        console.log(`✅ ${command} available`);
      } catch (error) {
        console.log(`❌ ${command} not available`);
      }
    }

    // Determine if environment is minimal
    if (!environment.hasSystemCommands.ps || !environment.hasSystemCommands.systemctl) {
      environment.isMinimal = true;
    }

    // Recommend deployment strategy
    if (environment.hasSystemCommands.pm2 && !environment.isMinimal) {
      environment.recommendedStrategy = 'pm2';
    } else if (environment.hasSystemCommands.serve) {
      environment.recommendedStrategy = 'serve';
    } else if (environment.hasSystemCommands.vite) {
      environment.recommendedStrategy = 'vite-preview';
    } else {
      environment.recommendedStrategy = 'fallback';
    }

    console.log('🎯 Environment analysis complete:');
    console.log(`   Platform: ${environment.platform}`);
    console.log(`   Architecture: ${environment.arch}`);
    console.log(`   Node.js: ${environment.nodeVersion}`);
    console.log(`   Pterodactyl: ${environment.isPterodactyl}`);
    console.log(`   Docker: ${environment.isDocker}`);
    console.log(`   Minimal: ${environment.isMinimal}`);
    console.log(`   Recommended Strategy: ${environment.recommendedStrategy}`);

    // Save environment info
    const envInfoPath = path.join(process.cwd(), 'data', 'environment-info.json');
    if (!fs.existsSync(path.dirname(envInfoPath))) {
      fs.mkdirSync(path.dirname(envInfoPath), { recursive: true });
    }
    fs.writeFileSync(envInfoPath, JSON.stringify(environment, null, 2));

    // Execute recommended deployment strategy
    await executeDeploymentStrategy(environment.recommendedStrategy);

    return environment;
  } catch (error) {
    console.error('❌ Environment detection failed:', error.message);
    console.log('🔄 Falling back to basic deployment...');
    await executeDeploymentStrategy('fallback');
  }
}

async function executeDeploymentStrategy(strategy) {
  console.log(`🚀 Executing ${strategy} deployment strategy...`);

  switch (strategy) {
    case 'pm2':
      await runCommand('npm', ['run', 'deploy:prod']);
      break;
    
    case 'serve':
      await runCommand('npm', ['run', 'deploy:simple']);
      break;
    
    case 'vite-preview':
      await runCommand('npm', ['run', 'profile:setup']);
      await runCommand('npm', ['run', 'build']);
      await runCommand('npm', ['run', 'serve:prod']);
      break;
    
    case 'fallback':
    default:
      await runCommand('node', [path.join(__dirname, 'fallback-deployment.cjs')]);
      break;
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

// Run environment detection
detectEnvironment();