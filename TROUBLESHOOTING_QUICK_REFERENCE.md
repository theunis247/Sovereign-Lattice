# Quick Troubleshooting Reference

## Emergency Commands

### 🚨 Application Won't Start
```bash
npm run deploy:fallback
```

### 🚨 Data Lost/Corrupted
```bash
npm run profile:setup
```

### 🚨 Can't Login as Founder
```bash
npm run profile:create-founder
```

## Common Error Solutions

| Error | Solution |
|-------|----------|
| `Cannot find module 'dotenv/config'` | `npm install` |
| `ps: command not found` | `npm run deploy:fallback` |
| `Permission denied` | `chmod +x scripts/*.cjs` |
| `Port already in use` | `export PORT=25579` |
| `Founder profile not found` | `npm run profile:create-founder` |
| `Database not initialized` | `npm run db:init` |
| `PM2 not found` | `npm run deploy:simple` |

## Diagnostic Commands

```bash
# Check everything
npm run validate:all

# Auto-fix issues
npm run deploy:fix

# Check environment
npm run deploy:env-check

# View logs
npm run logs:view
```

## Founder Profile Info

- **Username**: Freedom24/7365
- **Password**: LATTICE-FREQUENCY-7777-BETA-PRIME-SHARD-Z-11113NOU
- **QBS Balance**: 1000
- **Profile File**: `data/profiles/founder_freedom247365.json`

## Data Locations

```
data/
├── profiles/           # User profiles
├── credentials/        # Authentication data
├── balances/          # QBS balances
├── backups/           # Database backups
└── founder-registry.json  # Founder info
```

## Port Configuration

Default ports:
- Development: 3000
- Production: 25578
- Staging: 25579

Change port:
```bash
export PORT=your_port
npm run deploy:smart
```

## Quick Health Check

```bash
# Check if server is running
curl -f http://localhost:25578/ || echo "Server not responding"

# Check data persistence
ls -la data/founder-registry.json

# Check logs for errors
tail -n 20 logs/app-error.log
```

## Recovery Procedures

### Complete Reset
```bash
rm -rf data/
npm run profile:setup
npm run deploy:smart
```

### Backup and Restore
```bash
# Create backup
npm run db:backup

# Restore from backup
npm run db:restore
```

### Founder Profile Recovery
```bash
# Remove corrupted profile
rm -f data/profiles/founder_freedom247365.json
rm -f data/credentials/founder_freedom247365.json
rm -f data/balances/founder_freedom247365.json

# Recreate
npm run profile:create-founder
```

## Environment-Specific Issues

### Pterodactyl
- Use `npm run deploy:pterodactyl`
- Check container permissions
- Verify port configuration in panel

### Docker
- Ensure volume mounts for `/data`
- Check port mapping
- Use `npm run deploy:docker`

### VPS
- Check firewall rules
- Verify PM2 installation
- Use `npm run deploy:vps`

## Getting More Help

1. **Check logs**: `npm run logs:view`
2. **Run diagnostics**: `npm run validate:all`
3. **Try auto-fix**: `npm run deploy:fix`
4. **Use fallback**: `npm run deploy:fallback`
5. **Complete reset**: Remove `/data` and run `npm run profile:setup`