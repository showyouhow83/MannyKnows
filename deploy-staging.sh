#!/bin/bash

# MannyKnows Staging Deployment Script
# 
# This script automates deployment from local codespace to GitHub staging branch
# 
# Usage:
#   ./deploy-staging.sh                           # Uses default timestamp message
#   ./deploy-staging.sh "Your commit message"     # Uses custom message
#
# What it does:
#   1. Builds the Astro project (npm run build)
#   2. Commits all changes with provided message
#   3. Pushes to staging branch on GitHub
#   4. Provides success/error feedback
#
# Requirements:
#   - Must be on staging branch
#   - NPM and dependencies installed
#   - Git configured with GitHub access

echo "🚀 Deploying to staging..."

# Get commit message from argument or use default
COMMIT_MSG="${1:-"Update staging: $(date '+%Y-%m-%d %H:%M:%S')"}"

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Add all changes
    git add -A
    
    # Commit with message
    git commit -m "$COMMIT_MSG"
    
    # Push to staging
    echo "📤 Pushing to staging branch..."
    git push origin staging
    
    if [ $? -eq 0 ]; then
        echo "🎉 Successfully deployed to staging!"
        echo "💡 View your changes at: https://github.com/showyouhow83/MannyKnows/tree/staging"
    else
        echo "❌ Failed to push to staging"
        exit 1
    fi
else
    echo "❌ Build failed, skipping deployment"
    exit 1
fi
