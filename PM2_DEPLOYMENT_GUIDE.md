# PM2 Deployment Guide

This guide explains how to use the PM2 ecosystem configuration for production deployment of the Quantum Simulator application.

## Overview

The PM2 configuration provides production-ready process management with:
- Automatic restarts on crashes
- Memory monitoring and restart limits
- Environment-specific configurations
- Comprehensive logging
- Health checks and monitoring

## Configuration Files

- `ecosystem.config.cjs` - Main PM2 configuration
- `logs/` - Directory for PM2 log files
- `scripts/validate-pm2-config.cjs` - Configuration validation script

## Available Environments

### Production Environment
```bash
pm2 start ecosystem.config.cjs --env production
```
- Runs on port 25578
- Optimized for stability and performance
- Full logging and monitoring enabled

### Staging Environment
```bash
pm2 start ecosystem.config.cjs --env staging
```
- Runs on port 25579
- Similar to production but separate instance
- Used for testing before production deployment

### Pterodactyl Environment
```bash
pm2 start ecosystem.config.cjs --env pterodactyl
```
- Optimized for Pterodactyl hosting environments
- Minimal container compatibility
- Reduced resource usage

### Development Environment
```bash
pm2 start ecosystem.config.cjs --env development
```
- Runs on port 3000
- Development-friendly settings
- Not recommended for production use

## Quick Start Commands

### Using NPM Scripts
```bash
# Validate PM2 configuration
npm run validate:pm2

# Start with PM2 (production environment)
npm run start:pm2

# Stop PM2 processes
npm run stop:pm2

# Restart PM2 processes
npm run restart:pm2

# Full production deployment
npm run deploy:prod
```

### Direct PM2 Commands
```bash
# Start specific environment
pm2 start ecosystem.config.cjs --env production
pm2 start ecosystem.config.cjs --env staging
pm2 start ecosystem.config.cjs --env pterodactyl

# Monitor processes
pm2 monit

# View logs
pm2 logs

# View process status
pm2 status

# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all
```

## Application Configurations

### Primary App: quantum-simulator-app
- **Purpose**: Main application server using Vite preview
- **Script**: `npx vite preview --host 0.0.0.0 --port 25578`
- **Memory Limit**: 1GB
- **Max Restarts**: 10
- **Features**: Health checks, monitoring, comprehensive logging

### Secondary App: quantum-simulator-static (Disabled by default)
- **Purpose**: Alternative static file server
- **Script**: `serve -s dist -l 25578 -H 0.0.0.0`
- **Memory Limit**: 512MB
- **Max Restarts**: 5
- **Usage**: Enable for pure static file serving scenarios

## Deployment Strategies

### Standard Production Deployment
1. Build the application: `npm run build`
2. Start PM2: `pm2 start ecosystem.config.cjs --env production`
3. Monitor: `pm2 monit`

### Pterodactyl Deployment
1. Ensure minimal environment compatibility
2. Build: `npm run build`
3. Start: `pm2 start ecosystem.config.cjs --env pterodactyl`

### Auto-Deployment with Git
The configuration includes deployment hooks for automatic deployment:
```bash
pm2 deploy production setup    # Initial setup
pm2 deploy production          # Deploy updates
```

## Monitoring and Logs

### Log Files
- `logs/app-error.log` - Application errors
- `logs/app-out.log` - Application output
- `logs/app-combined.log` - Combined logs
- `logs/static-error.log` - Static server errors (if enabled)
- `logs/static-out.log` - Static server output (if enabled)

### Monitoring Commands
```bash
# Real-time monitoring dashboard
pm2 monit

# View logs in real-time
pm2 logs

# View specific app logs
pm2 logs quantum-simulator-app

# Flush logs
pm2 flush
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :25578
   # Kill the process or change port in ecosystem.config.cjs
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   pm2 monit
   # Adjust max_memory_restart in ecosystem.config.cjs
   ```

3. **Process Won't Start**
   ```bash
   # Validate configuration
   npm run validate:pm2
   # Check logs
   pm2 logs
   ```

4. **Pterodactyl Compatibility**
   - Ensure all dependencies are installed
   - Use the pterodactyl environment: `--env pterodactyl`
   - Check container resource limits

### Validation
Always validate your configuration before deployment:
```bash
npm run validate:pm2
```

## Environment Variables

The PM2 configuration supports environment-specific variables:
- `NODE_ENV` - Environment mode
- `PORT` - Application port
- `HOST` - Bind address
- `PM2_SERVE_PATH` - Static file path (Pterodactyl)
- `PM2_SERVE_PORT` - Static server port (Pterodactyl)
- `PM2_SERVE_SPA` - SPA mode (Pterodactyl)

## Security Considerations

- Log files are automatically ignored by git
- Environment variables should be set securely
- Monitor process resource usage regularly
- Use appropriate user permissions for deployment

## Performance Optimization

- Memory limits prevent runaway processes
- Automatic restarts ensure high availability
- Exponential backoff prevents restart loops
- Health checks detect and recover from failures

For more advanced PM2 features, refer to the [PM2 Documentation](https://pm2.keymetrics.io/docs/).