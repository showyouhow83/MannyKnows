# 🚀 Streamlined Deployment Guide

## Quick Deployment (Recommended)

For future deployments, you now have two simple options:

### Option 1: Using npm script (Easiest)
```bash
npm run deploy
```

### Option 2: Using the script directly
```bash
./deploy.sh
```

Both commands will:
1. ✅ Build your application
2. ✅ Clear any conflicting environment variables
3. ✅ Deploy to Cloudflare Workers using OAuth
4. ✅ Show you the live URL

## Authentication Status

Your OAuth authentication is persistent and should work for future deployments without any additional setup.

## If Authentication Issues Return

If you ever encounter authentication issues again, run this one-time fix:

```bash
# Clear environment variables and login with OAuth
CLOUDFLARE_API_TOKEN="" CF_API_TOKEN="" npx wrangler login
```

Then continue using `npm run deploy` for all future deployments.

## Live URL

Your site is always available at: **https://mannyknows.showyouhow83.workers.dev**

## Build-Only (No Deploy)

If you just want to build without deploying:
```bash
npm run build
```

---

**That's it!** No more authentication hassles. Just `npm run deploy` and you're live! 🎯
