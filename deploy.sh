#!/bin/bash

# MannyKnows Environment-Agnostic Deployment Script
# 
# This script automates deployment from local codespace to any GitHub branch/environment
# 
# Usage:
#   ./deploy.sh <environment>                     # Uses default timestamp message
#   ./deploy.sh <environment> "Your message"     # Uses custom commit message
#
# Examples:
#   ./deploy.sh staging                           # Deploy to staging branch
#   ./deploy.sh production "Release v1.2.3"      # Deploy to production with message
#   ./deploy.sh development                       # Deploy to development branch
#   ./deploy.sh feature-branch "New feature"     # Deploy to any custom branch
#
# What it does:
#   1. Validates environment parameter
#   2. Builds the Astro project (npm run build)
#   3. Commits all changes with provided/default message
#   4. Pushes to specified environment branch on GitHub
#   5. Provides success/error feedback with branch-specific URLs
#
# Requirements:
#   - Environment parameter is required
#   - NPM and dependencies installed
#   - Git configured with GitHub access

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Validate that environment parameter is provided
if [ -z "$1" ]; then
    print_status $RED "❌ Error: Environment parameter is required!"
    echo ""
    echo "Usage: ./deploy.sh <environment> [commit_message]"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh staging"
    echo "  ./deploy.sh production 'Release v1.2.3'"
    echo "  ./deploy.sh development 'Feature update'"
    exit 1
fi

# Get environment and commit message from arguments
ENVIRONMENT="$1"
COMMIT_MSG="${2:-"Update ${ENVIRONMENT}: $(date '+%Y-%m-%d %H:%M:%S')"}"

print_status $BLUE "🚀 Deploying to ${ENVIRONMENT} environment..."

# Build the project
print_status $YELLOW "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    print_status $GREEN "✅ Build successful!"
    
    # Check if there are any changes to commit
    if git diff --quiet && git diff --staged --quiet; then
        print_status $YELLOW "⚠️  No changes detected. Skipping commit."
        SKIP_COMMIT=true
    else
        # Add all changes
        git add -A
        
        # Commit with message
        print_status $YELLOW "📝 Committing changes..."
        git commit -m "$COMMIT_MSG"
        SKIP_COMMIT=false
    fi
    
    # Push to specified environment branch
    print_status $YELLOW "📤 Pushing to ${ENVIRONMENT} branch..."
    git push origin HEAD:${ENVIRONMENT}
    
    if [ $? -eq 0 ]; then
        print_status $GREEN "🎉 Successfully deployed to ${ENVIRONMENT}!"
        print_status $BLUE "💡 View your changes at: https://github.com/showyouhow83/MannyKnows/tree/${ENVIRONMENT}"
        
        if [ "$SKIP_COMMIT" = false ]; then
            print_status $GREEN "📋 Commit message: ${COMMIT_MSG}"
        fi
    else
        print_status $RED "❌ Failed to push to ${ENVIRONMENT} branch"
        exit 1
    fi
else
    print_status $RED "❌ Build failed, skipping deployment"
    exit 1
fi

print_status $GREEN "🏁 Deployment complete!"
