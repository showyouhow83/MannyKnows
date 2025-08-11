# Deployment Guide

Complete guide for deploying MannyKnows to Cloudflare Workers.

## 🎯 Quick Deploy

```bash
# Build and deploy in one command
npm run deploy
```

That's it! The deploy script handles everything automatically.

---

## 🔧 Prerequisites

### 1. Cloudflare Account Setup
- Cloudflare account with Workers enabled
- Domain configured (optional but recommended)
- API token with Workers permissions

### 2. Wrangler CLI
```bash
# Install globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### 3. Project Configuration
Ensure `wrangler.jsonc` is properly configured:
```jsonc
{
  "name": "mannyknows",
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2025-08-08",
  "compatibility_flags": ["nodejs_compat"]
}
```

---

## 🚀 Deployment Process

### Automated Deployment (Recommended)
```bash
# Deploy to production
npm run deploy

# Deploy to specific environment  
npm run deploy:staging
npm run deploy:production
```

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy with Wrangler
wrangler pages deploy dist
```

---

## 🔐 Environment Variables & Secrets

### Required Secrets
Set these in Cloudflare Workers:

```bash
# OpenAI API key (required for chatbot)
wrangler secret put OPENAI_API_KEY

# Admin password (required for admin panel)
wrangler secret put ADMIN_PASSWORD
```

### Environment Variables
Set in `wrangler.jsonc` under `vars`:

```jsonc
{
  "vars": {
    "GA_MEASUREMENT_ID": "G-YOUR-GA-ID",
    "CLOUDFLARE_ACCOUNT_ID": "your-account-id"
  }
}
```

### Development vs Production
Variables are automatically detected:
- **Development**: Uses `.env` file
- **Production**: Uses Wrangler secrets and vars

---

## 🗄️ Storage Configuration

### KV Namespaces
Required KV stores (automatically configured):

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "CHATBOT_KV",
      "id": "your-kv-namespace-id",
      "preview_id": "your-preview-kv-id"
    },
    {
      "binding": "SESSION", 
      "id": "your-session-kv-id",
      "preview_id": "your-preview-session-id"
    }
  ]
}
```

### R2 Buckets
For file storage (automatically configured):

```jsonc
{
  "r2_buckets": [
    {
      "binding": "MANNYKNOWS_R2",
      "bucket_name": "mannyknows-website-analysis"
    }
  ]
}
```

### Creating Storage Resources
```bash
# Create KV namespace
wrangler kv:namespace create "CHATBOT_KV"
wrangler kv:namespace create "SESSION"

# Create R2 bucket
wrangler r2 bucket create mannyknows-website-analysis
```

---

## 🌍 Domain Configuration

### Custom Domain Setup
1. **Add domain to Cloudflare**
2. **Configure DNS** to point to your Workers
3. **Update wrangler.jsonc** with domain routes

```jsonc
{
  "routes": [
    {
      "pattern": "yourdomain.com/*",
      "zone_name": "yourdomain.com"
    }
  ]
}
```

### SSL Configuration
- Cloudflare automatically provides SSL certificates
- Ensure SSL/TLS encryption mode is set to "Full (strict)"

---

## 📊 Monitoring & Logs

### Real-time Logs
```bash
# View live logs
wrangler tail

# Filter specific events
wrangler tail --format json | grep "error"
```

### Analytics
- Cloudflare Workers Analytics (automatic)
- Google Analytics (configured via GA_MEASUREMENT_ID)
- Custom logging via debug utilities

### Performance Monitoring
```bash
# Check bundle size
npm run build && du -sh dist/

# Performance analysis
npm run perf:analyze
```

---

## 🔧 Configuration Files

### Core Configuration
```
wrangler.jsonc          # Cloudflare Workers config
astro.config.mjs        # Astro framework config  
package.json            # Dependencies and scripts
tsconfig.json           # TypeScript configuration
tailwind.config.mjs     # Tailwind CSS config
```

### Environment-Specific Settings
```
src/config/chatbot/environments.json    # AI behavior config
```

**Development:**
```json
{
  "development": {
    "persona": "sales_agent",
    "model": "gpt-4o-mini", 
    "chatbot_enabled": true,
    "debug_logging": true
  }
}
```

**Production:**
```json
{
  "production": {
    "persona": "sales_agent", 
    "model": "gpt-4o",
    "chatbot_enabled": false,
    "debug_logging": false
  }
}
```

---

## 🚨 Troubleshooting

### Common Deployment Issues

**"Insufficient permissions" Error:**
```bash
# Verify API token permissions
wrangler whoami

# Re-authenticate if needed
wrangler logout
wrangler login
```

**Build Failures:**
```bash
# Clean build cache
rm -rf dist .astro node_modules
npm install
npm run build
```

**KV/R2 Not Found:**
```bash
# Verify bindings
wrangler kv:namespace list
wrangler r2 bucket list

# Update IDs in wrangler.jsonc
```

**Environment Variables Not Working:**
```bash
# List current secrets
wrangler secret list

# Update secret values
wrangler secret put OPENAI_API_KEY
wrangler secret put ADMIN_PASSWORD
```

### Runtime Issues

**Chatbot Offline:**
1. Check `chatbot_enabled` in environments.json
2. Verify OPENAI_API_KEY secret is set
3. Check Wrangler logs for API errors

**Admin Panel 401 Error:**
1. Ensure ADMIN_PASSWORD secret is set
2. Clear browser authentication cache
3. Check HTTP Basic Auth headers

**Website Analysis Failures:**
1. Verify R2 bucket exists and is accessible
2. Check MANNYKNOWS_R2 binding configuration  
3. Monitor logs for storage errors

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code builds successfully (`npm run build`)
- [ ] All tests pass
- [ ] Environment configuration updated
- [ ] Secrets are set in Cloudflare
- [ ] KV and R2 resources exist

### Post-Deployment  
- [ ] Live site loads correctly
- [ ] Chatbot functionality works
- [ ] Admin panel accessible
- [ ] Website analysis API functional
- [ ] No errors in Cloudflare logs

### Performance Verification
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Bundle size optimized
- [ ] No memory leaks in Workers

---

## 🔄 Deployment Strategies

### Environment Progression
```
Development (local) → Staging → Production
```

### Blue-Green Deployment
1. Deploy to staging environment
2. Test thoroughly
3. Switch traffic to new version
4. Monitor for issues
5. Rollback if needed

### Rollback Process
```bash
# Rollback to previous version
wrangler rollback

# Or deploy specific version
git checkout previous-commit
npm run deploy
```

---

## 📈 Scaling Considerations

### Performance Optimization
- Bundle size monitoring
- Code splitting for large features
- CDN utilization for static assets
- Database query optimization

### Cost Management
- Monitor Workers execution time
- Optimize API calls to external services
- Use appropriate storage tiers
- Set up billing alerts

### Monitoring Setup
```bash
# Set up log streaming
wrangler tail --format json > logs.json

# Monitor critical metrics
# - Request volume
# - Error rates  
# - Response times
# - Storage usage
```

This deployment setup provides a robust, scalable foundation for the MannyKnows application.
