#!/bin/bash
# scripts/create-worktree.sh
# Automates the creation of git worktrees for new features.

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: Feature name required.${NC}"
    echo "Usage: ./scripts/create-worktree.sh feature/feature-name"
    exit 1
fi

BRANCH_NAME=$1
# Clean branch name for folder (replace / with -)
FOLDER_NAME=$(echo "$BRANCH_NAME" | sed 's/\//-/g')
WORKTREE_PATH="../worktrees/$FOLDER_NAME"

echo -e "${BLUE}🚀 Creating worktree for $BRANCH_NAME...${NC}"

# Check if worktree directory exists
if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}Error: Worktree directory $WORKTREE_PATH already exists.${NC}"
    exit 1
fi

# Create the worktree
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" main

echo -e "${GREEN}✅ Worktree created at $WORKTREE_PATH${NC}"

# Post-creation setup
echo -e "${BLUE}📦 Running initial setup in worktree...${NC}"
cd "$WORKTREE_PATH"

# Symlink environment files from main repo to worktree for convenience
echo -e "${BLUE}🔗 Linking environment files...${NC}"
# Use absolute paths for symlinks to ensure they work correctly
ORIGIN_PATH=$(pwd -P | sed "s/worktrees\/$FOLDER_NAME//")

# Host env
mkdir -p apps/angular-host/src/environments
ln -sf "$ORIGIN_PATH/apps/angular-host/src/environments/environment.ts" apps/angular-host/src/environments/environment.ts

# Remote env
ln -sf "$ORIGIN_PATH/apps/react-login-remote/.env" apps/react-login-remote/.env

# Backend env
ln -sf "$ORIGIN_PATH/apps/backend/.env" apps/backend/.env

echo -e "${GREEN}✨ Setup complete. Happy coding!${NC}"
echo -e "${YELLOW}To start working:${NC}"
echo "  cd $WORKTREE_PATH"
