# 🚀 Staging Deployment Guide

This guide explains how to deploy changes from your local codespace to the staging branch on GitHub.

## 📋 Overview

Our workflow:
1. **Work locally** on the staging branch in codespace
2. **Deploy to staging** using the bash script
3. **Review changes** on GitHub staging branch
4. **Manually merge** staging → main via GitHub when ready for production

## 🛠 Deployment Methods

### Method 1: Bash Script (Recommended)

The `deploy-staging.sh` script is the most reliable method.

#### Basic Usage
```bash
# Deploy with default timestamp message
./deploy-staging.sh

# Deploy with custom commit message
./deploy-staging.sh "Add new text selection feature"
./deploy-staging.sh "Fix mobile responsive issues"
./deploy-staging.sh "Update color scheme and animations"
```

#### What the Script Does
1. ✅ **Builds** your Astro project (`npm run build`)
2. ✅ **Validates** build is successful before proceeding
3. ✅ **Commits** all changes with your message
4. ✅ **Pushes** to staging branch on GitHub
5. ✅ **Provides feedback** on success/failure
6. ✅ **Shows GitHub link** to view changes

### Method 2: NPM Scripts

Alternative quick commands added to `package.json`:

```bash
# Build + commit + push to staging
npm run push:staging

# Quick commit + push (no build verification)
npm run quick:staging
```

## 📁 File Structure

```
/workspaces/MannyKnows/
├── deploy-staging.sh       # Main deployment script
├── package.json           # Contains npm scripts
└── DEPLOYMENT.md          # This documentation
```

## 🔧 Script Features

### Error Handling
- **Build fails**: Script stops, no deployment happens
- **Git push fails**: Script reports error and exits
- **Success**: Shows confirmation and GitHub link

### Automatic Timestamping
Default commit messages include timestamp:
```
"Update staging: 2025-07-30 17:41:06"
```

### Custom Messages
Always use descriptive commit messages:
```bash
./deploy-staging.sh "Implement Apple-style gradient text selection"
./deploy-staging.sh "Add responsive navigation dock"
./deploy-staging.sh "Fix dark mode theme toggle issues"
```

## 📖 Step-by-Step Workflow

### 1. Make Your Changes
Work on your features in the codespace as normal.

### 2. Deploy to Staging
```bash
# Test your changes locally first
npm run dev

# When ready, deploy to staging
./deploy-staging.sh "Brief description of changes"
```

### 3. Review on GitHub
- Visit the provided GitHub link
- Review changes in staging branch
- Test staging deployment if applicable

### 4. Merge to Production
- Go to GitHub web interface
- Create Pull Request: staging → main
- Review and merge when ready

## 🚨 Troubleshooting

### Permission Denied Error
```bash
chmod +x deploy-staging.sh
```

### Build Fails
```bash
# Check for syntax errors
npm run build

# Fix issues, then try again
./deploy-staging.sh "Fix build errors"
```

### Git Issues
```bash
# Check git status
git status

# Check current branch
git branch

# Ensure you're on staging
git checkout staging
```

### Push Rejected
```bash
# Pull latest changes first
git pull origin staging

# Then deploy again
./deploy-staging.sh "Merge latest changes"
```

## 💡 Best Practices

### Commit Messages
- **Good**: `"Add responsive mobile navigation"`
- **Good**: `"Fix text selection color in dark mode"`
- **Good**: `"Update service cards hover animations"`
- **Avoid**: `"Updates"`, `"Fix stuff"`, `"Changes"`

### Testing
- Always test locally with `npm run dev` first
- Build locally with `npm run build` before deploying
- Review staging changes before merging to main

### Frequency
- Deploy small, incremental changes
- Don't accumulate too many changes before deploying
- Deploy at logical stopping points

## 🔄 Branch Strategy

```
main (production)
 ↑
 │ (manual merge via GitHub)
 │
staging (preview/testing)
 ↑
 │ (automated via script)
 │
local codespace (development)
```

## 📝 Quick Reference

### Most Common Commands
```bash
# Quick deployment
./deploy-staging.sh "Brief change description"

# Check what will be committed
git status

# View recent commits
git log --oneline -5

# Check current branch
git branch
```

### Emergency Reset
If something goes wrong:
```bash
# See recent commits
git log --oneline -10

# Reset to previous commit (replace HASH)
git reset --hard HASH

# Force push to staging (use carefully!)
git push origin staging --force
```

## 🎯 Success Indicators

After running the script, you should see:
- ✅ Build successful message
- ✅ Commit created confirmation
- ✅ Push successful message
- ✅ GitHub link to view changes

## 📞 Support

If you encounter issues:
1. Check this documentation first
2. Review error messages carefully
3. Try the troubleshooting steps
4. Use `git status` to understand current state

---

**Remember**: This script only handles staging deployment. Production merges are done manually via GitHub's web interface for safety and review.
