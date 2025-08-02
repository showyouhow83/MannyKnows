# 🚀 MannyKnows Development Workflow

## 📋 Overview

This project uses a **feature branch workflow** with automated deployment scripts. Each feature is developed in isolation, reviewed via pull requests, and deployed through a controlled pipeline.

## 🌿 Branch Structure

```
main (production)           ← Live website
    ↑
development (staging)       ← Integration branch for features
    ↑
feature/feature-name        ← Individual feature development
hotfix/urgent-fix          ← Critical production fixes
```

## 🛠️ Quick Start Guide

### Starting a New Feature

```bash
# Create and switch to new feature branch
./deploy.sh feature/navbar-improvements

# The script automatically:
# ✅ Creates branch from development
# ✅ Switches you to the new branch  
# ✅ Sets up GitHub tracking
# ✅ Ready for development!
```

### Working on Your Feature

```bash
# Make code changes in VS Code...

# Save progress frequently
./deploy.sh feature/navbar-improvements "Add search functionality"
./deploy.sh feature/navbar-improvements "Fix responsive design"
./deploy.sh feature/navbar-improvements "Add hover animations"

# Each command:
# ✅ Builds the project
# ✅ Commits your changes
# ✅ Pushes to GitHub
```

### Completing Your Feature

1. **Create Pull Request:**
   - Go to [GitHub Repository](https://github.com/showyouhow83/MannyKnows)
   - Create PR: `feature/navbar-improvements` → `development`
   - Add description of changes

2. **Code Review & Merge:**
   - Automated tests run
   - Review process (if team)
   - Merge via GitHub interface

3. **Clean Up:**
   ```bash
   git checkout development
   git pull origin development
   git branch -d feature/navbar-improvements  # Delete local branch
   ```

### Deploying to Production

```bash
# Deploy stable features to production
./deploy.sh production "Release v1.2.0 - Added navbar improvements"
```

## 🎯 Deploy Script Usage

### Script Intelligence

The `./deploy.sh` script is intelligent and adapts based on your input:

| Command | What It Does |
|---------|-------------|
| `./deploy.sh feature/my-feature` | **Creates** new feature branch |
| `./deploy.sh feature/my-feature "Add login"` | **Commits** work to feature branch |
| `./deploy.sh development "Merge features"` | **Deploys** to development |
| `./deploy.sh production "Release v1.0"` | **Deploys** to production |
| `./deploy.sh "Fix bug"` | **Commits** to current branch |

### Common Commands

```bash
# Feature Development
./deploy.sh feature/chat-improvements           # Start new feature
./deploy.sh feature/chat-improvements "Add emoji picker"  # Save work

# Branch Management  
./deploy.sh development "Integrate new features"  # Deploy to development
./deploy.sh production "Release v1.3.0"          # Deploy to production

# Quick commits to current branch
./deploy.sh "Fix typo in documentation"          # Commit to whatever branch you're on
```

## 📁 Project Structure

```
MannyKnows/
├── src/
│   ├── components/           # Reusable Astro components
│   │   ├── ui/              # UI components (buttons, cards, etc.)
│   │   ├── navigation/      # Navigation components  
│   │   ├── sections/        # Page sections
│   │   └── content/         # Content components
│   ├── layouts/             # Page layouts
│   └── pages/               # Route pages
├── public/                  # Static assets
├── deploy.sh               # Deployment script
├── astro.config.mjs        # Astro configuration
└── package.json            # Dependencies
```

## 🔧 Component Architecture

All components are modular and self-contained:

- **Styling**: Scoped CSS within components
- **TypeScript**: Proper interface definitions
- **Reusability**: Components can be used across pages
- **Maintainability**: Each component has single responsibility

## 🚦 Best Practices

### Feature Branch Naming

```bash
feature/navbar-improvements     # UI/UX improvements
feature/chat-functionality     # New features
feature/performance-optimization # Performance work
feature/responsive-design      # Design changes
hotfix/deployment-bug         # Critical fixes
```

### Commit Messages

```bash
# Good commit messages
./deploy.sh feature/navbar "Add search bar with autocomplete"
./deploy.sh feature/navbar "Fix mobile navigation collapse"
./deploy.sh feature/navbar "Improve accessibility with ARIA labels"

# Avoid vague messages
./deploy.sh feature/navbar "updates"
./deploy.sh feature/navbar "fix stuff"
```

### Code Quality

- ✅ **Build before commit**: Script automatically builds and validates
- ✅ **Small, focused commits**: One logical change per commit
- ✅ **Test changes**: Verify functionality before pushing
- ✅ **Clean code**: Follow existing patterns and conventions

## 🔄 Workflow Examples

### Example 1: Adding New UI Component

```bash
# Start feature
./deploy.sh feature/new-button-component

# Create the component file
# src/components/ui/NewButton.astro

# Save progress
./deploy.sh feature/new-button-component "Create NewButton component with TypeScript interface"

# Use it in a page
./deploy.sh feature/new-button-component "Integrate NewButton in navigation"

# Style and refine
./deploy.sh feature/new-button-component "Add hover animations and responsive styles"

# Create PR when done
# GitHub: feature/new-button-component → development
```

### Example 2: Fixing a Bug

```bash
# For urgent fixes, use hotfix branches
./deploy.sh hotfix/chat-modal-bug

# Fix the issue
./deploy.sh hotfix/chat-modal-bug "Fix chat modal z-index conflict"

# Deploy directly to production if critical
./deploy.sh production "Hotfix: Fix chat modal display issue"
```

### Example 3: Regular Development Cycle

```bash
# Week 1: Work on feature A
./deploy.sh feature/user-dashboard
./deploy.sh feature/user-dashboard "Add user profile section"
./deploy.sh feature/user-dashboard "Add settings panel"
# Create PR, merge to development

# Week 2: Work on feature B  
./deploy.sh feature/notification-system
./deploy.sh feature/notification-system "Add notification component"
./deploy.sh feature/notification-system "Integrate with chat system"
# Create PR, merge to development

# Week 3: Deploy to production
./deploy.sh production "Release v1.4.0 - User dashboard and notifications"
```

## 🎨 Development Tips

### VS Code Integration

- Use the integrated terminal for deploy commands
- Git integration shows branch status
- File explorer shows which files changed

### Debugging

```bash
# If build fails, check the error output
npm run build

# If push fails, check git status
git status
git log --oneline -5
```

### Branch Management

```bash
# See all branches
git branch -a

# Clean up old feature branches
git branch -d feature/completed-feature

# Switch between branches manually
git checkout development
git checkout feature/my-feature
```

## 🤖 AI Assistant Instructions

When helping with this project:

1. **Use the deploy script**: Always use `./deploy.sh` for deployments
2. **Follow feature branch workflow**: Create new branches for features
3. **Build before deploy**: Script handles this automatically
4. **Provide helpful commit messages**: Be descriptive and specific
5. **Guide through workflow**: Help users understand the process

### Common AI Assistant Commands

```bash
# Start new feature
./deploy.sh feature/user-requested-feature

# Save work in progress  
./deploy.sh feature/user-requested-feature "Implement user's requirements"

# Deploy when ready
./deploy.sh development "Add new user-requested feature"
```

## 🆘 Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Check for TypeScript errors
npm run build

# Fix errors, then redeploy
./deploy.sh feature/my-feature "Fix build errors"
```

**Push Rejected:**
```bash
# Pull latest changes
git pull origin development

# Resolve conflicts if any, then redeploy
./deploy.sh feature/my-feature "Merge latest changes"
```

**Wrong Branch:**
```bash
# Check current branch
git branch

# Switch to correct branch
git checkout feature/correct-branch
```

### Getting Help

1. **Check script output**: Deploy script provides detailed feedback
2. **Review this documentation**: Most workflows are covered here
3. **Use git status**: See current state of repository
4. **Ask for help**: Team members or AI assistant can guide you

---

**Happy coding!** 🚀 This workflow is designed to make development smooth, safe, and professional.
