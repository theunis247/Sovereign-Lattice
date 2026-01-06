/**
 * Deployment Validation Tests
 * Tests for dependency validation, PM2 configuration, and deployment scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Mock file system and child_process
vi.mock('fs');
vi.mock('child_process');

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);

// Mock deployment validator class for testing
class MockDeploymentValidator {
  errors: string[] = [];
  warnings: string[] = [];
  fixes: string[] = [];
  packageJson: any = null;

  async validateRuntimeDependencies() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      this.packageJson = JSON.parse(mockFs.readFileSync(packagePath, 'utf8') as string);
      
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
        }
      }

      // Check for critical runtime modules
      const criticalModules = ['dotenv', 'tsx'];
      for (const module of criticalModules) {
        try {
          const modulePath = path.join(process.cwd(), 'node_modules', module);
          if (!mockFs.existsSync(modulePath)) {
            this.errors.push(`Critical module ${module} not installed in node_modules`);
            this.fixes.push(`npm install ${module}`);
          }
        } catch (error: any) {
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

    } catch (error: any) {
      this.errors.push(`Failed to validate dependencies: ${error.message}`);
    }
  }

  async validateProcessManagement() {
    const pm2ConfigPath = path.join(process.cwd(), 'ecosystem.config.cjs');
    if (mockFs.existsSync(pm2ConfigPath)) {
      try {
        const configContent = mockFs.readFileSync(pm2ConfigPath, 'utf8') as string;
        if (configContent.includes('module.exports') && configContent.includes('apps')) {
          // Valid PM2 configuration
        } else {
          throw new Error('Invalid PM2 configuration structure');
        }
      } catch (error: any) {
        this.errors.push(`PM2 configuration syntax error: ${error.message}`);
      }
    } else {
      this.warnings.push('PM2 ecosystem.config.cjs not found');
      this.fixes.push('Create PM2 configuration for production deployment');
    }

    // Check PM2 availability
    try {
      mockExecSync('npx pm2 --version', { stdio: 'pipe' });
    } catch (error) {
      this.warnings.push('PM2 not available - fallback to simple process management');
    }
  }

  async validateEnvironmentFiles() {
    const envFiles = ['.env.example', '.env.local'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (mockFs.existsSync(envPath)) {
        const envContent = mockFs.readFileSync(envPath, 'utf8') as string;
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
    const configFiles = ['vite.config.ts', 'tsconfig.json'];
    
    for (const configFile of configFiles) {
      const configPath = path.join(process.cwd(), configFile);
      if (!mockFs.existsSync(configPath)) {
        this.errors.push(`Missing build configuration: ${configFile}`);
      }
    }

    const distPath = path.join(process.cwd(), 'dist');
    if (!mockFs.existsSync(distPath)) {
      this.warnings.push('dist directory not found - will be created during build');
    }
  }

  async validateNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      this.errors.push(`Node.js ${nodeVersion} is too old. Minimum required: 18.x`);
      this.fixes.push('Upgrade Node.js to version 18 or higher');
    }

    try {
      mockExecSync('npm --version', { encoding: 'utf8' });
    } catch (error) {
      this.errors.push('npm not available');
    }
  }

  generateReport(): boolean {
    return this.errors.length === 0;
  }

  async installMissingDependencies(): Promise<boolean> {
    if (this.errors.some(error => error.includes('Missing required dependency'))) {
      try {
        mockExecSync('npm install', { stdio: 'inherit' });
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}

describe('Deployment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for successful scenarios
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockExecSync.mockReturnValue(Buffer.from('success'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dependency Validation', () => {
    const mockPackageJson = {
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
        start: 'npm run start:prod'
      }
    };

    it('should validate all required dependencies are present', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateRuntimeDependencies();
      
      expect(validator.errors).toHaveLength(0);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf8'
      );
    });

    it('should detect missing critical dependencies', async () => {
      const incompletePackageJson = {
        ...mockPackageJson,
        dependencies: {
          'react': '^19.2.3'
          // Missing dotenv, tsx, pm2, etc.
        }
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(incompletePackageJson));
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateRuntimeDependencies();
      
      expect(validator.errors.length).toBeGreaterThan(0);
      expect(validator.errors.some(error => error.includes('dotenv'))).toBe(true);
      expect(validator.errors.some(error => error.includes('tsx'))).toBe(true);
      expect(validator.fixes.length).toBeGreaterThan(0);
    });

    it('should validate package.json structure', async () => {
      const invalidPackageJson = {
        name: 'Invalid Package Name', // Contains spaces
        dependencies: mockPackageJson.dependencies
        // Missing scripts
      };
      
      mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidPackageJson));
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateRuntimeDependencies();
      
      expect(validator.warnings.some(warning => 
        warning.includes('naming conventions')
      )).toBe(true);
      expect(validator.warnings.some(warning => 
        warning.includes('start script')
      )).toBe(true);
    });

    it('should verify node_modules installation', async () => {
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPackageJson));
      mockFs.existsSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('node_modules') && filePath.includes('dotenv')) {
          return false; // Simulate missing dotenv module
        }
        return true;
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateRuntimeDependencies();
      
      // The test should find that dotenv is missing from node_modules
      // even though it's listed in package.json dependencies
      expect(validator.errors.some(error => 
        error.includes('dotenv') && error.includes('not installed')
      )).toBe(true);
    });

    it('should handle package.json read errors gracefully', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateRuntimeDependencies();
      
      expect(validator.errors.some(error => 
        error.includes('Failed to validate dependencies')
      )).toBe(true);
    });

    it('should attempt to install missing dependencies', async () => {
      const validator = new MockDeploymentValidator();
      
      // Simulate missing dependencies
      validator.errors.push('Missing required dependency: dotenv');
      
      const result = await validator.installMissingDependencies();
      
      expect(mockExecSync).toHaveBeenCalledWith('npm install', { stdio: 'inherit' });
      expect(result).toBe(true);
    });

    it('should handle dependency installation failures', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Installation failed');
      });
      
      const validator = new MockDeploymentValidator();
      
      validator.errors.push('Missing required dependency: dotenv');
      
      const result = await validator.installMissingDependencies();
      
      expect(result).toBe(false);
    });
  });

  describe('PM2 Configuration Validation', () => {
    const mockEcosystemConfig = `
      module.exports = {
        apps: [{
          name: "quantum-simulator-app",
          script: "npx",
          args: "vite preview --host 0.0.0.0 --port 25578",
          env: { NODE_ENV: "production" }
        }]
      };
    `;

    it('should validate PM2 ecosystem configuration exists', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && filePath.includes('ecosystem.config.cjs');
      });
      mockFs.readFileSync.mockReturnValue(mockEcosystemConfig);
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateProcessManagement();
      
      expect(validator.warnings).not.toContain(
        expect.stringContaining('PM2 ecosystem.config.cjs not found')
      );
    });

    it('should detect missing PM2 configuration', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && filePath.includes('ecosystem.config.cjs'));
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateProcessManagement();
      
      expect(validator.warnings.some(warning => 
        warning.includes('PM2 ecosystem.config.cjs not found')
      )).toBe(true);
      expect(validator.fixes.some(fix => 
        fix.includes('Create PM2 configuration')
      )).toBe(true);
    });

    it('should validate PM2 configuration syntax', async () => {
      const invalidConfig = 'invalid javascript syntax {';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(invalidConfig);
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateProcessManagement();
      
      expect(validator.errors.some(error => 
        error.includes('PM2 configuration syntax error')
      )).toBe(true);
    });

    it('should check PM2 availability', async () => {
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('pm2 --version')) {
          return Buffer.from('5.4.2');
        }
        throw new Error('Command not found');
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateProcessManagement();
      
      expect(validator.warnings).not.toContain(
        expect.stringContaining('PM2 not available')
      );
    });

    it('should handle PM2 unavailability gracefully', async () => {
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('pm2 --version')) {
          throw new Error('Command not found');
        }
        return Buffer.from('success');
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateProcessManagement();
      
      expect(validator.warnings.some(warning => 
        warning.includes('PM2 not available')
      )).toBe(true);
    });
  });

  describe('Environment Configuration Validation', () => {
    it('should validate environment files exist', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('.env.example') || filePath.includes('.env.local'));
      });
      mockFs.readFileSync.mockReturnValue('NODE_ENV=production\nPORT=25578');
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateEnvironmentFiles();
      
      expect(validator.warnings).not.toContain(
        expect.stringContaining('.env.example not found')
      );
    });

    it('should check for required environment variables', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('SOME_OTHER_VAR=value'); // Missing NODE_ENV and PORT
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateEnvironmentFiles();
      
      expect(validator.warnings.some(warning => 
        warning.includes('missing NODE_ENV')
      )).toBe(true);
      expect(validator.warnings.some(warning => 
        warning.includes('missing PORT')
      )).toBe(true);
    });

    it('should warn about missing .env.example', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !(typeof filePath === 'string' && filePath.includes('.env.example'));
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateEnvironmentFiles();
      
      expect(validator.warnings.some(warning => 
        warning.includes('.env.example not found')
      )).toBe(true);
    });
  });

  describe('Build Configuration Validation', () => {
    it('should validate build configuration files exist', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return typeof filePath === 'string' && 
               (filePath.includes('vite.config.ts') || filePath.includes('tsconfig.json'));
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateBuildArtifacts();
      
      expect(validator.errors).not.toContain(
        expect.stringContaining('Missing build configuration')
      );
    });

    it('should detect missing build configuration', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateBuildArtifacts();
      
      expect(validator.errors.some(error => 
        error.includes('Missing build configuration: vite.config.ts')
      )).toBe(true);
      expect(validator.errors.some(error => 
        error.includes('Missing build configuration: tsconfig.json')
      )).toBe(true);
    });

    it('should check dist directory status', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string' && filePath.includes('dist')) {
          return false;
        }
        return true;
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateBuildArtifacts();
      
      expect(validator.warnings.some(warning => 
        warning.includes('dist directory not found')
      )).toBe(true);
    });
  });

  describe('Node.js Version Validation', () => {
    it('should validate Node.js version compatibility', async () => {
      // Mock Node.js version 18.x
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v18.17.0',
        configurable: true
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateNodeVersion();
      
      expect(validator.errors).not.toContain(
        expect.stringContaining('Node.js')
      );
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
    });

    it('should detect incompatible Node.js version', async () => {
      // Mock old Node.js version
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', {
        value: 'v16.14.0',
        configurable: true
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateNodeVersion();
      
      expect(validator.errors.some(error => 
        error.includes('Node.js') && error.includes('too old')
      )).toBe(true);
      expect(validator.fixes.some(fix => 
        fix.includes('Upgrade Node.js')
      )).toBe(true);
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
    });

    it('should validate npm availability', async () => {
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('npm --version')) {
          return Buffer.from('9.8.1');
        }
        return Buffer.from('success');
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateNodeVersion();
      
      expect(validator.errors).not.toContain(
        expect.stringContaining('npm not available')
      );
    });

    it('should detect missing npm', async () => {
      mockExecSync.mockImplementation((command) => {
        if (typeof command === 'string' && command.includes('npm --version')) {
          throw new Error('Command not found');
        }
        return Buffer.from('success');
      });
      
      const validator = new MockDeploymentValidator();
      
      await validator.validateNodeVersion();
      
      expect(validator.errors.some(error => 
        error.includes('npm not available')
      )).toBe(true);
    });
  });

  describe('Report Generation', () => {
    it('should generate successful report when no issues', async () => {
      const validator = new MockDeploymentValidator();
      
      const result = validator.generateReport();
      
      expect(result).toBe(true);
    });

    it('should generate failure report with errors', async () => {
      const validator = new MockDeploymentValidator();
      
      validator.errors.push('Critical error');
      validator.warnings.push('Warning message');
      validator.fixes.push('Fix suggestion');
      
      const result = validator.generateReport();
      
      expect(result).toBe(false);
    });

    it('should generate success report with only warnings', async () => {
      const validator = new MockDeploymentValidator();
      
      validator.warnings.push('Warning message');
      validator.fixes.push('Fix suggestion');
      
      const result = validator.generateReport();
      
      expect(result).toBe(true);
    });
  });
});