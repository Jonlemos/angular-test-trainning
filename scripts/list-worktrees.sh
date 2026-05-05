#!/bin/bash
# scripts/list-worktrees.sh
# Lists all active git worktrees in the project.

set -e

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 List of active Git Worktrees:${NC}"
echo ""

git worktree list

echo ""
