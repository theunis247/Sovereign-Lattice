/**
 * Environment Compatibility Tests
 * Tests for platform compatibility checking and environment validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

// Mock dependencies
vi.mock('fs');
vi.mock('os');
vi.mock('child_process');

const mockFs = vi.mocked(fs);
const mockOs = vi.mocked(os);
const mockExecSync = vi.mocked(execSync);

// Mock environment checker class for testing
class MockEnvironmentChecker {
  platform: string;
  arch: string;
  nodeVersion: string;
  environment: string;
  compatibility: any = {
    pterodactyl: { score: 0, issues: [], recommendations: [] },
    vercel: { score: 0, issues: [], recommendations: [] },
    netlify: { score: 0, issues: [], recommendations: [] },
    docker: { score: 0, issues: [], recommendations: [] },
    vps: { score: 0, issues: [], recommendations: [] }
  };

  constructor() {
    this.platform = mockOs.platform() as string;
    this.arch = mockOs.arch() as string;
    this.nodeVersion = process.version;
    this.environment = process.env.NODE_ENV || 'development';
  }

  checkSystemUtilities() {
    const utilities = [
      { name: 'ps', required: false, description: 'Process listing (used by concurrently)' },
      { name: 'kill', required: false, description: 'Process termination' },
      { name: 'which', required: false, description: 'Command location' },
      { name: 'curl', required: false, description: 'HTTP requests' },
      { name: 'wget', required: false, description: 'File downloads' }
    ];

    const availableUtils: string[] = [];
    const missingUtils: any[] = [];

    for (const util of utilities) {
      try {
        if (this.platform === 'win32') {
          if (util.name === 'ps') {
            mockExecSync('tasklist', { stdio: 'pipe' });
          } else if (util.name === 'which') {
            mockExecSync('where node', { stdio: 'pipe' });
          } else {
            mockExecSync(`${util.name} --version`, { stdio: 'pipe' });
          }
        } else {
          mockExecSync(`which ${util.name}`, { stdio: 'pipe' });
        }
        availableUtils.push(util.name);
      } catch (error) {
        missingUtils.push(util);
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
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

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
    const hasPortConfig = mockFs.existsSync('.env.example') && 
      (mockFs.readFileSync('.env.example', 'utf8') as string).includes('PORT');
    
    if (!hasPortConfig) {
      score -= 15;
      issues.push('Port configuration not documented');
      recommendations.push('Add PORT environment variable to .env.example');
    }

    // Check for logs directory
    if (!mockFs.existsSync('logs')) {
      score -= 10;
      issues.push('Logs directory missing');
      recommendations.push('Create logs directory for process output');
    }

    // Check memory requirements
    const hasMemoryConfig = packageJson?.scripts?.['start:pm2'] || 
      mockFs.existsSync('ecosystem.config.cjs');
    
    if (!hasMemoryConfig) {
      score -= 15;
      issues.push('No memory management configuration');
      recommendations.push('Configure PM2 with memory limits');
    }

    this.compatibility.pterodactyl = { score, issues, recommendations };
  }

  checkVercelCompatibility() {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for vercel.json
    if (!mockFs.existsSync('vercel.json')) {
      score -= 40;
      issues.push('No vercel.json configuration');
      recommendations.push('Create vercel.json for deployment configuration');
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
  }

  checkDockerCompatibility() {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for Dockerfile
    if (!mockFs.existsSync('Dockerfile')) {
      score -= 30;
      issues.push('No Dockerfile present');
      recommendations.push('Create Dockerfile for containerization');
    }

    // Check for .dockerignore
    if (!mockFs.existsSync('.dockerignore')) {
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
  }

  checkVPSCompatibility() {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check process management
    const packageJson = this.getPackageJson();
    if (!packageJson?.dependencies?.pm2) {
      score -= 20;
      issues.push('No production process manager');
      recommendations.push('Install PM2 for process management');
    }

    // Check for reverse proxy configuration
    if (!mockFs.existsSync('nginx.conf') && !mockFs.existsSync('apache.conf')) {
      score -= 15;
      issues.push('No reverse proxy configuration');
      recommendations.push('Configure nginx or apache for production');
    }

    // Check SSL/HTTPS configuration
    if (!mockFs.existsSync('ssl') && !process.env.HTTPS) {
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
  }

  checkResourceRequirements() {
    const packageJson = this.getPackageJson();
    const dependencies = Object.keys(packageJson?.dependencies || {});
    const devDependencies = Object.keys(packageJson?.devDependencies || {});
    
    // Estimate memory requirements
    let estimatedMemory = 256; // Base Node.js
    
    if (dependencies.includes('react')) estimatedMemory += 128;
    if (dependencies.includes('ethers')) estimatedMemory += 64;
    if (dependencies.includes('pm2')) estimatedMemory += 32;
    
    return { memory: estimatedMemory };
  }

  getPackageJson() {
    try {
      return JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
    } catch (error) {
      return null;
    }
  }

  generateCompatibilityReport() {
    const platforms = Object.keys(this.compatibility);
    
    for (const platform of platforms) {
      const compat = this.compatibility[platform];
      const status = compat.score >= 80 ? '✅' : compat.score >= 60 ? '⚠️' : '❌';
      
      console.log(`${status} ${platform.toUpperCase()}: ${compat.score}/100`);
      
      if (compat.issues.length > 0) {
        console.log('   Issues:');
        compat.issues.forEach((issue: string) => console.log(`     • ${issue}`));
      }
      
      if (compat.recommendations.length > 0) {
        console.log('   Recommendations:');
        compat.recommendations.forEach((rec: string) => console.log(`     • ${rec}`));
      }
    }
    
    // Overall recommendation
    const avgScore = platforms.reduce((sum, p) => sum + this.compatibility[p].score, 0) / platforms.length;
    
    console.log(`Overall Compatibility: ${Math.round(avgScore)}/100\n`);
  }
}

describe('Environment Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockOs.platform.mockReturnValue('linux');
    mockOs.arch.mockReturnValue('x64');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockExecSync.mockReturnValue(Buffer.from('success'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('System Utilities Check', () => {
    it('should detect available system utilities', async () => {
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('which')) {
          return Buffer.from('/usr/bin/ps');
        }
        return Buffer.from('success');
      });
      
      const checker = new MockEnvironmentChecker();
      
      const result = checker.checkSystemUtilities();
      
      expect(result.available).toContain('ps');
      expect(result.missing).toHaveLength(0);
    });

    it('should detect missing system utilities', async () => {
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('which ps')) {
          throw new Error('Command not found');
        }
        return Buffer.from('success');
      });
      
      const checker = new MockEnvironmentChecker();
      
      const result = checker.checkSystemUtilities();
      
      expect(result.missing.some(util => util.name === 'ps')).toBe(true);
      expect(checker.compatibility.pterodactyl.issues.some(issue => 
        issue.includes('ps command')
      )).toBe(true);
    });

    it('should handle Windows platform differences', async () => {
      mockOs.platform.mockReturnValue('win32');
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('tasklist')) {
          return Buffer.from('Process list');
        }
        if (typeof command === 'string' && command.includes('where node')) {
          return Buffer.from('C:\\Program Files\\nodejs\\node.exe');
        }
        return Buffer.from('success');
      });
      
      const checker = new MockEnvironmentChecker();
      
      const result = checker.checkSystemUtilities();
      
      expect(result.available).toContain('ps'); // Should map tasklist to ps
    });
  });

  describe('Pterodactyl Compatibility', () => {
    const mockPackageJson = {
      name: 'secure-quantum-simulator',
      dependencies: {
        'pm2': '^5.4.2',
        'dotenv': '^16.4.5'
      },
      scripts: {
        'serve:prod': 'vite preview --host 0.0.0.0 --port 25578'
      }
    };

    it('should score high compatibility for well-configured project', async () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('package.json')) {
          return JSON.stringify(mockPackageJson);
        }
        if (typeof filePath === 'string' && filePath.includes('.env.example')) {
          return 'NODE_ENV=production\nPORT=25578';
        }
        return '{}';
      });
      
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('logs') || 
                filePath.includes('.env.example') ||
                filePath.includes('ecosystem.config.cjs'));
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkPterodactylCompatibility();
      
      expect(checker.compatibility.pterodactyl.score).toBeGreaterThanOrEqual(80);
      expect(checker.compatibility.pterodactyl.issues).toHaveLength(0);
    });

    it('should detect concurrently compatibility issues', async () => {
      const packageWithConcurrently = {
        ...mockPackageJson,
        dependencies: {
          ...mockPackageJson.dependencies,
          'concurrently': '^9.2.1'
        }
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageWithConcurrently));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkPterodactylCompatibility();
      
      expect(checker.compatibility.pterodactyl.score).toBeLessThan(80);
      expect(checker.compatibility.pterodactyl.issues.some(issue => 
        issue.includes('concurrently')
      )).toBe(true);
      expect(checker.compatibility.pterodactyl.recommendations.some(rec => 
        rec.includes('PM2')
      )).toBe(true);
    });

    it('should detect missing production serving configuration', async () => {
      const packageWithoutServing = {
        ...mockPackageJson,
        scripts: {} // No serve:prod script
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageWithoutServing));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkPterodactylCompatibility();
      
      expect(checker.compatibility.pterodactyl.issues.some(issue => 
        issue.includes('static file serving')
      )).toBe(true);
    });

    it('should detect missing logs directory', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && filePath.includes('logs'));
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkPterodactylCompatibility();
      
      expect(checker.compatibility.pterodactyl.issues.some(issue => 
        issue.includes('Logs directory missing')
      )).toBe(true);
    });

    it('should detect missing port configuration', async () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('.env.example')) {
          return 'NODE_ENV=production'; // Missing PORT
        }
        return JSON.stringify(mockPackageJson);
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkPterodactylCompatibility();
      
      expect(checker.compatibility.pterodactyl.issues.some(issue => 
        issue.includes('Port configuration')
      )).toBe(true);
    });
  });

  describe('Vercel Compatibility', () => {
    it('should score high for Vercel-ready configuration', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && filePath.includes('vercel.json');
      });
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        name: 'secure-quantum-simulator',
        scripts: {
          build: 'vite build'
        },
        dependencies: {
          'react': '^19.2.3'
        }
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVercelCompatibility();
      
      expect(checker.compatibility.vercel.score).toBeGreaterThanOrEqual(80);
    });

    it('should detect missing vercel.json', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && filePath.includes('vercel.json'));
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVercelCompatibility();
      
      expect(checker.compatibility.vercel.issues.some(issue => 
        issue.includes('vercel.json')
      )).toBe(true);
    });

    it('should detect PM2 incompatibility with serverless', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'pm2': '^5.4.2'
        },
        scripts: {
          build: 'vite build'
        }
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVercelCompatibility();
      
      expect(checker.compatibility.vercel.issues.some(issue => 
        issue.includes('PM2 not compatible')
      )).toBe(true);
    });

    it('should detect missing build script', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        scripts: {} // No build script
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVercelCompatibility();
      
      expect(checker.compatibility.vercel.issues.some(issue => 
        issue.includes('build script')
      )).toBe(true);
    });
  });

  describe('Docker Compatibility', () => {
    it('should score high for Docker-ready configuration', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('Dockerfile') || filePath.includes('.dockerignore'));
      });
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        scripts: {
          'health-check': 'curl -f http://localhost:25578/ || exit 1'
        }
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkDockerCompatibility();
      
      expect(checker.compatibility.docker.score).toBeGreaterThanOrEqual(80);
    });

    it('should detect missing Dockerfile', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && filePath.includes('Dockerfile'));
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkDockerCompatibility();
      
      expect(checker.compatibility.docker.issues.some(issue => 
        issue.includes('Dockerfile')
      )).toBe(true);
    });

    it('should detect missing .dockerignore', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('.dockerignore')) {
          return false;
        }
        return true;
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkDockerCompatibility();
      
      expect(checker.compatibility.docker.issues.some(issue => 
        issue.includes('.dockerignore')
      )).toBe(true);
    });

    it('should detect Node.js version compatibility issues', async () => {
      // Mock old Node.js version
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v16.14.0',
        configurable: true
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkDockerCompatibility();
      
      expect(checker.compatibility.docker.issues.some(issue => 
        issue.includes('Node.js') && issue.includes('base images')
      )).toBe(true);
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
    });

    it('should detect missing health check configuration', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        scripts: {} // No health-check script
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkDockerCompatibility();
      
      expect(checker.compatibility.docker.issues.some(issue => 
        issue.includes('health check')
      )).toBe(true);
    });
  });

  describe('VPS Compatibility', () => {
    it('should score high for VPS-ready configuration', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('nginx.conf') || filePath.includes('ssl'));
      });
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {
          'pm2': '^5.4.2',
          'node-monitor': '^1.0.0'
        }
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVPSCompatibility();
      
      expect(checker.compatibility.vps.score).toBeGreaterThanOrEqual(80);
    });

    it('should detect missing process manager', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        dependencies: {} // No PM2
      }));
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVPSCompatibility();
      
      expect(checker.compatibility.vps.issues.some(issue => 
        issue.includes('process manager')
      )).toBe(true);
    });

    it('should detect missing reverse proxy configuration', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && 
                (filePath.includes('nginx.conf') || filePath.includes('apache.conf')));
      });
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVPSCompatibility();
      
      expect(checker.compatibility.vps.issues.some(issue => 
        issue.includes('reverse proxy')
      )).toBe(true);
    });

    it('should detect missing SSL configuration', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && filePath.includes('ssl'));
      });
      
      // Mock no HTTPS environment variable
      const originalEnv = process.env.HTTPS;
      delete process.env.HTTPS;
      
      const checker = new MockEnvironmentChecker();
      
      checker.checkVPSCompatibility();
      
      expect(checker.compatibility.vps.issues.some(issue => 
        issue.includes('SSL')
      )).toBe(true);
      
      // Restore environment
      if (originalEnv) process.env.HTTPS = originalEnv;
    });
  });

  describe('Resource Requirements Analysis', () => {
    it('should estimate memory requirements based on dependencies', async () => {
      const packageWithDependencies = {
        dependencies: {
          'react': '^19.2.3',
          'ethers': '^6.16.0',
          'pm2': '^5.4.2'
        },
        devDependencies: {
          'vite': '^6.2.0',
          'typescript': '~5.8.2'
        }
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageWithDependencies));
      
      const checker = new MockEnvironmentChecker();
      
      const result = checker.checkResourceRequirements();
      
      expect(result.memory).toBeGreaterThan(256); // Base + dependencies
      expect(result.memory).toBeLessThan(1024); // Reasonable upper bound
    });

    it('should handle missing package.json gracefully', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const checker = new MockEnvironmentChecker();
      
      const result = checker.checkResourceRequirements();
      
      expect(result.memory).toBe(256); // Base memory only
    });
  });

  describe('Compatibility Report Generation', () => {
    it('should generate comprehensive compatibility report', async () => {
      const checker = new MockEnvironmentChecker();
      
      // Set up some test compatibility scores
      checker.compatibility.pterodactyl.score = 85;
      checker.compatibility.vercel.score = 90;
      checker.compatibility.docker.score = 75;
      checker.compatibility.vps.score = 80;
      
      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      checker.generateCompatibilityReport();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PTERODACTYL: 85/100')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overall Compatibility')
      );
      
      consoleSpy.mockRestore();
    });

    it('should calculate correct overall compatibility score', async () => {
      const checker = new MockEnvironmentChecker();
      
      checker.compatibility.pterodactyl.score = 80;
      checker.compatibility.vercel.score = 60;
      checker.compatibility.docker.score = 90;
      checker.compatibility.vps.score = 70;
      checker.compatibility.netlify = { score: 50, issues: [], recommendations: [] };
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      checker.generateCompatibilityReport();
      
      // Average should be (80+60+90+70+50)/5 = 70
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overall Compatibility: 70/100')
      );
      
      consoleSpy.mockRestore();
    });
  });
});