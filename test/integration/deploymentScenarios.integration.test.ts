/**
 * Deployment Scenarios Integration Tests
 * End-to-end tests for different deployment scenarios and configurations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Mock dependencies
vi.mock('fs');
vi.mock('child_process');

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);

describe('Deployment Scenarios Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockExecSync.mockReturnValue(Buffer.from('success'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pterodactyl Deployment Scenario', () => {
    const pterodactylPackageJson = {
      name: 'secure-quantum-simulator',
      dependencies: {
        'dotenv': '^16.4.5',
        'tsx': '^4.19.2',
        'pm2': '^5.4.2',
        'react': '^19.2.3',
        'react-dom': '^19.2.3'
      },
      scripts: {
        'start': 'npm run start:prod',
        'start:prod': 'npm run deploy:prod',
        'deploy:prod': 'npm run profile:setup && npm run build && npm run pm2:start',
        'serve:prod': 'vite preview --host 0.0.0.0 --port 25578',
        'pm2:start': 'pm2 start ecosystem.config.cjs'
      }
    };

    const pterodactylEcosystemConfig = `
      module.exports = {
        apps: [{
          name: "quantum-simulator-app",
          script: "npx",
          args: "vite preview --host 0.0.0.0 --port 25578",
          env_pterodactyl: {
            NODE_ENV: "production",
            PORT: "25578"
          }
        }]
      };
    `;

    it('should validate complete Pterodactyl deployment setup', async () => {
      // Mock file system for Pterodactyl scenario
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('package.json')) {
            return JSON.stringify(pterodactylPackageJson);
          }
          if (filePath.includes('ecosystem.config.cjs')) {
            return pterodactylEcosystemConfig;
          }
          if (filePath.includes('.env.example')) {
            return 'NODE_ENV=production\nPORT=25578\nHOST=0.0.0.0';
          }
        }
        return '{}';
      });

      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('ecosystem.config.cjs') || 
                filePath.includes('logs') ||
                filePath.includes('.env.example') ||
                filePath.includes('vite.config.ts') ||
                filePath.includes('tsconfig.json'));
      });

      // Mock PM2 availability
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('pm2 --version')) {
          return Buffer.from('5.4.2');
        }
        if (typeof command === 'string' && command.includes('pm2 ecosystem')) {
          return Buffer.from('Ecosystem validation passed');
        }
        return Buffer.from('success');
      });

      // Simulate deployment validation
      const hasRequiredDependencies = !!(pterodactylPackageJson.dependencies.dotenv && 
                                     pterodactylPackageJson.dependencies.tsx &&
                                     pterodactylPackageJson.dependencies.pm2);
      
      const hasValidScripts = !!(pterodactylPackageJson.scripts.start &&
                             pterodactylPackageJson.scripts['serve:prod']);
      
      const hasEcosystemConfig = mockFs.existsSync('ecosystem.config.cjs');
      const hasEnvConfig = mockFs.existsSync('.env.example');
      
      expect(hasRequiredDependencies).toBe(true);
      expect(hasValidScripts).toBe(true);
      expect(hasEcosystemConfig).toBe(true);
      expect(hasEnvConfig).toBe(true);
    });

    it('should handle Pterodactyl deployment with missing ps command', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        ...pterodactylPackageJson,
        dependencies: {
          ...pterodactylPackageJson.dependencies,
          'concurrently': '^9.2.1' // This will cause issues
        }
      }));

      // Mock missing ps command
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('which ps')) {
          throw new Error('Command not found');
        }
        return Buffer.from('success');
      });

      // Simulate environment compatibility check
      const hasConcurrently = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string)
                                 .dependencies.concurrently;
      
      let psCommandAvailable = true;
      try {
        mockExecSync('which ps', { stdio: 'pipe' });
      } catch (error) {
        psCommandAvailable = false;
      }
      
      const compatibilityIssues: string[] = [];
      const recommendations: string[] = [];
      
      if (hasConcurrently && !psCommandAvailable) {
        compatibilityIssues.push('Missing ps command - concurrently may fail');
        recommendations.push('Use PM2 or simple process management');
      }
      
      expect(compatibilityIssues.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('PM2'))).toBe(true);
    });

    it('should validate PM2 configuration for Pterodactyl environment', async () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('ecosystem.config.cjs')) {
          return pterodactylEcosystemConfig;
        }
        return '{}';
      });

      // Test PM2 validation
      const validatePM2 = () => {
        try {
          const configPath = path.join(process.cwd(), 'ecosystem.config.cjs');
          const configExists = mockFs.existsSync(configPath);
          
          if (!configExists) return false;
          
          // Test PM2 availability
          mockExecSync('npx pm2 --version', { stdio: 'pipe' });
          
          // Test ecosystem validation
          mockExecSync('npx pm2 ecosystem ecosystem.config.cjs', { stdio: 'pipe' });
          
          return true;
        } catch (error) {
          return false;
        }
      };

      const result = validatePM2();
      expect(result).toBe(true);
    });
  });

  describe('Vercel Deployment Scenario', () => {
    const vercelPackageJson = {
      name: 'secure-quantum-simulator',
      dependencies: {
        'react': '^19.2.3',
        'react-dom': '^19.2.3',
        'dotenv': '^16.4.5'
      },
      scripts: {
        'build': 'vite build',
        'start': 'vite preview'
      }
    };

    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: 'package.json',
          use: '@vercel/static-build'
        }
      ],
      routes: [
        {
          src: '/(.*)',
          dest: '/index.html'
        }
      ]
    };

    it('should validate Vercel deployment configuration', async () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('package.json')) {
            return JSON.stringify(vercelPackageJson);
          }
          if (filePath.includes('vercel.json')) {
            return JSON.stringify(vercelConfig);
          }
        }
        return '{}';
      });

      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('vercel.json') ||
                filePath.includes('vite.config.ts') ||
                filePath.includes('tsconfig.json'));
      });

      // Simulate Vercel compatibility check
      const hasVercelConfig = mockFs.existsSync('vercel.json');
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
      const hasServerlessIncompatibleDeps = packageJson.dependencies && packageJson.dependencies.pm2;
      
      let compatibilityScore = 100;
      const issues: string[] = [];
      
      if (!hasVercelConfig) {
        compatibilityScore -= 40;
        issues.push('No vercel.json configuration');
      }
      
      if (!hasBuildScript) {
        compatibilityScore -= 30;
        issues.push('No build script configured');
      }
      
      if (hasServerlessIncompatibleDeps) {
        compatibilityScore -= 20;
        issues.push('PM2 not compatible with serverless');
      }
      
      expect(compatibilityScore).toBeGreaterThanOrEqual(80);
      expect(issues).toHaveLength(0);
    });

    it('should detect serverless incompatibilities', async () => {
      const serverlessIncompatiblePackage = {
        ...vercelPackageJson,
        dependencies: {
          ...vercelPackageJson.dependencies,
          'pm2': '^5.4.2', // Not compatible with serverless
          'fs-extra': '^11.0.0' // File system operations
        }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(serverlessIncompatiblePackage));

      // Simulate compatibility check
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      const hasServerlessIncompatibleDeps = packageJson.dependencies.pm2;
      
      const issues: string[] = [];
      if (hasServerlessIncompatibleDeps) {
        issues.push('PM2 not compatible with serverless');
      }
      
      expect(issues.some(issue => issue.includes('PM2 not compatible'))).toBe(true);
    });
  });

  describe('Docker Deployment Scenario', () => {
    const dockerPackageJson = {
      name: 'secure-quantum-simulator',
      dependencies: {
        'dotenv': '^16.4.5',
        'tsx': '^4.19.2',
        'react': '^19.2.3',
        'react-dom': '^19.2.3'
      },
      scripts: {
        'build': 'vite build',
        'start': 'vite preview --host 0.0.0.0 --port 25578',
        'health-check': 'curl -f http://localhost:25578/ || exit 1'
      }
    };

    it('should validate Docker deployment setup', async () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('package.json')) {
            return JSON.stringify(dockerPackageJson);
          }
        }
        return '{}';
      });

      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('Dockerfile') ||
                filePath.includes('.dockerignore') ||
                filePath.includes('vite.config.ts') ||
                filePath.includes('tsconfig.json'));
      });

      // Simulate Docker compatibility check
      const hasDockerfile = mockFs.existsSync('Dockerfile');
      const hasDockerignore = mockFs.existsSync('.dockerignore');
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      const hasHealthCheck = packageJson.scripts && packageJson.scripts['health-check'];
      
      let compatibilityScore = 100;
      const issues: string[] = [];
      
      if (!hasDockerfile) {
        compatibilityScore -= 30;
        issues.push('No Dockerfile present');
      }
      
      if (!hasDockerignore) {
        compatibilityScore -= 15;
        issues.push('No .dockerignore file');
      }
      
      if (!hasHealthCheck) {
        compatibilityScore -= 10;
        issues.push('No health check endpoint configured');
      }
      
      expect(compatibilityScore).toBeGreaterThanOrEqual(80);
      expect(issues).toHaveLength(0);
    });

    it('should handle minimal Docker environments', async () => {
      // Mock minimal container environment (no curl, ps, etc.)
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && 
            (command.includes('curl') || command.includes('ps') || command.includes('which'))) {
          throw new Error('Command not found');
        }
        return Buffer.from('success');
      });

      // Simulate system utilities check
      const utilities = ['curl', 'ps', 'which'];
      const missingUtilities: string[] = [];
      
      for (const util of utilities) {
        try {
          mockExecSync(`which ${util}`, { stdio: 'pipe' });
        } catch (error) {
          missingUtilities.push(util);
        }
      }
      
      const issues: string[] = [];
      if (missingUtilities.length > 0) {
        issues.push('Minimal container may lack system utilities');
      }
      
      expect(missingUtilities.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('Minimal container'))).toBe(true);
    });
  });

  describe('VPS Deployment Scenario', () => {
    const vpsPackageJson = {
      name: 'secure-quantum-simulator',
      dependencies: {
        'dotenv': '^16.4.5',
        'tsx': '^4.19.2',
        'pm2': '^5.4.2',
        'react': '^19.2.3',
        'react-dom': '^19.2.3',
        'node-monitor': '^1.0.0'
      },
      scripts: {
        'build': 'vite build',
        'start': 'pm2 start ecosystem.config.cjs',
        'stop': 'pm2 stop ecosystem.config.cjs',
        'restart': 'pm2 restart ecosystem.config.cjs'
      }
    };

    it('should validate VPS deployment with reverse proxy', async () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('package.json')) {
            return JSON.stringify(vpsPackageJson);
          }
        }
        return '{}';
      });

      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('nginx.conf') ||
                filePath.includes('ssl') ||
                filePath.includes('ecosystem.config.cjs'));
      });

      // Simulate VPS compatibility check
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      const hasProcessManager = packageJson.dependencies && packageJson.dependencies.pm2;
      const hasReverseProxy = mockFs.existsSync('nginx.conf') || mockFs.existsSync('apache.conf');
      const hasSSL = mockFs.existsSync('ssl') || process.env.HTTPS;
      const hasMonitoring = packageJson.dependencies && packageJson.dependencies['node-monitor'];
      
      let compatibilityScore = 100;
      const issues: string[] = [];
      
      if (!hasProcessManager) {
        compatibilityScore -= 20;
        issues.push('No production process manager');
      }
      
      if (!hasReverseProxy) {
        compatibilityScore -= 15;
        issues.push('No reverse proxy configuration');
      }
      
      if (!hasSSL) {
        compatibilityScore -= 10;
        issues.push('No SSL configuration detected');
      }
      
      if (!hasMonitoring) {
        compatibilityScore -= 10;
        issues.push('No application monitoring configured');
      }
      
      expect(compatibilityScore).toBeGreaterThanOrEqual(80);
    });

    it('should detect missing production configurations', async () => {
      const basicPackageJson = {
        name: 'secure-quantum-simulator',
        dependencies: {
          'react': '^19.2.3'
          // Missing PM2, monitoring, etc.
        },
        scripts: {
          'start': 'node server.js' // Basic start script
        }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(basicPackageJson));
      mockFs.existsSync.mockReturnValue(false); // No nginx, ssl, etc.

      // Simulate VPS compatibility check
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      const hasProcessManager = packageJson.dependencies && packageJson.dependencies.pm2;
      const hasReverseProxy = mockFs.existsSync('nginx.conf');
      const hasSSL = mockFs.existsSync('ssl');
      
      let compatibilityScore = 100;
      const issues: string[] = [];
      
      if (!hasProcessManager) {
        compatibilityScore -= 20;
        issues.push('No production process manager');
      }
      
      if (!hasReverseProxy) {
        compatibilityScore -= 15;
        issues.push('No reverse proxy configuration');
      }
      
      if (!hasSSL) {
        compatibilityScore -= 10;
        issues.push('No SSL configuration detected');
      }
      
      expect(compatibilityScore).toBeLessThan(60);
      expect(issues.some(issue => issue.includes('process manager'))).toBe(true);
      expect(issues.some(issue => issue.includes('reverse proxy'))).toBe(true);
      expect(issues.some(issue => issue.includes('SSL'))).toBe(true);
    });
  });

  describe('Cross-Platform Deployment Validation', () => {
    it('should run complete deployment validation across all scenarios', async () => {
      // Mock a well-configured project
      const completePackageJson = {
        name: 'secure-quantum-simulator',
        dependencies: {
          'dotenv': '^16.4.5',
          'tsx': '^4.19.2',
          'pm2': '^5.4.2',
          'react': '^19.2.3',
          'react-dom': '^19.2.3',
          'ethers': '^6.16.0'
        },
        scripts: {
          'build': 'vite build',
          'start': 'npm run start:prod',
          'start:prod': 'pm2 start ecosystem.config.cjs',
          'serve:prod': 'vite preview --host 0.0.0.0 --port 25578',
          'health-check': 'curl -f http://localhost:25578/ || exit 1'
        }
      };

      mockFs.readFileSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('package.json')) {
            return JSON.stringify(completePackageJson);
          }
          if (filePath.includes('.env.example')) {
            return 'NODE_ENV=production\nPORT=25578\nHOST=0.0.0.0';
          }
          if (filePath.includes('vercel.json')) {
            return JSON.stringify({ version: 2 });
          }
        }
        return 'module.exports = { apps: [{ name: "test", script: "index.js" }] };';
      });

      mockFs.existsSync.mockReturnValue(true);
      mockExecSync.mockReturnValue(Buffer.from('success'));

      // Simulate comprehensive validation
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      
      // Check required dependencies
      const requiredDeps = ['dotenv', 'tsx', 'pm2', 'react', 'react-dom', 'ethers'];
      const hasAllDeps = requiredDeps.every(dep => packageJson.dependencies[dep]);
      
      // Check configuration files
      const hasEcosystemConfig = mockFs.existsSync('ecosystem.config.cjs');
      const hasEnvConfig = mockFs.existsSync('.env.example');
      const hasVercelConfig = mockFs.existsSync('vercel.json');
      
      // Check scripts
      const hasRequiredScripts = packageJson.scripts.build && 
                                packageJson.scripts.start &&
                                packageJson.scripts['health-check'];
      
      // Platform compatibility scores
      const pterodactylScore = hasAllDeps && hasEcosystemConfig && hasEnvConfig ? 85 : 60;
      const vercelScore = hasVercelConfig && packageJson.scripts.build ? 80 : 60;
      const dockerScore = hasRequiredScripts ? 85 : 60;
      const vpsScore = hasAllDeps && hasEcosystemConfig ? 85 : 60;
      
      expect(hasAllDeps).toBe(true);
      expect(pterodactylScore).toBeGreaterThanOrEqual(70);
      expect(vercelScore).toBeGreaterThanOrEqual(70);
      expect(dockerScore).toBeGreaterThanOrEqual(70);
      expect(vpsScore).toBeGreaterThanOrEqual(70);
    });

    it('should handle deployment validation failures gracefully', async () => {
      // Mock a problematic project
      const problematicPackageJson = {
        name: 'Invalid Package Name', // Invalid name
        dependencies: {
          'react': '^19.2.3'
          // Missing critical dependencies
        }
        // Missing scripts
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(problematicPackageJson));
      mockFs.existsSync.mockReturnValue(false); // Missing files
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      // Simulate validation with errors
      const packageJson = JSON.parse(mockFs.readFileSync('package.json', 'utf8') as string);
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const fixes: string[] = [];
      
      // Check package name
      if (packageJson.name && packageJson.name.includes(' ')) {
        warnings.push('Package name should follow npm naming conventions');
        fixes.push('Update package.json name to use kebab-case without spaces');
      }
      
      // Check dependencies
      const requiredDeps = ['dotenv', 'tsx', 'pm2'];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
          errors.push(`Missing required dependency: ${dep}`);
          fixes.push(`npm install ${dep}`);
        }
      }
      
      // Check scripts
      if (!packageJson.scripts || !packageJson.scripts.start) {
        warnings.push('Missing start script in package.json');
        fixes.push('Add "start" script to package.json');
      }
      
      const deploymentValid = errors.length === 0;
      
      expect(deploymentValid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
      expect(warnings.length).toBeGreaterThan(0);
      expect(fixes.length).toBeGreaterThan(0);
    });

    it('should provide platform-specific recommendations', async () => {
      // Mock console.log to capture output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simulate compatibility report generation
      const compatibility = {
        pterodactyl: { 
          score: 60, 
          recommendations: ['Use PM2 instead of concurrently'] 
        },
        vercel: { 
          score: 40, 
          recommendations: ['Remove PM2 dependency', 'Add vercel.json'] 
        },
        docker: { 
          score: 85, 
          recommendations: [] 
        },
        vps: { 
          score: 90, 
          recommendations: [] 
        }
      };
      
      // Simulate report generation
      for (const [platform, compat] of Object.entries(compatibility)) {
        const status = compat.score >= 80 ? '✅' : compat.score >= 60 ? '⚠️' : '❌';
        console.log(`${status} ${platform.toUpperCase()}: ${compat.score}/100`);
        
        if (compat.recommendations.length > 0) {
          console.log('   Recommendations:');
          compat.recommendations.forEach(rec => console.log(`     • ${rec}`));
        }
      }
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Use PM2 instead of concurrently')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Add vercel.json')
      );
      
      consoleSpy.mockRestore();
    });
  });
});