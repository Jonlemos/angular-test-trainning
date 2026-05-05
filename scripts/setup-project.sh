#!/bin/bash
# scripts/setup-project.sh

set -e

echo "🚀 Setting up Itaú PJ Dashboard project..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}Warning: Node.js 20+ is recommended. Current version: $(node -v)${NC}"
fi

# Create directory structure
echo -e "${BLUE}Creating directory structure...${NC}"
mkdir -p apps/{angular-host,react-login-remote,backend/{auth-service,charge-service,renegotiation-service,db}}
mkdir -p libs/shared/{types,utils}
mkdir -p diagrams
mkdir -p docs
mkdir -p scripts
mkdir -p worktrees/.gitkeep

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install

# Install Angular dependencies
echo -e "${BLUE}Installing Angular app dependencies...${NC}"
cd apps/angular-host
npm install
cd ../..

# Install React dependencies
echo -e "${BLUE}Installing React app dependencies...${NC}"
cd apps/react-login-remote
npm install
cd ../..

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
for service in auth-service charge-service renegotiation-service db; do
    echo -e "${BLUE}  - Installing $service dependencies...${NC}"
    cd apps/backend/$service
    npm install
    cd ../../..
done

# Setup environment files
echo -e "${BLUE}Setting up environment files...${NC}"
if [ ! -f apps/angular-host/src/environments/environment.ts ]; then
    mkdir -p apps/angular-host/src/environments
    cat > apps/angular-host/src/environments/environment.ts <<EOF
export const environment = {
  production: false,
  authApiUrl: 'http://localhost:3001/api',
  chargeApiUrl: 'http://localhost:3002/api',
  renegotiationApiUrl: 'http://localhost:3003/api',
  enableLogging: true,
  version: '1.0.0'
};
EOF
fi

if [ ! -f apps/react-login-remote/.env ]; then
    cat > apps/react-login-remote/.env <<EOF
VITE_AUTH_API_URL=http://localhost:3001/api
VITE_REMOTE_URL=http://localhost:4201
NODE_ENV=development
EOF
fi

if [ ! -f apps/backend/.env ]; then
    echo -e "${BLUE}Generating secure JWT_SECRET...${NC}"
    # Generate a random string for development
    RANDOM_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "itau-dev-$(date +%s)-secret")
    
    cat > apps/backend/.env <<EOF
# JWT Configuration
JWT_SECRET=$RANDOM_SECRET
JWT_EXPIRES_IN=24h

# Database
DB_URL=http://localhost:3004

# CORS
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4201

# Environment
NODE_ENV=development
LOG_LEVEL=debug
EOF
fi

# Make scripts executable
echo -e "${BLUE}Making scripts executable...${NC}"
chmod +x scripts/*.sh

# Initialize Git hooks (if using husky)
if command -v husky &> /dev/null; then
    echo -e "${BLUE}Setting up Git hooks...${NC}"
    npx husky install
fi

# Generate AWS diagram
echo -e "${BLUE}Generating AWS architecture diagram...${NC}"
cd diagrams
pip3 install -r requirements.txt 2>/dev/null || echo "Skipping diagram generation (Python not installed)"
cd ..

echo ""
echo -e "${GREEN}✅ Project setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Review environment files in apps/*/environments/"
echo "  2. Start development servers:"
echo "     ${YELLOW}npm run dev${NC}"
echo "  3. Create a new feature:"
echo "     ${YELLOW}./scripts/create-worktree.sh feature/my-feature${NC}"
echo ""