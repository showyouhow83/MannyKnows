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
# Branch Management:
#   ./deploy.sh --cleanup feature/feature-name # Delete feature branch (local & remote) + close PR
#   ./deploy.sh --status                       # Show current git status and pending changes
#   ./deploy.sh --rollback                     # Undo last commit (interactive)
#   ./deploy.sh --list-branches                # Show all local and remote branches
#   ./deploy.sh --switch branch-name           # Switch to existing branch safely
#
# Examples:
#   ./deploy.sh feature/navbar-improvements    # Creates & switches to feature branch
#   ./deploy.sh feature/navbar-improvements "Add search bar"  # Commits work to feature
#   ./deploy.sh development "Merge navbar feature"  # Deploy to development
#   ./deploy.sh production "Release v1.2.0"   # Deploy to production
#   ./deploy.sh --cleanup feature/navbar-improvements  # Delete failed feature branch
#   ./deploy.sh --status                       # Check what changes are pending
#
# Feature Branch Workflow:
#   1. Create feature: ./deploy.sh feature/my-feature
#   2. Work & commit: ./deploy.sh feature/my-feature "Add functionality"
#   3. Create PR on GitHub from feature/my-feature → development
#   4. If you don't like it: ./deploy.sh --cleanup feature/my-feature
#   5. If you do like it: merge via GitHub
#   6. Deploy to production: ./deploy.sh production "Release notes"
#
# What it does:
#   - Intelligently creates or switches to branches
#   - Builds the Astro project (npm run build)
#   - Commits all changes with provided/default message
#   - Pushes to specified environment branch on GitHub
#   - Provides next steps guidance for feature branches
#   - Handles branch cleanup and rollback scenarios
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

# Function to confirm destructive actions
confirm_action() {
    local message=$1
    print_status $YELLOW "⚠️  ${message}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status $BLUE "❌ Operation cancelled"
        exit 0
    fi
}

# Function to show git status
show_status() {
    print_status $BLUE "📊 Current Git Status"
    print_status $GREEN "Branch: $(git branch --show-current)"
    
    if ! git diff --quiet || ! git diff --staged --quiet; then
        print_status $YELLOW "📝 Pending Changes:"
        git status --porcelain | while read -r line; do
            echo "   $line"
        done
        echo
        print_status $BLUE "💡 Use './deploy.sh \"commit message\"' to commit these changes"
    else
        print_status $GREEN "✅ No pending changes"
    fi
    
    # Show recent commits
    print_status $BLUE "📚 Recent Commits:"
    git log --oneline -5 | while read -r line; do
        echo "   $line"
    done
    exit 0
}

# Function to cleanup feature branch
cleanup_branch() {
    local branch_name=$1
    
    if [[ ! "$branch_name" =~ ^feature/ ]]; then
        print_status $RED "❌ Can only cleanup feature branches (feature/*)"
        exit 1
    fi
    
    confirm_action "This will delete branch '$branch_name' locally and remotely, and close any associated PR"
    
    # Get current branch to switch back to development if we're on the branch being deleted
    local current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "$branch_name" ]; then
        print_status $BLUE "🔄 Switching to development branch..."
        git checkout development
        git pull origin development 2>/dev/null
    fi
    
    # Delete local branch if it exists
    if git show-ref --verify --quiet refs/heads/$branch_name; then
        print_status $YELLOW "🗑️  Deleting local branch: $branch_name"
        git branch -D $branch_name
    fi
    
    # Delete remote branch if it exists
    if git ls-remote --exit-code --heads origin $branch_name >/dev/null 2>&1; then
        print_status $YELLOW "🗑️  Deleting remote branch: $branch_name"
        git push origin --delete $branch_name
    fi
    
    # Close PR if GitHub CLI is available
    if command -v gh &> /dev/null; then
        if gh pr view "$branch_name" --json number >/dev/null 2>&1; then
            print_status $YELLOW "🗑️  Closing associated PR..."
            gh pr close "$branch_name" --comment "Closing PR - feature branch deleted via deploy script"
        fi
    fi
    
    print_status $GREEN "✅ Branch cleanup complete!"
    print_status $BLUE "📍 Currently on: $(git branch --show-current)"
    exit 0
}

# Function to rollback last commit
rollback_commit() {
    print_status $BLUE "🔄 Rollback Information"
    
    # Show last commit
    local last_commit=$(git log --oneline -1)
    print_status $YELLOW "Last commit: $last_commit"
    
    # Check if there are uncommitted changes
    if ! git diff --quiet || ! git diff --staged --quiet; then
        print_status $YELLOW "⚠️  You have uncommitted changes that will be preserved"
    fi
    
    confirm_action "This will undo the last commit (but keep your file changes)"
    
    git reset HEAD~1
    print_status $GREEN "✅ Last commit rolled back"
    print_status $BLUE "💡 Your files are unchanged. Use 'git status' to see current state"
    exit 0
}

# Function to list branches
list_branches() {
    print_status $BLUE "🌿 Available Branches"
    
    print_status $GREEN "Local branches:"
    git branch | while read -r line; do
        echo "   $line"
    done
    
    echo
    print_status $GREEN "Remote branches:"
    git branch -r | while read -r line; do
        echo "   $line"
    done
    
    exit 0
}

# Function to safely switch branches
switch_branch() {
    local branch_name=$1
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --staged --quiet; then
        print_status $YELLOW "⚠️  You have uncommitted changes"
        print_status $BLUE "Options:"
        print_status $BLUE "1. Commit changes first: ./deploy.sh \"commit message\""
        print_status $BLUE "2. Stash changes: git stash"
        print_status $BLUE "3. Force switch (lose changes)"
        read -p "Choose option (1/2/3) or cancel (any other key): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                print_status $BLUE "💡 Please commit your changes first, then switch branches"
                exit 0
                ;;
            2)
                git stash
                print_status $GREEN "✅ Changes stashed"
                ;;
            3)
                confirm_action "This will discard all uncommitted changes"
                git reset --hard
                ;;
            *)
                print_status $BLUE "❌ Operation cancelled"
                exit 0
                ;;
        esac
    fi
    
    # Switch to branch
    if git show-ref --verify --quiet refs/heads/$branch_name; then
        git checkout $branch_name
        print_status $GREEN "✅ Switched to: $branch_name"
    elif git show-ref --verify --quiet refs/remotes/origin/$branch_name; then
        git checkout -b $branch_name origin/$branch_name
        print_status $GREEN "✅ Checked out remote branch: $branch_name"
    else
        print_status $RED "❌ Branch '$branch_name' not found"
        exit 1
    fi
    
    exit 0
}

# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Handle special commands first
case "$1" in
    --cleanup)
        if [ -z "$2" ]; then
            print_status $RED "❌ Please specify branch name: ./deploy.sh --cleanup feature/branch-name"
            exit 1
        fi
        cleanup_branch "$2"
        ;;
    --status)
        show_status
        ;;
    --rollback)
        rollback_commit
        ;;
    --list-branches)
        list_branches
        ;;
    --switch)
        if [ -z "$2" ]; then
            print_status $RED "❌ Please specify branch name: ./deploy.sh --switch branch-name"
            exit 1
        fi
        switch_branch "$2"
        ;;
    --help|-h)
        print_status $BLUE "🚀 MannyKnows Deploy Script Help"
        echo
        print_status $GREEN "Basic Usage:"
        print_status $YELLOW "  ./deploy.sh                                # Deploy current branch"
        print_status $YELLOW "  ./deploy.sh \"commit message\"              # Deploy current branch with message"
        print_status $YELLOW "  ./deploy.sh feature/my-feature             # Create/switch to feature branch"
        print_status $YELLOW "  ./deploy.sh feature/my-feature \"message\"   # Commit to feature branch"
        print_status $YELLOW "  ./deploy.sh development \"message\"         # Deploy to development"
        print_status $YELLOW "  ./deploy.sh production \"message\"          # Deploy to production"
        echo
        print_status $GREEN "Branch Management:"
        print_status $YELLOW "  ./deploy.sh --cleanup feature/branch-name  # Delete feature branch + close PR"
        print_status $YELLOW "  ./deploy.sh --status                       # Show git status"
        print_status $YELLOW "  ./deploy.sh --rollback                     # Undo last commit"
        print_status $YELLOW "  ./deploy.sh --list-branches                # List all branches"
        print_status $YELLOW "  ./deploy.sh --switch branch-name           # Switch branches safely"
        echo
        print_status $GREEN "Workflow Example:"
        print_status $BLUE "  1. ./deploy.sh feature/sparkles              # Create feature"
        print_status $BLUE "  2. [make changes]"
        print_status $BLUE "  3. ./deploy.sh feature/sparkles \"Add sparkles\"  # Commit work"
        print_status $BLUE "  4. [decide you don't like it]"
        print_status $BLUE "  5. ./deploy.sh --cleanup feature/sparkles    # Delete everything"
        exit 0
        ;;
esac

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

    # Safety check: ensure we're not accidentally overwriting important branches
    if [[ "$ENVIRONMENT" == "production" ]] || [[ "$ENVIRONMENT" == "main" ]] || [[ "$ENVIRONMENT" == "master" ]]; then
        print_status $RED "❌ Cannot create branch with protected name: $ENVIRONMENT"
        print_status $BLUE "💡 Use existing branch: ./deploy.sh --switch $ENVIRONMENT"
        exit 1
    fi

    # Check if branch exists locally
    if git show-ref --verify --quiet refs/heads/$ENVIRONMENT; then
        print_status $GREEN "✅ Switching to existing local branch: ${ENVIRONMENT}"
        git checkout $ENVIRONMENT
        if [ $? -ne 0 ]; then
            print_status $RED "❌ Failed to switch to branch: $ENVIRONMENT"
            exit 1
        fi
    # Check if branch exists on remote
    elif git show-ref --verify --quiet refs/remotes/origin/$ENVIRONMENT; then
        print_status $GREEN "✅ Checking out existing remote branch: ${ENVIRONMENT}"
        git checkout -b $ENVIRONMENT origin/$ENVIRONMENT
        if [ $? -ne 0 ]; then
            print_status $RED "❌ Failed to checkout remote branch: $ENVIRONMENT"
            exit 1
        fi
    else
        print_status $GREEN "✅ Creating new feature branch: ${ENVIRONMENT}"
        # Create from development branch for features, current for others
        if [[ "$ENVIRONMENT" =~ ^feature/ ]]; then
            # Ensure we start from latest development
            print_status $BLUE "📥 Updating development branch first..."
            git fetch origin development 2>/dev/null || git fetch origin main 2>/dev/null
            git checkout development 2>/dev/null || git checkout main
            if [ $? -ne 0 ]; then
                print_status $RED "❌ Could not switch to development/main branch"
                exit 1
            fi
            git pull origin development 2>/dev/null || git pull origin main
        fi
        git checkout -b $ENVIRONMENT
        if [ $? -ne 0 ]; then
            print_status $RED "❌ Failed to create branch: $ENVIRONMENT"
            exit 1
        fi
        print_status $GREEN "📝 New branch created from development/main"
    fi

    CURRENT_BRANCH=$ENVIRONMENT
fi

# Pre-build safety checks
print_status $BLUE "🔍 Running pre-deployment checks..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_status $RED "❌ Not in a git repository"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_status $RED "❌ package.json not found. Are you in the project root?"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "⚠️  node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_status $RED "❌ Failed to install dependencies"
        exit 1
    fi
fi

print_status $GREEN "✅ Pre-deployment checks passed"

# Build the project
print_status $YELLOW "📦 Building project..."

# Check if build script exists
if ! npm run build --dry-run >/dev/null 2>&1; then
    print_status $RED "❌ Build script not found in package.json"
    exit 1
fi

echo -n "   Building"

# Create build log directory if it doesn't exist
mkdir -p /tmp/deploy-logs

# Show progress dots during build
npm run build > /tmp/deploy-logs/build.log 2>&1 &
BUILD_PID=$!

# Track build progress
BUILD_START_TIME=$(date +%s)
while kill -0 $BUILD_PID 2>/dev/null; do
    echo -n "."
    sleep 1
    
    # Safety timeout after 5 minutes
    BUILD_CURRENT_TIME=$(date +%s)
    if [ $((BUILD_CURRENT_TIME - BUILD_START_TIME)) -gt 300 ]; then
        kill $BUILD_PID 2>/dev/null
        echo ""
        print_status $RED "❌ Build timeout (5 minutes). Check logs: /tmp/deploy-logs/build.log"
        exit 1
    fi
done

wait $BUILD_PID
BUILD_EXIT_CODE=$?

echo "" # New line after dots

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_status $GREEN "✅ Build successful!"
    
    # Show build size if dist folder exists
    if [ -d "dist" ]; then
        BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        print_status $BLUE "📊 Build size: ${BUILD_SIZE:-"unknown"}"
    fi

    # Check if there are any changes to commit
    if git diff --quiet && git diff --staged --quiet; then
        print_status $YELLOW "⚠️  No changes detected. Skipping commit."
        SKIP_COMMIT=true
    else
        # Show what will be committed
        CHANGED_FILES=$(git diff --name-only)
        STAGED_FILES=$(git diff --staged --name-only)
        
        if [ ! -z "$CHANGED_FILES" ] || [ ! -z "$STAGED_FILES" ]; then
            print_status $BLUE "📝 Files to be committed:"
            if [ ! -z "$CHANGED_FILES" ]; then
                echo "$CHANGED_FILES" | while read -r file; do
                    echo "   M $file"
                done
            fi
            if [ ! -z "$STAGED_FILES" ]; then
                echo "$STAGED_FILES" | while read -r file; do
                    echo "   A $file"
                done
            fi
        fi
        
        # Add all changes
        git add -A

        # Commit with message
        print_status $YELLOW "📝 Committing changes..."
        git commit -m "$COMMIT_MSG"
        if [ $? -ne 0 ]; then
            print_status $RED "❌ Failed to commit changes"
            exit 1
        fi
        SKIP_COMMIT=false
    fi

    # Push to specified environment branch
    print_status $YELLOW "📤 Pushing to ${ENVIRONMENT} branch..."
    
    # Check network connectivity
    if ! ping -c 1 github.com >/dev/null 2>&1; then
        print_status $RED "❌ No network connection to GitHub"
        exit 1
    fi
    
    echo -n "   Pushing"
    
    # Show progress dots during push
    git push --force origin HEAD:${ENVIRONMENT} > /tmp/deploy-logs/push.log 2>&1 &
    PUSH_PID=$!
    
    # Track push progress with timeout
    PUSH_START_TIME=$(date +%s)
    while kill -0 $PUSH_PID 2>/dev/null; do
        echo -n "."
        sleep 1
        
        # Safety timeout after 2 minutes
        PUSH_CURRENT_TIME=$(date +%s)
        if [ $((PUSH_CURRENT_TIME - PUSH_START_TIME)) -gt 120 ]; then
            kill $PUSH_PID 2>/dev/null
            echo ""
            print_status $RED "❌ Push timeout (2 minutes). Check logs: /tmp/deploy-logs/push.log"
            exit 1
        fi
    done
    
    wait $PUSH_PID
    PUSH_EXIT_CODE=$?
    
    echo "" # New line after dots
    
    if [ $PUSH_EXIT_CODE -eq 0 ]; then
        print_status $GREEN "🎉 Successfully deployed to ${ENVIRONMENT}!"
        print_status $BLUE "💡 View your changes at: https://github.com/showyouhow83/MannyKnows/tree/${ENVIRONMENT}"

        if [ "$SKIP_COMMIT" = false ]; then
            print_status $GREEN "📋 Commit message: ${COMMIT_MSG}"
            
            # Show commit hash
            COMMIT_HASH=$(git rev-parse --short HEAD)
            print_status $BLUE "🔗 Commit hash: ${COMMIT_HASH}"
        fi

        # Feature branch specific guidance
        if [[ "$ENVIRONMENT" =~ ^feature/ ]]; then
            print_status $PURPLE "🔄 Feature Branch Next Steps:"
            print_status $YELLOW "   • Continue work: ./deploy.sh ${ENVIRONMENT} \"Your commit message\""
            
            # Check if GitHub CLI is available and create PR automatically
            if command -v gh &> /dev/null; then
                print_status $GREEN "🚀 Creating Pull Request automatically..."
                echo -n "   Checking for existing PR"
                
                # Check if PR already exists with progress dots
                (
                    sleep 1
                    gh pr view "${ENVIRONMENT}" --json number > /dev/null 2>&1
                    echo $? > /tmp/pr_check.exit
                ) &
                PR_CHECK_PID=$!
                
                while kill -0 $PR_CHECK_PID 2>/dev/null; do
                    echo -n "."
                    sleep 0.5
                done
                
                wait $PR_CHECK_PID
                PR_EXISTS=$(cat /tmp/pr_check.exit)
                rm -f /tmp/pr_check.exit
                
                echo "" # New line after dots
                
                if [ "$PR_EXISTS" -eq 0 ]; then
                    print_status $BLUE "📋 PR already exists: $(gh pr view "${ENVIRONMENT}" --json url --jq '.url')"
                else
                    print_status $YELLOW "   Creating new PR..."
                    echo -n "   Processing"
                    
                    # Create new PR with progress dots
                    (
                        PR_URL=$(gh pr create \
                            --title "${ENVIRONMENT}: ${COMMIT_MSG}" \
                            --body "## Changes\n${COMMIT_MSG}\n\n## Feature Branch\n\`${ENVIRONMENT}\`\n\nAuto-created by deploy script 🤖" \
                            --base development \
                            --head "${ENVIRONMENT}" 2>/dev/null)
                        
                        echo "$PR_URL" > /tmp/pr_url.txt
                        echo $? > /tmp/pr_create.exit
                    ) &
                    PR_CREATE_PID=$!
                    
                    while kill -0 $PR_CREATE_PID 2>/dev/null; do
                        echo -n "."
                        sleep 0.5
                    done
                    
                    wait $PR_CREATE_PID
                    PR_CREATE_EXIT=$(cat /tmp/pr_create.exit)
                    
                    echo "" # New line after dots
                    
                    if [ "$PR_CREATE_EXIT" -eq 0 ]; then
                        PR_URL=$(cat /tmp/pr_url.txt)
                        print_status $GREEN "✅ Pull Request created: ${PR_URL}"
                    else
                        print_status $YELLOW "⚠️  Could not create PR automatically. Please create manually:"
                        print_status $YELLOW "   • Create PR: https://github.com/showyouhow83/MannyKnows/compare/development...${ENVIRONMENT}"
                    fi
                    
                    rm -f /tmp/pr_url.txt /tmp/pr_create.exit
                fi
            else
                print_status $YELLOW "💡 Install GitHub CLI for automatic PR creation: brew install gh"
                print_status $YELLOW "   • Create PR: https://github.com/showyouhow83/MannyKnows/compare/development...${ENVIRONMENT}"
            fi
            
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
        
        # Show specific error information
        if [ -f "/tmp/deploy-logs/push.log" ]; then
            print_status $YELLOW "🔍 Error details:"
            tail -5 /tmp/deploy-logs/push.log | while read -r line; do
                echo "   $line"
            done
        fi
        
        print_status $BLUE "💡 Common solutions:"
        print_status $BLUE "   • Check network connection"
        print_status $BLUE "   • Verify GitHub permissions"
        print_status $BLUE "   • Try: git push origin ${ENVIRONMENT} --force"
        exit 1
    fi
else
    print_status $RED "❌ Build failed, skipping deployment"
    
    # Show build error information
    if [ -f "/tmp/deploy-logs/build.log" ]; then
        print_status $YELLOW "🔍 Build error details:"
        tail -10 /tmp/deploy-logs/build.log | while read -r line; do
            echo "   $line"
        done
    fi
    
    print_status $BLUE "💡 Common solutions:"
    print_status $BLUE "   • Check TypeScript errors: npm run build"
    print_status $BLUE "   • Verify all imports and syntax"
    print_status $BLUE "   • Check build logs: /tmp/deploy-logs/build.log"
    exit 1
fi

# Final deployment summary
print_status $GREEN "🏁 Deployment Summary"
print_status $BLUE "Branch: ${ENVIRONMENT}"
print_status $BLUE "Time: $(date '+%Y-%m-%d %H:%M:%S')"

# Cleanup temporary files
rm -f /tmp/deploy-logs/build.log /tmp/deploy-logs/push.log 2>/dev/null

print_status $GREEN "✨ All done! Happy coding! ✨"
