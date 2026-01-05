# Deployment Fixes Design Document

## Overview

This design addresses critical deployment failures by implementing proper dependency management, production-ready process orchestration, and environment-specific deployment strategies. The solution focuses on eliminating the dotenv module resolution error and replacing concurrently with production-appropriate alternatives.

## Architecture

### Current Issues
- Missing `dotenv` runtime dependency causing "Cannot find module 'dotenv/config'" errors
- `concurrently` dependency on `ps` command failing in minimal containers
- Development-style deployment using Vite preview in production
- Lack of proper error handling and fallback mechanisms

### Proposed Solution
```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Strategy                      │
├─────────────────────────────────────────────────────────────┤
│  Development          │  Production                        │
│  ├─ Vite Dev Server   │  ├─ Static File Serving           │
│  ├─ Concurrently      │  ├─ PM2 Process Manager           │
│  └─ Hot Reload        │  └─ Optimized Asset Delivery      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Dependency Management
**Purpose**: Ensure all required modules are available at runtime

**Implementation**:
- Add `dotenv` to package.json dependencies
- Add `pm2` as production dependency
- Create environment validation script

**Interface**:
```typescript
interface DependencyValidator {
  validateRuntimeDependencies(): Promise<ValidationResult>;
  installMissingDependencies(): Promise<void>;
  generateDependencyReport(): DependencyReport;
}
```

### 2. Process Management System
**Purpose**: Replace concurrently with production-ready alternatives

**Components**:
- **PM2 Configuration**: Ecosystem file for production process management
- **Fallback Scripts**: Simple sequential startup for environments without PM2
- **Health Checks**: Process monitoring and restart capabilities

**PM2 Ecosystem Structure**:
```javascript
module.exports = {
  apps: [
    {
      name: "api-server",
      script: "tsx",
      args: "-r dotenv/config server/index.ts",
      env: { NODE_ENV: "production" },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G"
    }
  ]
};
```

### 3. Environment-Specific Deployment
**Purpose**: Optimize deployment strategy based on environment

**Development Mode**:
- Use Vite dev server with hot reload
- Keep concurrently for development convenience
- Enable source maps and debugging

**Production Mode**:
- Serve pre-built static files
- Use PM2 for process management
- Optimize for performance and stability

### 4. Deployment Scripts
**Purpose**: Provide automated deployment and troubleshooting

**Scripts**:
- `deploy-check.js`: Validate environment and dependencies
- `production-start.js`: Production-optimized startup
- `troubleshoot.js`: Diagnostic and repair utilities

## Data Models

### Deployment Configuration
```typescript
interface DeploymentConfig {
  environment: 'development' | 'production' | 'staging';
  processManager: 'pm2' | 'concurrently' | 'simple';
  staticFileServing: boolean;
  healthChecks: boolean;
  dependencies: {
    required: string[];
    optional: string[];
    development: string[];
  };
}
```

### Environment Validation
```typescript
interface EnvironmentCheck {
  name: string;
  required: boolean;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  fixCommand?: string;
}
```

## Error Handling

### 1. Missing Dependencies
- **Detection**: Check for module resolution errors
- **Response**: Provide specific installation commands
- **Fallback**: Offer manual dependency installation guide

### 2. Process Management Failures
- **Detection**: Monitor for spawn errors and process crashes
- **Response**: Switch to fallback process management
- **Recovery**: Restart failed processes with exponential backoff

### 3. Environment Compatibility
- **Detection**: Check for required system utilities
- **Response**: Adapt deployment strategy to environment capabilities
- **Documentation**: Provide platform-specific deployment guides

## Testing Strategy

### 1. Dependency Validation Tests
- Verify all required modules can be resolved
- Test installation scripts in clean environments
- Validate package.json completeness

### 2. Process Management Tests
- Test PM2 configuration and startup
- Verify fallback mechanisms work correctly
- Test process restart and recovery

### 3. Environment Compatibility Tests
- Test deployment in various container environments
- Verify Pterodactyl compatibility
- Test minimal environment scenarios

### 4. Integration Tests
- End-to-end deployment testing
- Production environment simulation
- Performance and stability validation

## Implementation Phases

### Phase 1: Immediate Fixes
1. Add missing dotenv dependency
2. Create PM2 ecosystem configuration
3. Update package.json scripts

### Phase 2: Production Optimization
1. Implement static file serving strategy
2. Create deployment validation scripts
3. Add environment-specific configurations

### Phase 3: Monitoring and Maintenance
1. Add health check endpoints
2. Implement deployment diagnostics
3. Create troubleshooting documentation