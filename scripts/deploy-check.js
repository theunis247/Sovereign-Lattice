#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates runtime dependencies and environment requirements for deployment
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running Deployment Validation...\n');

class DeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.packageJson = null;
  }

  async validateRuntimeDependencies() {
    console.log('📦 Validating Runtime Dependencies...');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      this.packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDependencies = [
        'dotenv',
        'tsx',
        'pm2',
        'react',
        'react-dom',
        'ethers'
      ];

      const dependencies = { ...this.packageJson.dependencies, ...this.packageJson.devDependencies };
      
      for (const dep of requiredDependencies) {
        if (!dependencies[dep]) {
          this.errors.push(`Missing required dependency: ${dep}`);
          this.fixes.push(`npm install ${dep}`);
        } else {
          console.log(`  ✅ ${dep} - ${dependencies[dep]}`);
        }
      }

      // Check for critical runtime modules
      const criticalModules = ['dotenv', 'tsx'];
      for (const module of criticalModules) {
        try {
          const modulePath = path.join(process.cwd(), 'node_modules', module);
          if (!fs.existsSync(modulePath)) {
            this.errors.push(`Critical module ${module} not installed in node_modules`);
            this.fixes.push(`npm install ${module}`);
          }
        } catch (error) {
          this.errors.push(`Cannot verify ${module} installation: ${error.message}`);
        }
      }

      // Validate package.json structure
      if (!this.packageJson.name || this.packageJson.name.includes(' ')) {
        this.warnings.push('Package name should follow npm naming conventions');
        this.fixes.push('Update package.json name to use kebab-case without spaces');
      }

      if (!this.packageJson.scripts || !this.packageJson.scripts.start) {
        this.warnings.push('Missing start script in package.json');
        this.fixes.push('Add "start" script to package.json');
      }

    } catch (error) {
      this.errors.push(`Failed to validate dependencies: ${error.message}`);
    }
  }

  async validateEnvironmentFiles() {
    console.log('\n🌍 Validating Environment Configuration...');
    
    const envFiles = ['.env.example', '.env.local'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        console.log(`  ✅ ${envFile} found`);
        
        // Check for required environment variables
        const envContent = fs.readFileSync(envPath, 'utf8');
        const requiredVars = ['NODE_ENV', 'PORT'];
        
        for (const varName of requiredVars) {
          if (!envContent.includes(varName)) {
            this.warnings.push(`${envFile} missing ${varName} variable`);
          }
        }
      } else {
        if (envFile === '.env.example') {
          this.warnings.push(`${envFile} not found - recommended for documentation`);
        }
      }
    }
  }

  async validateBuildArtifacts() {
    console.log('\n🏗️  Validating Build Configuration...');
    
    // Check for build configuration files
    const configFiles = ['vite.config.ts', 'tsconfig.json'];
    
    for (const configFile of configFiles) {
      const configPath = path.join(process.cwd(), configFile);
      if (fs.existsSync(configPath)) {
        console.log(`  ✅ ${configFile} found`);
      } else {
        this.errors.push(`Missing build configuration: ${configFile}`);
      }
    }

    // Check if dist directory exists or can be created
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      this.warnings.push('dist directory not found - will be created during build');
    } else {
      console.log('  ✅ dist directory exists');
    }
  }

  async validateProcessManagement() {
    console.log('\n⚙️  Validating Process Management...');
    
    // Check PM2 configuration
    const pm2ConfigPath = path.join(process.cwd(), 'ecosystem.config.cjs');
    if (fs.existsSync(pm2ConfigPath)) {
      console.log('  ✅ PM2 ecosystem.config.cjs found');
      
      try {
        // Validate PM2 config syntax by reading and parsing the file
        const configContent = fs.readFileSync(pm2ConfigPath, 'utf8');
        // Basic syntax validation - check if it's valid JavaScript
        if (configContent.includes('module.exports') && configContent.includes('apps')) {
          console.log('  ✅ PM2 configuration appears valid');
        } else {
          throw new Error('Invalid PM2 configuration structure');
        }
      } catch (error) {
        this.errors.push(`PM2 configuration syntax error: ${error.message}`);
      }
    } else {
      this.warnings.push('PM2 ecosystem.config.cjs not found');
      this.fixes.push('Create PM2 configuration for production deployment');
    }

    // Check PM2 availability
    try {
      execSync('npx pm2 --version', { stdio: 'pipe' });
      console.log('  ✅ PM2 available');
    } catch (error) {
      this.warnings.push('PM2 not available - fallback to simple process management');
    }
  }

  async validateNodeVersion() {
    console.log('\n🟢 Validating Node.js Environment...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    console.log(`  Node.js version: ${nodeVersion}`);
    
    if (majorVersion < 18) {
      this.errors.push(`Node.js ${nodeVersion} is too old. Minimum required: 18.x`);
      this.fixes.push('Upgrade Node.js to version 18 or higher');
    } else {
      console.log('  ✅ Node.js version compatible');
    }

    // Check npm version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`  npm version: ${npmVersion}`);
      console.log('  ✅ npm available');
    } catch (error) {
      this.errors.push('npm not available');
    }
  }

  generateReport() {
    console.log('\n📊 Deployment Validation Report');
    console.log('================================\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All validation checks passed! Ready for deployment.\n');
      return true;
    }

    if (this.errors.length > 0) {
      console.log('❌ Critical Issues (must fix before deployment):');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings (recommended to fix):');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    if (this.fixes.length > 0) {
      console.log('🔧 Suggested Fixes:');
      this.fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
      console.log('');
    }

    return this.errors.length === 0;
  }

  async installMissingDependencies() {
    if (this.errors.some(error => error.includes('Missing required dependency'))) {
      console.log('🔧 Attempting to install missing dependencies...');
      
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        return false;
      }
    }
    return true;
  }
}

// Main execution
async function main() {
  const validator = new DeploymentValidator();
  
  try {
    await validator.validateNodeVersion();
    await validator.validateRuntimeDependencies();
    await validator.validateEnvironmentFiles();
    await validator.validateBuildArtifacts();
    await validator.validateProcessManagement();
    
    const isValid = validator.generateReport();
    
    if (!isValid) {
      console.log('💡 Run with --fix flag to attempt automatic fixes:');
      console.log('   node scripts/deploy-check.js --fix\n');
      
      if (process.argv.includes('--fix')) {
        console.log('🔧 Attempting automatic fixes...\n');
        await validator.installMissingDependencies();
        
        // Re-run validation
        console.log('🔄 Re-running validation...\n');
        const newValidator = new DeploymentValidator();
        await newValidator.validateRuntimeDependencies();
        newValidator.generateReport();
      }
      
      process.exit(1);
    }
    
    console.log('✅ Deployment validation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Main execution
if (process.argv[1] && process.argv[1].endsWith('deploy-check.js')) {
  main();
}

export default DeploymentValidator;