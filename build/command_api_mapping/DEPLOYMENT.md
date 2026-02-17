# Deployment Guide - Redis Command-to-API Mapping MCP Server

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-02-17

## Overview

This guide provides step-by-step instructions for deploying the Redis Command-to-API Mapping MCP Server to production.

## Pre-Deployment Checklist

- [ ] All tests passing (100% pass rate)
- [ ] All deliverables validated
- [ ] Schema validation complete
- [ ] Documentation reviewed
- [ ] Performance baselines met
- [ ] Security review completed
- [ ] Backup of current system created

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows
- **Node.js**: 18.0.0 or higher
- **Rust**: 1.70.0 or higher (for building from source)
- **Disk Space**: 500MB minimum
- **Memory**: 512MB minimum

### Dependencies
- npm 9.0.0 or higher
- wasm-pack (for building WASM modules)
- TypeScript 5.0.0 or higher

## Installation Steps

### 1. Prepare Environment

```bash
# Create deployment directory
mkdir -p /opt/redis-command-api-mapping
cd /opt/redis-command-api-mapping

# Clone or copy project files
git clone <repository-url> .
# OR
cp -r /path/to/project/* .
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install Node.js dependencies
cd mcp-server/node
npm install
cd ../..
```

### 3. Build Project

```bash
# Full build (Rust + Node.js)
npm run build

# Verify build
npm run test
```

### 4. Validate Deployment

```bash
# Validate all deliverables
npm run validate-deliverables

# Validate schema
npm run validate-schema

# Run final tests
npm run test-final
```

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Server Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=3000

# MCP Configuration
MCP_TRANSPORT=stdio
MCP_TIMEOUT=30000

# Performance
MAX_WORKERS=4
CACHE_SIZE=1000
```

### MCP Configuration

Update `mcp-server/mcp.json`:

```json
{
  "mcpServers": {
    "redis-parser-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/opt/redis-command-api-mapping/mcp-server",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Deployment Methods

### Method 1: Direct Installation

```bash
# Navigate to project
cd /opt/redis-command-api-mapping

# Start server
npm start
```

### Method 2: Docker (Recommended)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install && npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t redis-command-api-mapping:1.0.0 .
docker run -d -p 3000:3000 redis-command-api-mapping:1.0.0
```

### Method 3: Systemd Service

Create `/etc/systemd/system/redis-command-api-mapping.service`:

```ini
[Unit]
Description=Redis Command-to-API Mapping MCP Server
After=network.target

[Service]
Type=simple
User=redis-api
WorkingDirectory=/opt/redis-command-api-mapping
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable redis-command-api-mapping
sudo systemctl start redis-command-api-mapping
```

## Verification

### Health Check

```bash
# Test server is running
curl http://localhost:3000/health

# Expected response: 200 OK
```

### Tool Verification

```bash
# Test each tool
npm run test-final

# Expected: All tests pass
```

### Performance Verification

```bash
# Run performance tests
npm run test-augment-performance

# Expected: All metrics meet targets
```

## Monitoring

### Logs

```bash
# View logs
tail -f /var/log/redis-command-api-mapping.log

# Filter by level
grep "ERROR" /var/log/redis-command-api-mapping.log
```

### Metrics

Monitor these key metrics:
- **Response Time**: Target < 100ms (P95)
- **Throughput**: Target > 100 req/s
- **Error Rate**: Target < 0.1%
- **Memory Usage**: Target < 512MB
- **CPU Usage**: Target < 50%

### Alerts

Set up alerts for:
- Server down (no response for 5 minutes)
- High error rate (> 1%)
- High memory usage (> 80%)
- High CPU usage (> 80%)
- Response time degradation (> 200ms)

## Rollback Procedure

### If Deployment Fails

```bash
# Stop current deployment
npm stop

# Restore previous version
git checkout <previous-tag>

# Rebuild
npm run build

# Restart
npm start
```

### If Issues Occur Post-Deployment

```bash
# Check logs
tail -f /var/log/redis-command-api-mapping.log

# Verify configuration
npm run validate-schema

# Run diagnostics
npm run test-final

# Rollback if necessary
systemctl stop redis-command-api-mapping
# Restore from backup
# Restart
systemctl start redis-command-api-mapping
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs and metrics
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Full system review

### Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Rebuild
npm run build

# Test
npm run test

# Deploy
npm start
```

## Troubleshooting

### Server Won't Start

```bash
# Check Node.js version
node --version

# Check dependencies
npm list

# Rebuild
npm run clean && npm run build

# Check logs
npm start 2>&1 | tee debug.log
```

### Performance Issues

```bash
# Check memory usage
ps aux | grep node

# Check CPU usage
top -p $(pgrep -f "node dist/index.js")

# Run performance tests
npm run test-augment-performance
```

### Tool Failures

```bash
# Test individual tools
npm run test-final

# Check tool configuration
npm run validate-schema

# Review logs for errors
grep "ERROR" /var/log/redis-command-api-mapping.log
```

## Support

For issues or questions:
1. Check logs: `/var/log/redis-command-api-mapping.log`
2. Run diagnostics: `npm run test-final`
3. Review documentation: `DEVELOPMENT.md`
4. Contact support team

## Success Criteria

✅ Server starts without errors  
✅ All tools respond correctly  
✅ Performance meets targets  
✅ No critical errors in logs  
✅ Health checks pass  
✅ All tests pass  

---

**Deployment Status**: Ready for Production  
**Last Updated**: 2026-02-17  
**Next Review**: 2026-03-17

