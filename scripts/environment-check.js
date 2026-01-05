#!/usr/bin/env node

/**
 * Environment Compatibility Checker
 * Checks compatibility with different hosting platforms and environments
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

console.log('🌍 Environment Compatibility Check...\n');

class EnvironmentChecker {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.nodeVersion = process.version;
    this.environment = process.env.NODE_ENV || 'development';
    this.compatibility = {
      pterodactyl: { score: 0, issues: [], recommendations: [] },
      vercel: { score: 0, issues: [], recommendations: [] },
      netlify: { score: 0, issues: [], recommendations: [] },
      docker: { score: 0, issues: [], recommendations: [] },
      vps: { score: 0, issues: [], recommendations: [] }
    };
  }

  checkSystemUtilities() {
    console.log('🔧 Checking System Utilities...');
    
    const utilities = [
      { name: 'ps', required: false, description: 'Process listing (used by concurrently)' },
      { name: 'kill', required: false, description: 'Process termination' },
      { name: 'which', required: false, description: 'Command location' },
      { name: 'curl', required: false, description: 'HTTP requests' },
      { name: 'wget', required: false, description: 'File downloads' }
    ];

    const availableUtils = [];
    const missingUtils = [];

    for (const util of utilities) {
      try {
        if (this.platform === 'win32') {
          // Windows equivalent checks
          if (util.name === 'ps') {
            execSync('tasklist', { stdio: 'pipe' });
          } else if (util.name === 'which') {
            execSync('where node', { stdio: 'pipe' });
          } else {
            execSync(`${util.name} --version`, { stdio: 'pipe' });
          }
        } else {
          execSync(`which ${util.name}`, { stdio: 'pipe' });
        }
        availableUtils.push(util.name);
        console.log(`  ✅ ${util.name} - ${util.description}`);
      } catch (error) {
        missingUtils.push(util);
        console.log(`  ❌ ${util.name} - ${util.description} (missing)`);
      }
    }

    // Impact on different platforms
    if (missingUtils.some(u => u.name === 'ps')) {
      this.compatibility.pterodactyl.issues.push('Missing ps command - concurrently may fail');
      this.compatibility.pterodactyl.recommendations.push('Use PM2 or simple process management');
      this.compatibility.docker.issues.push('Minimal container may lack ps command');
    }

    return { available: availableUtils, missing: missingUtils };
  }

  checkPterodactylCompatibility() {
    console.log('\n🦕 Pterodactyl Panel Compatibility...');
    
    let score = 100;
    const issues = [];
    const recommendations = [];

    // Check for Pterodactyl-specific requirements
    const packageJson = this.getPackageJson();
    
    // Check process management
    if (packageJson?.dependencies?.concurrently) {
      score -= 30;
      issues.push('concurrently may fail in minimal containers');
      recommendations.push('Use PM2 or implement fallback process management');
    }

    // Check for static file serving
    if (!packageJson?.scripts?.['serve:prod']) {
      score -= 20;
      issues.push('No production static file serving configured');
      recommendations.push('Add vite preview or static file server');
    }

    // Check port configuration
    const hasPortConfig = fs.existsSync('.env.example') && 
      fs.readFileSync('.env.example', 'utf8').includes('PORT');
    
    if (!hasPortConfig) {
      score -= 15;
      issues.push('Port configuration not documented');
      recommendations.push('Add PORT environment variable to .env.example');
    }

    // Check for logs directory
    if (!fs.existsSync('logs')) {
      score -= 10;
      issues.push('Logs directory missing');
      recommendations.push('Create logs directory for process output');
    }

    // Check memory requirements
    const hasMemoryConfig = packageJson?.scripts?.['start:pm2'] || 
      fs.existsSync('ecosystem.config.cjs');
    
    if (!hasMemoryConfig) {
      score -= 15;
      issues.push('No memory management configuration');
      recommendations.push('Configure PM2 with memory limits');
    }

    this.compatibility.pterodactyl = { score, issues, recommendations };
    
    console.log(`  Compatibility Score: ${score}/100`);
    if (score >= 80) console.log('  ✅ Excellent compatibility');
    else if (score >= 60) console.log('  ⚠️  Good compatibility with minor issues');
    else console.log('  ❌ Poor compatibility - significant issues');
  }

  checkVercelCompatibility() {
    console.log('\n▲ Vercel Compatibility...');
    
    let score = 100;
    const issues = [];
    const recommendations = [];

    // Check for vercel.json
    if (!fs.existsSync('vercel.json')) {
      score -= 40;
      issues.push('No vercel.json configuration');
      recommendations.push('Create vercel.json for deployment configuration');
    } else {
      console.log('  ✅ vercel.json found');
    }

    // Check build configuration
    const packageJson = this.getPackageJson();
    if (!packageJson?.scripts?.build) {
      score -= 30;
      issues.push('No build script configured');
      recommendations.push('Add build script to package.json');
    }

    // Check for serverless compatibility
    if (packageJson?.dependencies?.pm2) {
      score -= 20;
      issues.push('PM2 not compatible with serverless');
      recommendations.push('Use serverless-compatible process management');
    }

    this.compatibility.vercel = { score, issues, recommendations };
    console.log(`  Compatibility Score: ${score}/100`);
  }

  checkDockerCompatibility() {
    console.log('\n🐳 Docker Compatibility...');
    
    let score = 100;
    const issues = [];
    const recommendations = [];

    // Check for Dockerfile
    if (!fs.existsSync('Dockerfile')) {
      score -= 30;
      issues.push('No Dockerfile present');
      recommendations.push('Create Dockerfile for containerization');
    }

    // Check for .dockerignore
    if (!fs.existsSync('.dockerignore')) {
      score -= 15;
      issues.push('No .dockerignore file');
      recommendations.push('Create .dockerignore to optimize build context');
    }

    // Check Node.js version compatibility
    const nodeVersion = parseInt(this.nodeVersion.slice(1).split('.')[0]);
    if (nodeVersion < 18) {
      score -= 25;
      issues.push(`Node.js ${this.nodeVersion} may not be available in all base images`);
      recommendations.push('Use Node.js 18+ for better Docker image support');
    }

    // Check for health checks
    const packageJson = this.getPackageJson();
    if (!packageJson?.scripts?.['health-check']) {
      score -= 10;
      issues.push('No health check endpoint configured');
      recommendations.push('Add health check for container orchestration');
    }

    this.compatibility.docker = { score, issues, recommendations };
    console.log(`  Compatibility Score: ${score}/100`);
  }

  checkVPSCompatibility() {
    console.log('\n🖥️  VPS/Dedicated Server Compatibility...');
    
    let score = 100;
    const issues = [];
    const recommendations = [];

    // Check process management
    const packageJson = this.getPackageJson();
    if (!packageJson?.dependencies?.pm2) {
      score -= 20;
      issues.push('No production process manager');
      recommendations.push('Install PM2 for process management');
    }

    // Check for reverse proxy configuration
    if (!fs.existsSync('nginx.conf') && !fs.existsSync('apache.conf')) {
      score -= 15;
      issues.push('No reverse proxy configuration');
      recommendations.push('Configure nginx or apache for production');
    }

    // Check SSL/HTTPS configuration
    if (!fs.existsSync('ssl') && !process.env.HTTPS) {
      score -= 10;
      issues.push('No SSL configuration detected');
      recommendations.push('Configure SSL certificates for production');
    }

    // Check monitoring
    if (!packageJson?.dependencies?.['node-monitor']) {
      score -= 10;
      issues.push('No application monitoring configured');
      recommendations.push('Add monitoring for production deployment');
    }

    this.compatibility.vps = { score, issues, recommendations };
    console.log(`  Compatibility Score: ${score}/100`);
  }

  checkResourceRequirements() {
    console.log('\n📊 Resource Requirements Analysis...');
    
    const packageJson = this.getPackageJson();
    const dependencies = Object.keys(packageJson?.dependencies || {});
    const devDependencies = Object.keys(packageJson?.devDependencies || {});
    
    console.log(`  Dependencies: ${dependencies.length}`);
    console.log(`  Dev Dependencies: ${devDependencies.length}`);
    
    // Estimate memory requirements
    let estimatedMemory = 256; // Base Node.js
    
    if (dependencies.includes('react')) estimatedMemory += 128;
    if (dependencies.includes('ethers')) estimatedMemory += 64;
    if (dependencies.includes('pm2')) estimatedMemory += 32;
    
    console.log(`  Estimated Memory: ${estimatedMemory}MB minimum`);
    
    // Check disk space requirements
    try {
      const nodeModulesSize = this.getDirectorySize('node_modules');
      console.log(`  node_modules size: ${Math.round(nodeModulesSize / 1024 / 1024)}MB`);
    } catch (error) {
      console.log('  node_modules size: Unknown (not installed)');
    }
    
    return { memory: estimatedMemory };
  }

  getPackageJson() {
    try {
      return JSON.parse(fs.readFileSync('package.json', 'utf8'));
    } catch (error) {
      return null;
    }
  }

  getDirectorySize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    
    let size = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }

  generateCompatibilityReport() {
    console.log('\n📋 Platform Compatibility Report');
    console.log('==================================\n');
    
    const platforms = Object.keys(this.compatibility);
    
    for (const platform of platforms) {
      const compat = this.compatibility[platform];
      const status = compat.score >= 80 ? '✅' : compat.score >= 60 ? '⚠️' : '❌';
      
      console.log(`${status} ${platform.toUpperCase()}: ${compat.score}/100`);
      
      if (compat.issues.length > 0) {
        console.log('   Issues:');
        compat.issues.forEach(issue => console.log(`     • ${issue}`));
      }
      
      if (compat.recommendations.length > 0) {
        console.log('   Recommendations:');
        compat.recommendations.forEach(rec => console.log(`     • ${rec}`));
      }
      
      console.log('');
    }
    
    // Overall recommendation
    const avgScore = platforms.reduce((sum, p) => sum + this.compatibility[p].score, 0) / platforms.length;
    
    console.log(`Overall Compatibility: ${Math.round(avgScore)}/100\n`);
    
    if (avgScore >= 80) {
      console.log('🎉 Excellent cross-platform compatibility!');
    } else if (avgScore >= 60) {
      console.log('👍 Good compatibility with some platform-specific considerations.');
    } else {
      console.log('⚠️  Significant compatibility issues detected. Review recommendations.');
    }
  }

  async runFullCheck() {
    console.log(`Platform: ${this.platform} ${this.arch}`);
    console.log(`Node.js: ${this.nodeVersion}`);
    console.log(`Environment: ${this.environment}\n`);
    
    this.checkSystemUtilities();
    this.checkPterodactylCompatibility();
    this.checkVercelCompatibility();
    this.checkDockerCompatibility();
    this.checkVPSCompatibility();
    this.checkResourceRequirements();
    this.generateCompatibilityReport();
  }
}

// Main execution
async function main() {
  const checker = new EnvironmentChecker();
  
  try {
    await checker.runFullCheck();
    
    // Exit with appropriate code
    const avgScore = Object.values(checker.compatibility)
      .reduce((sum, compat) => sum + compat.score, 0) / Object.keys(checker.compatibility).length;
    
    process.exit(avgScore >= 60 ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Environment check failed:', error.message);
    process.exit(1);
  }
}

// Main execution
if (process.argv[1] && process.argv[1].endsWith('environment-check.js')) {
  main();
}

export default EnvironmentChecker;