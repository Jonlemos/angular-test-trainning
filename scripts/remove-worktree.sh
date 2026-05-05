#!/bin/bash
# scripts/remove-worktree.sh
# Safely removes a git worktree.

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: Worktree name (folder) required.${NC}"
    echo "Usage: ./scripts/remove-worktree.sh feature-name"
    exit 1
fi

FOLDER_NAME=$1
WORKTREE_PATH="worktrees/$FOLDER_NAME"

# Check if path exists
if [ ! -d "$WORKTREE_PATH" ]; then
    # Try with ../worktrees if called from inside apps
    WORKTREE_PATH="../worktrees/$FOLDER_NAME"
    if [ ! -d "$WORKTREE_PATH" ]; then
        echo -e "${RED}Error: Worktree $FOLDER_NAME not found.${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🗑️  Removing worktree $FOLDER_NAME...${NC}"

# Remove the worktree via git
git worktree remove "$WORKTREE_PATH" --force

echo -e "${GREEN}✅ Worktree removed successfully.${NC}"
