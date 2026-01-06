# Complete Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Secure Quantum Simulator with persistent data storage and the founder profile setup.

## Quick Start

### Automatic Deployment (Recommended)
```bash
npm run deploy:smart
```
This command automatically detects your environment and chooses the best deployment strategy.

### Manual Deployment Options

#### 1. Production Deployment (PM2)
```bash
npm run deploy:prod
```

#### 2. Simple Deployment (Node Serve)
```bash
npm run deploy:simple
```

#### 3. Pterodactyl Deployment
```bash
npm run deploy:pterodactyl
```

#### 4. Fallback Deployment (Minimal Environments)
```bash
npm run deploy:fallback
```

## Data Persistence Setup

### Database Initialization
```bash
npm run db:init
```
Creates necessary directories and initializes persistent storage.

### Founder Profile Setup
```bash
npm run profile:create-founder
```
Creates the founder profile with:
- **Username**: Freedom24/7365
- **Password**: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU
- **QBS Balance**: 1000
- **Security Level**: Military

### Complete Profile Setup
```bash
npm run profile:setup
```
Runs both database initialization and founder profile creation.

## Environment-Specific Deployment

### Pterodactyl Panel

1. **Upload Files**: Upload all project files to your Pterodactyl server
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Deploy**:
   ```bash
   npm run deploy:pterodactyl
   ```
4. **Access**: Your server will be available on the configured port (default: 25578)

**Pterodactyl-Specific Notes**:
- Uses fallback deployment strategy for minimal container environment
- Automatically handles missing system commands
- Data persists in the `/data` directory

### VPS/Dedicated Server

1. **Clone Repository**:
   ```bash
   git clone <your-repo-url>
   cd secure-quantum-simulator
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Deploy with PM2**:
   ```bash
   npm run deploy:vps
   ```
4. **Monitor**:
   ```bash
   npm run pm2:status
   npm run pm2:logs
   ```

### Docker Container

1. **Build and Deploy**:
   ```bash
   npm run deploy:docker
   ```
2. **Access**: Available on port 25578

### Local Development

1. **Start Development Server**:
   ```bash
   npm run dev
   ```
2. **Access**: http://localhost:3000

## Data Management

### Backup Database
```bash
npm run db:backup
```
Creates timestamped backup in `/data/backups/`

### Restore Database
```bash
npm run db:restore
```
Restores from the latest backup

### View Logs
```bash
npm run logs:view    # Combined logs
npm run logs:error   # Error logs only
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module 'dotenv/config'"
**Solution**: Dependencies are missing
```bash
npm install
```

#### 2. "ps: command not found"
**Solution**: Use fallback deployment
```bash
npm run deploy:fallback
```

#### 3. "Permission denied" errors
**Solution**: Check file permissions
```bash
chmod +x scripts/*.cjs
chmod +x scripts/*.js
```

#### 4. Port already in use
**Solution**: Change port in environment
```bash
export PORT=25579
npm run deploy:smart
```

#### 5. Founder profile not found
**Solution**: Recreate founder profile
```bash
npm run profile:create-founder
```

### Diagnostic Commands

#### Environment Check
```bash
npm run deploy:env-check
```

#### Deployment Validation
```bash
npm run deploy:check
```

#### Complete Validation
```bash
npm run validate:all
```

#### Troubleshoot and Auto-Fix
```bash
npm run deploy:fix
```

### Manual Troubleshooting

#### Check Data Persistence
```bash
ls -la data/
ls -la data/profiles/
ls -la data/credentials/
```

#### Verify Founder Profile
```bash
cat data/founder-registry.json
cat data/profiles/founder_freedom247365.json
```

#### Check Logs
```bash
tail -f logs/founder-creation.log
tail -f logs/app-combined.log
```

## Security Considerations

### Founder Profile Security
- Password is stored with secure hashing
- Military-grade security level applied
- All actions are audited and logged
- MFA can be enabled for additional security

### Data Protection
- All sensitive data is encrypted at rest
- Regular automated backups
- Audit trails for all operations
- Cross-profile data isolation

### Network Security
- Server binds to all interfaces (0.0.0.0) for container compatibility
- Use reverse proxy (nginx) for production SSL termination
- Configure firewall rules for port access

## Performance Optimization

### Production Settings
- Built assets are served statically
- Gzip compression enabled
- Asset caching configured
- Memory limits set for PM2 processes

### Monitoring
```bash
npm run pm2:status     # Process status
npm run health:check   # Health check
```

## Advanced Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=25578
HOST=0.0.0.0
DATABASE_PERSISTENT=true
BACKUP_ENABLED=true
DATA_DIRECTORY=./data
LOGS_DIRECTORY=./logs
```

### PM2 Configuration
Edit `ecosystem.config.cjs` for advanced PM2 settings:
- Process scaling
- Memory limits
- Restart policies
- Log rotation

### Custom Deployment
Create custom deployment scripts in `/scripts/` directory following the existing patterns.

## Support

### Log Locations
- Application logs: `/logs/app-combined.log`
- Error logs: `/logs/app-error.log`
- Founder creation: `/logs/founder-creation.log`
- PM2 logs: Use `npm run pm2:logs`

### Data Locations
- Profiles: `/data/profiles/`
- Credentials: `/data/credentials/`
- Balances: `/data/balances/`
- Backups: `/data/backups/`

### Getting Help
1. Check logs for error messages
2. Run diagnostic commands
3. Try auto-fix: `npm run deploy:fix`
4. Use fallback deployment: `npm run deploy:fallback`

## Migration Guide

### From Previous Versions
1. **Backup existing data**:
   ```bash
   npm run db:backup
   ```
2. **Update dependencies**:
   ```bash
   npm install
   ```
3. **Migrate data**:
   ```bash
   npm run profile:setup
   ```
4. **Deploy**:
   ```bash
   npm run deploy:smart
   ```

### Platform Migration
When moving between hosting platforms:
1. Create backup on source platform
2. Transfer backup files to new platform
3. Run `npm run db:restore` on new platform
4. Deploy using appropriate strategy

## Conclusion

This deployment system provides:
- ✅ Automatic environment detection
- ✅ Persistent data storage
- ✅ Founder profile with 1000 QBS balance
- ✅ Multiple deployment strategies
- ✅ Comprehensive error handling
- ✅ Automated troubleshooting
- ✅ Security best practices

For additional support or custom deployment needs, refer to the troubleshooting section or check the application logs.