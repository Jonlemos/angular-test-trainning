# Git Worktree Workflow - Best Practices

## Overview
This skill defines the Git worktree workflow for the Itaú PJ Dashboard project. Worktrees allow you to work on multiple branches simultaneously without switching contexts, improving productivity and reducing conflicts [web:113][web:117].

## Why Worktrees Over Branches?

### Traditional Branches (Problems)
❌ Need to stash/commit changes before switching  
❌ Node_modules conflicts when switching  
❌ Build artifacts get mixed  
❌ Can't run multiple versions simultaneously  
❌ Lost context when switching  

### Worktrees (Benefits)
✅ Work on multiple features in parallel  
✅ Independent node_modules per worktree  
✅ Isolated build outputs  
✅ Run dev servers side-by-side  
✅ Easy to compare implementations  
✅ Clean separation of concerns  

## Worktree Directory Structure
itau-pj-dashboard/ # Main repository
├── .git/ # Git metadata (shared)
├── apps/ # Main working tree (main branch)
├── docs/
├── README.md
└── worktrees/ # All feature worktrees
├── feature-login-ui/ # Feature 1
│ ├── apps/
│ ├── node_modules/ # Independent
│ └── package.json
├── feature-dashboard-refactor/ # Feature 2
│ ├── apps/
│ └── node_modules/ # Independent
└── bugfix-auth-timeout/ # Bugfix
├── apps/
└── node_modules/


## Setup Script

```bash
#!/bin/bash
# scripts/create-worktree.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
WORKTREE_DIR="worktrees"
MAIN_BRANCH="main"

# Function to display usage
usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  ./scripts/create-worktree.sh <type>/<name>"
    echo ""
    echo -e "${BLUE}Types:${NC}"
    echo "  feature   - New feature development"
    echo "  bugfix    - Bug fixes"
    echo "  hotfix    - Critical production fixes"
    echo "  refactor  - Code refactoring"
    echo "  test      - Testing/experimental changes"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  ./scripts/create-worktree.sh feature/login-ui"
    echo "  ./scripts/create-worktree.sh bugfix/auth-timeout"
    echo "  ./scripts/create-worktree.sh hotfix/security-patch"
    exit 1
}

# Check if argument is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Error: Branch name required${NC}"
    usage
fi

BRANCH_NAME=$1

# Validate branch name format
if [[ ! $BRANCH_NAME =~ ^(feature|bugfix|hotfix|refactor|test)/ ]]; then
    echo -e "${YELLOW}Error: Branch must start with feature/, bugfix/, hotfix/, refactor/, or test/${NC}"
    usage
fi

# Create worktrees directory if it doesn't exist
mkdir -p $WORKTREE_DIR

# Extract clean name from branch
WORKTREE_NAME=$(echo $BRANCH_NAME | sed 's/\//-/g')
WORKTREE_PATH="$WORKTREE_DIR/$WORKTREE_NAME"

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${YELLOW}Worktree already exists at $WORKTREE_PATH${NC}"
    echo -e "${BLUE}Navigating to existing worktree...${NC}"
    cd $WORKTREE_PATH
    exit 0
fi

echo -e "${BLUE}Creating new worktree: $BRANCH_NAME${NC}"

# Create new branch from main
git fetch origin $MAIN_BRANCH
git worktree add -b $BRANCH_NAME $WORKTREE_PATH origin/$MAIN_BRANCH

echo -e "${GREEN}✓ Worktree created successfully!${NC}"
echo ""

# Navigate to worktree
cd $WORKTREE_PATH

echo -e "${BLUE}Installing dependencies...${NC}"

# Install root dependencies
npm install

# Install Angular app dependencies
if [ -d "apps/angular-host" ]; then
    echo -e "${BLUE}Installing Angular dependencies...${NC}"
    cd apps/angular-host && npm install && cd ../..
fi

# Install React app dependencies
if [ -d "apps/react-login-remote" ]; then
    echo -e "${BLUE}Installing React dependencies...${NC}"
    cd apps/react-login-remote && npm install && cd ../..
fi

# Install backend dependencies
if [ -d "apps/backend" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd apps/backend/auth-service && npm install && cd ../../..
    cd apps/backend/charge-service && npm install && cd ../../..
    cd apps/backend/renegotiation-service && npm install && cd ../../..
    cd apps/backend/db && npm install && cd ../../..
fi

echo ""
echo -e "${GREEN}✓ All dependencies installed!${NC}"
echo ""
echo -e "${BLUE}Worktree ready at:${NC} $WORKTREE_PATH"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  cd $WORKTREE_PATH"
echo "  # Make your changes"
echo "  git add ."
echo "  git commit -m 'Your commit message'"
echo "  git push -u origin $BRANCH_NAME"
echo ""
echo -e "${YELLOW}To remove this worktree later:${NC}"
echo "  ./scripts/remove-worktree.sh $WORKTREE_NAME"
```

## Remove Worktree Script

```bash
#!/bin/bash
# scripts/remove-worktree.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

WORKTREE_DIR="worktrees"

if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./scripts/remove-worktree.sh <worktree-name>${NC}"
    echo ""
    echo -e "${BLUE}Available worktrees:${NC}"
    git worktree list
    exit 1
fi

WORKTREE_NAME=$1
WORKTREE_PATH="$WORKTREE_DIR/$WORKTREE_NAME"

if [ ! -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}Error: Worktree not found at $WORKTREE_PATH${NC}"
    exit 1
fi

# Get branch name
BRANCH_NAME=$(cd $WORKTREE_PATH && git branch --show-current)

echo -e "${YELLOW}Are you sure you want to remove worktree '$WORKTREE_NAME'? (y/N)${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    # Check for uncommitted changes
    if [ -n "$(cd $WORKTREE_PATH && git status --porcelain)" ]; then
        echo -e "${RED}Warning: Worktree has uncommitted changes!${NC}"
        echo -e "${YELLOW}Continue anyway? (y/N)${NC}"
        read -r continue_response
        if [[ ! "$continue_response" =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 1
        fi
    fi
    
    echo -e "${BLUE}Removing worktree...${NC}"
    git worktree remove $WORKTREE_PATH --force
    
    echo -e "${YELLOW}Delete remote branch '$BRANCH_NAME'? (y/N)${NC}"
    read -r delete_branch
    
    if [[ "$delete_branch" =~ ^[Yy]$ ]]; then
        git push origin --delete $BRANCH_NAME 2>/dev/null || echo "Remote branch doesn't exist"
        git branch -D $BRANCH_NAME 2>/dev/null || echo "Local branch doesn't exist"
    fi
    
    echo -e "${GREEN}✓ Worktree removed successfully!${NC}"
else
    echo "Aborted."
fi
```

## List Worktrees Script

```bash
#!/bin/bash
# scripts/list-worktrees.sh

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}Active Worktrees:${NC}"
echo ""

git worktree list | while IFS= read -r line; do
    # Parse worktree info
    path=$(echo $line | awk '{print $1}')
    branch=$(echo $line | grep -oP '\[\K[^\]]+' || echo "detached")
    
    if [ -d "$path" ]; then
        # Check for uncommitted changes
        cd $path
        if [ -n "$(git status --porcelain)" ]; then
            status="${GREEN}(modified)${NC}"
        else
            status="(clean)"
        fi
        cd - > /dev/null
        
        echo -e "  📁 $path"
        echo -e "     Branch: $branch $status"
        echo ""
    fi
done
```

## Daily Workflow

### 1. Start New Feature

```bash
# Create worktree for new feature
./scripts/create-worktree.sh feature/payment-flow

# Navigate to worktree
cd worktrees/feature-payment-flow

# Start development servers
npm run dev  # Start all services
```

### 2. Work on Multiple Features Simultaneously

```bash
# Terminal 1: Work on login UI
cd worktrees/feature-login-ui
npm run dev  # Port 4200

# Terminal 2: Work on dashboard refactor
cd worktrees/feature-dashboard-refactor
npm run dev  # Port 4201 (configure different port)

# Both running simultaneously!
```

### 3. Quick Bug Fix (While Feature in Progress)

```bash
# Don't need to stop or stash current work
./scripts/create-worktree.sh bugfix/auth-timeout

cd worktrees/bugfix-auth-timeout

# Fix bug, commit, push
git add .
git commit -m "fix: resolve auth timeout issue"
git push -u origin bugfix/auth-timeout

# Create PR, merge, remove worktree
cd ../..
./scripts/remove-worktree.sh bugfix-auth-timeout

# Return to feature work (untouched!)
cd worktrees/feature-login-ui
```

### 4. Sync with Main Branch

```bash
cd worktrees/feature-login-ui

# Fetch latest changes
git fetch origin main

# Rebase on main
git rebase origin/main

# Resolve conflicts if any
# Continue development
```

### 5. Finish Feature

```bash
cd worktrees/feature-login-ui

# Ensure all changes are committed
git status

# Push to remote
git push -u origin feature/login-ui

# Create Pull Request on GitHub

# After merge, remove worktree
cd ../..
./scripts/remove-worktree.sh feature-login-ui
```

## Best Practices

### Naming Conventions

```bash
# Features
feature/user-authentication
feature/dashboard-widgets
feature/payment-integration

# Bug fixes
bugfix/login-validation
bugfix/api-timeout

# Hotfixes (production)
hotfix/security-patch
hotfix/critical-data-loss

# Refactoring
refactor/auth-service
refactor/component-structure

# Testing
test/new-architecture
test/performance-optimization
```

### Port Configuration for Multiple Instances

```json
// worktrees/feature-name/apps/angular-host/angular.json
{
  "serve": {
    "options": {
      "port": 4200  // Main: 4200, Worktree 1: 4201, Worktree 2: 4202
    }
  }
}
```

### Environment Isolation

```bash
# Each worktree has its own .env
worktrees/feature-login-ui/.env
worktrees/feature-dashboard/.env

# Don't share environment files
```

### Git Ignore for Worktrees

```gitignore
# .gitignore
worktrees/
!worktrees/.gitkeep
```

## Troubleshooting

### Issue: "Worktree already exists"

```bash
# List all worktrees
git worktree list

# Remove stale worktree
git worktree prune

# Or force remove
git worktree remove worktrees/feature-name --force
```

### Issue: "Branch already exists"

```bash
# Delete local branch
git branch -D feature/name

# Delete remote branch
git push origin --delete feature/name

# Create new worktree
./scripts/create-worktree.sh feature/name
```

### Issue: "Cannot switch worktree"

```bash
# Each worktree is independent
# Just cd to the path directly
cd worktrees/feature-name
```

## Cleanup Commands

```bash
# List all worktrees
./scripts/list-worktrees.sh

# Remove specific worktree
./scripts/remove-worktree.sh feature-name

# Remove all stale worktrees
git worktree prune

# Clean unused branches
git fetch --prune
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d
```

## CI/CD Integration

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches:
      - main
      - 'feature/**'
      - 'bugfix/**'
      - 'hotfix/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Install dependencies (same as worktree setup)
      - name: Install dependencies
        run: |
          npm install
          cd apps/angular-host && npm install
          cd ../react-login-remote && npm install
      
      - name: Run tests
        run: npm test
```

## Quick Reference

```bash
# Create worktree
./scripts/create-worktree.sh feature/name

# List worktrees
./scripts/list-worktrees.sh
# or
git worktree list

# Remove worktree
./scripts/remove-worktree.sh feature-name

# Navigate to worktree
cd worktrees/feature-name

# Push from worktree
git push -u origin feature/name

# Sync with main
git fetch origin main
git rebase origin/main
```

---

*Always use worktrees for parallel development to maintain clean, isolated environments.*