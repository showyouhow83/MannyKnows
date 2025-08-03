#!/bin/bash

# MannyKnows Feature Branch Deployment Script
#
# This script automates feature branch workflow and deployment to any GitHub branch/environment
#
# Usage:
#   ./deploy.sh feature/feature-name           # Create new feature branch and switch to it
#   ./deploy.sh feature/feature-name "msg"     # Commit and push changes to feature branch
#   ./deploy.sh development "msg"              # Deploy to development branch
#   ./deploy.sh production "msg"               # Deploy to production branch
#   ./deploy.sh                                # Deploy to current branch with default message
#   ./deploy.sh "commit message"               # Deploy to current branch with custom message
#
# Examples:
#   ./deploy.sh feature/navbar-improvements    # Creates & switches to feature branch
#   ./deploy.sh feature/navbar-improvements "Add search bar"  # Commits work to feature
#   ./deploy.sh development "Merge navbar feature"  # Deploy to development
#   ./deploy.sh production "Release v1.2.0"   # Deploy to production
#
# Feature Branch Workflow:
#   1. Create feature: ./deploy.sh feature/my-feature
#   2. Work & commit: ./deploy.sh feature/my-feature "Add functionality"
#   3. Create PR on GitHub from feature/my-feature → development
#   4. After approval, merge via GitHub
#   5. Deploy to production: ./deploy.sh production "Release notes"
#
# What it does:
#   - Intelligently creates or switches to branches
#   - Builds the Astro project (npm run build)
#   - Commits all changes with provided/default message
#   - Pushes to specified environment branch on GitHub
#   - Provides next steps guidance for feature branches
#
# Requirements:
#   - NPM and dependencies installed
#   - Git configured with GitHub access
#   - Development branch as base for new features

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Intelligent parameter parsing for feature branch workflow
if [ -z "$1" ]; then
    # No parameters - use current branch with default message
    ENVIRONMENT="$CURRENT_BRANCH"
    COMMIT_MSG="Update ${ENVIRONMENT}: $(date '+%Y-%m-%d %H:%M:%S')"
    print_status $BLUE "🎯 No parameters provided, using current branch: ${ENVIRONMENT}"
elif [ $# -eq 1 ]; then
    # One parameter - determine if it's a branch name or commit message
    if [[ "$1" =~ ^feature/ ]] || [[ "$1" == "development" ]] || [[ "$1" == "production" ]] || [[ "$1" =~ ^hotfix/ ]]; then
        # Parameter is a branch name
        ENVIRONMENT="$1"
        if [ "$CURRENT_BRANCH" != "$ENVIRONMENT" ]; then
            # Need to create/switch to this branch
            BRANCH_CREATION_MODE=true
            COMMIT_MSG="Initialize ${ENVIRONMENT} branch"
        else
            # Already on this branch, just deploy with default message
            COMMIT_MSG="Update ${ENVIRONMENT}: $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        print_status $BLUE "🎯 Branch specified: ${ENVIRONMENT}"
    else
        # Parameter is a commit message for current branch
        ENVIRONMENT="$CURRENT_BRANCH"
        COMMIT_MSG="$1"
        print_status $BLUE "🎯 Using current branch: ${ENVIRONMENT} with custom message"
    fi
else
    # Two parameters - branch name and commit message
    ENVIRONMENT="$1"
    COMMIT_MSG="$2"
    if [ "$CURRENT_BRANCH" != "$ENVIRONMENT" ]; then
        BRANCH_CREATION_MODE=true
    fi
    print_status $BLUE "🎯 Branch and message specified: ${ENVIRONMENT}"
fi

print_status $BLUE "🚀 Deploying to ${ENVIRONMENT} environment..."

# Handle feature branch creation/switching
if [ "$BRANCH_CREATION_MODE" = true ]; then
    print_status $YELLOW "🌿 Branch creation mode detected..."

    # Check if branch exists locally
    if git show-ref --verify --quiet refs/heads/$ENVIRONMENT; then
        print_status $GREEN "✅ Switching to existing local branch: ${ENVIRONMENT}"
        git checkout $ENVIRONMENT
    # Check if branch exists on remote
    elif git show-ref --verify --quiet refs/remotes/origin/$ENVIRONMENT; then
        print_status $GREEN "✅ Checking out existing remote branch: ${ENVIRONMENT}"
        git checkout -b $ENVIRONMENT origin/$ENVIRONMENT
    else
        print_status $GREEN "✅ Creating new feature branch: ${ENVIRONMENT}"
        # Create from development branch for features, current for others
        if [[ "$ENVIRONMENT" =~ ^feature/ ]]; then
            git checkout development 2>/dev/null || git checkout main
            git pull origin development 2>/dev/null || git pull origin main
        fi
        git checkout -b $ENVIRONMENT
        print_status $GREEN "📝 New branch created from development/main"
    fi

    CURRENT_BRANCH=$ENVIRONMENT
fi

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
    git push --force origin HEAD:${ENVIRONMENT}

    if [ $? -eq 0 ]; then
        print_status $GREEN "🎉 Successfully deployed to ${ENVIRONMENT}!"
        print_status $BLUE "💡 View your changes at: https://github.com/showyouhow83/MannyKnows/tree/${ENVIRONMENT}"

        if [ "$SKIP_COMMIT" = false ]; then
            print_status $GREEN "📋 Commit message: ${COMMIT_MSG}"
        fi

        # Feature branch specific guidance
        if [[ "$ENVIRONMENT" =~ ^feature/ ]]; then
            print_status $PURPLE "🔄 Feature Branch Next Steps:"
            print_status $YELLOW "   • Continue work: ./deploy.sh ${ENVIRONMENT} \"Your commit message\""
            print_status $YELLOW "   • Create PR: https://github.com/showyouhow83/MannyKnows/compare/development...${ENVIRONMENT}"
            print_status $YELLOW "   • After merge: git checkout development && git pull origin development"
        elif [ "$ENVIRONMENT" = "development" ]; then
            print_status $PURPLE "🚀 Development Deployment Complete"
            print_status $YELLOW "   • Ready for production: ./deploy.sh production \"Release notes\""
        elif [ "$ENVIRONMENT" = "production" ]; then
            print_status $PURPLE "🎉 Production Release Complete!"
            print_status $YELLOW "   • Monitor: Check website and logs for any issues"
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
