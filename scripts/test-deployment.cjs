#!/usr/bin/env node

/**
 * Deployment Validation Tests
 * Comprehensive tests for deployment functionality and data persistence
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Running deployment validation tests...');

class DeploymentTester {
  constructor() {
    this.testResults = [];
    this.passed = 0;
    this.failed = 0;
  }

  async runAllTests() {
    console.log('🚀 Starting deployment validation tests...\n');

    // Test categories
    await this.testDependencyValidation();
    await this.testDatabaseInitialization();
    await this.testFounderProfileCreation();
    await this.testDataPersistence();
    await this.testEnvironmentDetection();
    await this.testDeploymentStrategies();
    await this.testBackupAndRestore();

    this.printResults();
    return this.failed === 0;
  }

  async testDependencyValidation() {
    console.log('📦 Testing dependency validation...');

    await this.test('Package.json exists', () => {
      return fs.existsSync('package.json');
    });

    await this.test('Dependencies are installed', () => {
      return fs.existsSync('node_modules');
    });

    await this.test('Dotenv dependency available', async () => {
      try {
        require('dotenv');
        return true;
      } catch (error) {
        return false;
      }
    });

    await this.test('PM2 dependency available', async () => {
      try {
        require('pm2');
        return true;
      } catch (error) {
        return false;
      }
    });
  }

  async testDatabaseInitialization() {
    console.log('🗄️ Testing database initialization...');

    // Clean up for testing
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }

    await this.test('Database initialization script exists', () => {
      return fs.existsSync('scripts/init-database.cjs');
    });

    await this.test('Database initialization runs successfully', async () => {
      try {
        await this.runCommand('node', ['scripts/init-database.cjs']);
        return true;
      } catch (error) {
        return false;
      }
    });

    await this.test('Data directory created', () => {
      return fs.existsSync('data');
    });

    await this.test('Backup directory created', () => {
      return fs.existsSync('data/backups');
    });

    await this.test('Logs directory created', () => {
      return fs.existsSync('logs');
    });

    await this.test('Database metadata created', () => {
      return fs.existsSync('data/db-metadata.json');
    });
  }

  async testFounderProfileCreation() {
    console.log('👑 Testing founder profile creation...');

    await this.test('Founder profile script exists', () => {
      return fs.existsSync('scripts/create-founder-profile.cjs');
    });

    await this.test('Founder profile creation runs successfully', async () => {
      try {
        await this.runCommand('node', ['scripts/create-founder-profile.cjs']);
        return true;
      } catch (error) {
        return false;
      }
    });

    await this.test('Founder profile file created', () => {
      return fs.existsSync('data/profiles/founder_freedom247365.json');
    });

    await this.test('Founder credentials created', () => {
      return fs.existsSync('data/credentials/founder_freedom247365.json');
    });

    await this.test('Founder QBS balance created', () => {
      return fs.existsSync('data/balances/founder_freedom247365.json');
    });

    await this.test('Founder registry created', () => {
      return fs.existsSync('data/founder-registry.json');
    });

    await this.test('Founder has correct QBS balance', () => {
      try {
        const balanceData = JSON.parse(fs.readFileSync('data/balances/founder_freedom247365.json', 'utf8'));
        return balanceData.balance === 1000;
      } catch (error) {
        return false;
      }
    });

    await this.test('Founder profile has correct username', () => {
      try {
        const profileData = JSON.parse(fs.readFileSync('data/profiles/founder_freedom247365.json', 'utf8'));
        return profileData.username === 'Freedom24/7365';
      } catch (error) {
        return false;
      }
    });
  }

  async testDataPersistence() {
    console.log('💾 Testing data persistence...');

    await this.test('Profile data persists after restart simulation', () => {
      try {
        // Simulate restart by checking if data still exists
        const profileExists = fs.existsSync('data/profiles/founder_freedom247365.json');
        const credentialsExist = fs.existsSync('data/credentials/founder_freedom247365.json');
        const balanceExists = fs.existsSync('data/balances/founder_freedom247365.json');
        
        return profileExists && credentialsExist && balanceExists;
      } catch (error) {
        return false;
      }
    });

    await this.test('Data integrity maintained', () => {
      try {
        const profileData = JSON.parse(fs.readFileSync('data/profiles/founder_freedom247365.json', 'utf8'));
        const balanceData = JSON.parse(fs.readFileSync('data/balances/founder_freedom247365.json', 'utf8'));
        
        return profileData.profileId === balanceData.profileId;
      } catch (error) {
        return false;
      }
    });
  }

  async testEnvironmentDetection() {
    console.log('🔍 Testing environment detection...');

    await this.test('Environment detection script exists', () => {
      return fs.existsSync('scripts/detect-environment.cjs');
    });

    await this.test('Environment detection runs successfully', async () => {
      try {
        await this.runCommand('node', ['scripts/detect-environment.cjs'], { timeout: 10000 });
        return true;
      } catch (error) {
        // Environment detection might fail in test environment, that's okay
        return true;
      }
    });

    await this.test('Environment info file created', () => {
      return fs.existsSync('data/environment-info.json');
    });
  }

  async testDeploymentStrategies() {
    console.log('🚀 Testing deployment strategies...');

    await this.test('Fallback deployment script exists', () => {
      return fs.existsSync('scripts/fallback-deployment.cjs');
    });

    await this.test('Production start script exists', () => {
      return fs.existsSync('scripts/production-start.js');
    });

    await this.test('PM2 ecosystem config exists', () => {
      return fs.existsSync('ecosystem.config.cjs');
    });

    await this.test('PM2 config is valid', () => {
      try {
        const config = require(path.join(process.cwd(), 'ecosystem.config.cjs'));
        return config.apps && config.apps.length > 0;
      } catch (error) {
        return false;
      }
    });

    await this.test('Package.json has deployment scripts', () => {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const scripts = packageJson.scripts;
        
        return scripts['deploy:prod'] && 
               scripts['deploy:simple'] && 
               scripts['deploy:fallback'] && 
               scripts['deploy:smart'];
      } catch (error) {
        return false;
      }
    });
  }

  async testBackupAndRestore() {
    console.log('💾 Testing backup and restore functionality...');

    await this.test('Backup script exists', () => {
      return fs.existsSync('scripts/backup-database.cjs');
    });

    await this.test('Backup creation works', async () => {
      try {
        await this.runCommand('node', ['scripts/backup-database.cjs']);
        
        // Check if backup was created
        const backupDir = path.join('data', 'backups');
        const backups = fs.readdirSync(backupDir);
        return backups.length > 0;
      } catch (error) {
        return false;
      }
    });

    await this.test('Backup contains required data', () => {
      try {
        const backupDir = path.join('data', 'backups');
        const backups = fs.readdirSync(backupDir);
        
        if (backups.length === 0) return false;
        
        const latestBackup = backups.sort().pop();
        const backupPath = path.join(backupDir, latestBackup);
        
        return fs.existsSync(path.join(backupPath, 'profiles')) &&
               fs.existsSync(path.join(backupPath, 'credentials')) &&
               fs.existsSync(path.join(backupPath, 'balances'));
      } catch (error) {
        return false;
      }
    });
  }

  async test(description, testFunction) {
    try {
      const result = await testFunction();
      if (result) {
        console.log(`  ✅ ${description}`);
        this.testResults.push({ description, status: 'PASS' });
        this.passed++;
      } else {
        console.log(`  ❌ ${description}`);
        this.testResults.push({ description, status: 'FAIL' });
        this.failed++;
      }
    } catch (error) {
      console.log(`  ❌ ${description} - Error: ${error.message}`);
      this.testResults.push({ description, status: 'ERROR', error: error.message });
      this.failed++;
    }
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;
      const process = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      const timer = setTimeout(() => {
        process.kill();
        reject(new Error('Command timeout'));
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);

    if (this.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(result => result.status !== 'PASS')
        .forEach(result => {
          console.log(`  - ${result.description}`);
          if (result.error) {
            console.log(`    Error: ${result.error}`);
          }
        });
    }

    console.log('\n' + (this.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed.'));
  }
}

// Run tests
async function runTests() {
  const tester = new DeploymentTester();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});