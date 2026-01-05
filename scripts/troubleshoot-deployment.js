#!/usr/bin/env node

/**
 * Deployment Troubleshooting Script
 * Diagnoses common deployment issues and provides automated fixes
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

console.log('🔧 Deployment Troubleshooting Tool...\n');

class DeploymentTroubleshooter {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.autoFix = process.argv.includes('--auto-fix');
    this.verbose = process.argv.includes('--verbose');
  }

  async diagnoseCommonIssues() {
    console.log('🔍 Diagnosing Common Deployment Issues...\n');
    
    await this.checkDotenvIssue();
    await this.checkConcurrentlyIssue();
    await this.checkPortIssues();
    await this.checkPermissionIssues();
    await this.checkMemoryIssues();
    await this.checkProcessManagementIssues();
    await this.checkBuildIssues();
    await this.checkEnvironmentIssues();
  }

  async checkDotenvIssue() {
    console.log('📦 Checking dotenv configuration...');
    
    try {
      // Check if dotenv is in dependencies
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (!packageJson.dependencies?.dotenv) {
        this.addIssue(
          'Missing dotenv dependency',
          'Cannot find module \'dotenv/config\' error on startup',
          'Add dotenv to package.json dependencies',
          async () => {
            console.log('  🔧 Installing dotenv...');
            execSync('npm install dotenv', { stdio: 'inherit' });
            return true;
          }
        );
      } else {
        console.log('  ✅ dotenv dependency found');
      }

      // Check if dotenv is actually installed
      const dotenvPath = path.join('node_modules', 'dotenv');
      if (!fs.existsSync(dotenvPath)) {
        this.addIssue(
          'dotenv not installed in node_modules',
          'Module exists in package.json but not in node_modules',
          'Run npm install to install dependencies',
          async () => {
            console.log('  🔧 Running npm install...');
            execSync('npm install', { stdio: 'inherit' });
            return true;
          }
        );
      }

      // Check environment file usage
      if (fs.existsSync('.env.local') || fs.existsSync('.env')) {
        console.log('  ✅ Environment files detected');
      } else {
        this.addIssue(
          'No environment files found',
          'Application may fail to load configuration',
          'Create .env.local file with required variables',
          async () => {
            console.log('  🔧 Creating .env.local from .env.example...');
            if (fs.existsSync('.env.example')) {
              fs.copyFileSync('.env.example', '.env.local');
              console.log('  ✅ Created .env.local from .env.example');
            } else {
              const defaultEnv = `NODE_ENV=production\nPORT=25578\n`;
              fs.writeFileSync('.env.local', defaultEnv);
              console.log('  ✅ Created basic .env.local file');
            }
            return true;
          }
        );
      }

    } catch (error) {
      this.addIssue(
        'Failed to check dotenv configuration',
        error.message,
        'Manually verify package.json and environment files'
      );
    }
  }

  async checkConcurrentlyIssue() {
    console.log('\n⚡ Checking concurrently compatibility...');
    
    try {
      // Check if concurrently is being used in production
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.scripts?.start?.includes('concurrently')) {
        this.addIssue(
          'concurrently used in production start script',
          'concurrently may fail in minimal containers (missing ps command)',
          'Use PM2 or simple process management for production',
          async () => {
            console.log('  🔧 Updating start script to use PM2...');
            packageJson.scripts.start = 'npm run start:pm2';
            packageJson.scripts['start:fallback'] = 'npm run build && node scripts/production-start.js';
            fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
            console.log('  ✅ Updated start script to use PM2');
            return true;
          }
        );
      }

      // Test if ps command is available
      try {
        execSync('ps --version', { stdio: 'pipe' });
        console.log('  ✅ ps command available');
      } catch (error) {
        this.addIssue(
          'ps command not available',
          'concurrently will fail without ps command',
          'Use alternative process management or install procps',
          async () => {
            console.log('  🔧 Creating fallback process management...');
            await this.createSimpleProcessManager();
            return true;
          }
        );
      }

    } catch (error) {
      console.log('  ⚠️  Could not check concurrently configuration');
    }
  }

  async checkPortIssues() {
    console.log('\n🌐 Checking port configuration...');
    
    const defaultPort = 25578;
    const envPort = process.env.PORT;
    
    if (!envPort) {
      this.addIssue(
        'PORT environment variable not set',
        'Application may not bind to correct port',
        'Set PORT environment variable',
        async () => {
          console.log('  🔧 Adding PORT to environment files...');
          const envFiles = ['.env.local', '.env.example'];
          
          for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
              let content = fs.readFileSync(envFile, 'utf8');
              if (!content.includes('PORT=')) {
                content += `\nPORT=${defaultPort}\n`;
                fs.writeFileSync(envFile, content);
                console.log(`  ✅ Added PORT to ${envFile}`);
              }
            }
          }
          return true;
        }
      );
    } else {
      console.log(`  ✅ PORT configured: ${envPort}`);
    }

    // Check if port is in use
    try {
      const port = envPort || defaultPort;
      execSync(`netstat -an | grep :${port}`, { stdio: 'pipe' });
      this.addIssue(
        `Port ${port} may be in use`,
        'Application startup may fail due to port conflict',
        'Use a different port or stop conflicting process'
      );
    } catch (error) {
      // Port is free, which is good
      console.log(`  ✅ Port ${envPort || defaultPort} appears to be available`);
    }
  }

  async checkPermissionIssues() {
    console.log('\n🔒 Checking file permissions...');
    
    const criticalPaths = [
      'package.json',
      'node_modules',
      'dist',
      'logs'
    ];

    for (const pathName of criticalPaths) {
      try {
        if (fs.existsSync(pathName)) {
          const stats = fs.statSync(pathName);
          
          // Check if we can read/write
          fs.accessSync(pathName, fs.constants.R_OK | fs.constants.W_OK);
          console.log(`  ✅ ${pathName} - permissions OK`);
        } else if (pathName === 'logs' || pathName === 'dist') {
          this.addIssue(
            `Missing ${pathName} directory`,
            'Application may fail to create logs or serve files',
            `Create ${pathName} directory with proper permissions`,
            async () => {
              console.log(`  🔧 Creating ${pathName} directory...`);
              fs.mkdirSync(pathName, { recursive: true });
              console.log(`  ✅ Created ${pathName} directory`);
              return true;
            }
          );
        }
      } catch (error) {
        this.addIssue(
          `Permission issue with ${pathName}`,
          error.message,
          `Fix permissions for ${pathName}`
        );
      }
    }
  }

  async checkMemoryIssues() {
    console.log('\n💾 Checking memory configuration...');
    
    const os = await import('os');
    const totalMemory = os.totalmem() / 1024 / 1024 / 1024; // GB
    console.log(`  System memory: ${totalMemory.toFixed(1)}GB`);
    
    if (totalMemory < 1) {
      this.addIssue(
        'Low system memory detected',
        'Application may run out of memory',
        'Configure memory limits and optimize for low-memory environments',
        async () => {
          console.log('  🔧 Configuring for low-memory environment...');
          
          // Update PM2 config for low memory
          if (fs.existsSync('ecosystem.config.cjs')) {
            let config = fs.readFileSync('ecosystem.config.cjs', 'utf8');
            if (!config.includes('max_memory_restart')) {
              config = config.replace(
                'autorestart: true,',
                'autorestart: true,\n      max_memory_restart: "512M",'
              );
              fs.writeFileSync('ecosystem.config.cjs', config);
              console.log('  ✅ Added memory limits to PM2 config');
            }
          }
          
          return true;
        }
      );
    } else {
      console.log('  ✅ Sufficient memory available');
    }
  }

  async checkProcessManagementIssues() {
    console.log('\n⚙️  Checking process management...');
    
    // Check PM2 configuration
    if (!fs.existsSync('ecosystem.config.cjs')) {
      this.addIssue(
        'Missing PM2 configuration',
        'No production process management configured',
        'Create PM2 ecosystem configuration',
        async () => {
          console.log('  🔧 Creating PM2 ecosystem configuration...');
          await this.createPM2Config();
          return true;
        }
      );
    } else {
      console.log('  ✅ PM2 configuration found');
      
      // Validate PM2 config
      try {
        const configPath = path.resolve('ecosystem.config.cjs');
        const { default: config } = await import(configPath);
        if (!config.apps || !Array.isArray(config.apps)) {
          throw new Error('Invalid apps configuration');
        }
        console.log('  ✅ PM2 configuration is valid');
      } catch (error) {
        this.addIssue(
          'Invalid PM2 configuration',
          error.message,
          'Fix PM2 ecosystem.config.cjs syntax'
        );
      }
    }

    // Check PM2 availability
    try {
      execSync('npx pm2 --version', { stdio: 'pipe' });
      console.log('  ✅ PM2 is available');
    } catch (error) {
      this.addIssue(
        'PM2 not available',
        'Production process manager not installed',
        'Install PM2 or use fallback process management',
        async () => {
          console.log('  🔧 Installing PM2...');
          execSync('npm install pm2', { stdio: 'inherit' });
          console.log('  ✅ PM2 installed');
          return true;
        }
      );
    }
  }

  async checkBuildIssues() {
    console.log('\n🏗️  Checking build configuration...');
    
    // Check if build artifacts exist
    if (!fs.existsSync('dist')) {
      this.addIssue(
        'No build artifacts found',
        'Application not built for production',
        'Run build process',
        async () => {
          console.log('  🔧 Running build process...');
          execSync('npm run build', { stdio: 'inherit' });
          console.log('  ✅ Build completed');
          return true;
        }
      );
    } else {
      console.log('  ✅ Build artifacts found');
    }

    // Check build configuration
    if (!fs.existsSync('vite.config.ts')) {
      this.addIssue(
        'Missing build configuration',
        'No Vite configuration found',
        'Create vite.config.ts file'
      );
    } else {
      console.log('  ✅ Build configuration found');
    }
  }

  async checkEnvironmentIssues() {
    console.log('\n🌍 Checking environment configuration...');
    
    const nodeEnv = process.env.NODE_ENV;
    
    if (nodeEnv !== 'production') {
      this.addIssue(
        'NODE_ENV not set to production',
        'Application running in development mode',
        'Set NODE_ENV=production for optimal performance',
        async () => {
          console.log('  🔧 Setting NODE_ENV to production...');
          
          const envFiles = ['.env.local'];
          for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
              let content = fs.readFileSync(envFile, 'utf8');
              if (content.includes('NODE_ENV=')) {
                content = content.replace(/NODE_ENV=.*/, 'NODE_ENV=production');
              } else {
                content += '\nNODE_ENV=production\n';
              }
              fs.writeFileSync(envFile, content);
              console.log(`  ✅ Updated NODE_ENV in ${envFile}`);
            }
          }
          return true;
        }
      );
    } else {
      console.log('  ✅ NODE_ENV set to production');
    }
  }

  addIssue(title, description, solution, autoFix = null) {
    this.issues.push({
      title,
      description,
      solution,
      autoFix
    });
  }

  async createPM2Config() {
    const config = `module.exports = {
  apps: [
    {
      name: "quantum-simulator-api",
      script: "tsx",
      args: "vite preview --host 0.0.0.0 --port 25578",
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 25578
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 25578
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 25579
      },
      env_pterodactyl: {
        NODE_ENV: "production",
        PORT: process.env.SERVER_PORT || 25578
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true
    }
  ]
};`;

    fs.writeFileSync('ecosystem.config.cjs', config);
    console.log('  ✅ Created PM2 ecosystem configuration');
  }

  async createSimpleProcessManager() {
    const script = `#!/usr/bin/env node

/**
 * Simple Process Manager - Fallback for environments without PM2
 */

import { spawn } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting application with simple process manager...');

// Ensure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true });
}

// Start the application
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
  console.log(\`Application exited with code \${code}\`);
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
`;

    fs.writeFileSync('scripts/production-start.js', script);
    console.log('  ✅ Created simple process manager');
  }

  async promptForFix(issue) {
    if (this.autoFix) return true;
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`Apply fix for "${issue.title}"? (y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async generateReport() {
    console.log('\n📋 Deployment Troubleshooting Report');
    console.log('=====================================\n');
    
    if (this.issues.length === 0) {
      console.log('🎉 No deployment issues detected! System appears ready for deployment.\n');
      return true;
    }

    console.log(`Found ${this.issues.length} potential issue(s):\n`);
    
    for (let i = 0; i < this.issues.length; i++) {
      const issue = this.issues[i];
      console.log(`${i + 1}. ❌ ${issue.title}`);
      console.log(`   Problem: ${issue.description}`);
      console.log(`   Solution: ${issue.solution}`);
      
      if (issue.autoFix) {
        console.log('   🔧 Automatic fix available');
        
        if (await this.promptForFix(issue)) {
          try {
            console.log('   Applying fix...');
            const success = await issue.autoFix();
            if (success) {
              console.log('   ✅ Fix applied successfully');
            } else {
              console.log('   ❌ Fix failed');
            }
          } catch (error) {
            console.log(`   ❌ Fix failed: ${error.message}`);
          }
        } else {
          console.log('   ⏭️  Skipped');
        }
      }
      
      console.log('');
    }
    
    return false;
  }
}

// Main execution
async function main() {
  const troubleshooter = new DeploymentTroubleshooter();
  
  try {
    await troubleshooter.diagnoseCommonIssues();
    const isHealthy = await troubleshooter.generateReport();
    
    if (isHealthy) {
      console.log('✅ Deployment troubleshooting completed - no issues found!');
      process.exit(0);
    } else {
      console.log('⚠️  Deployment issues detected. Review and apply fixes as needed.');
      console.log('💡 Run with --auto-fix to apply all available fixes automatically:');
      console.log('   node scripts/troubleshoot-deployment.js --auto-fix\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Troubleshooting failed:', error.message);
    process.exit(1);
  }
}

// Main execution
if (process.argv[1] && process.argv[1].endsWith('troubleshoot-deployment.js')) {
  main();
}

export default DeploymentTroubleshooter;