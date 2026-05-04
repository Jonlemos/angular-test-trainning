# CI/CD Pipeline - GitHub Actions

## Overview
This skill defines the continuous integration and deployment pipeline for the Itaú PJ Dashboard using GitHub Actions, following best practices for monorepo management, testing, building, and deploying to AWS [web:121][web:127].

## Pipeline Architecture

┌─────────────────────────────────────────────────────────┐
│ Code Push to GitHub                                     │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ PR Check (feature/, bugfix/)                            │
│ - Lint                                                  │
│ - Unit Tests                                            │
│ - Build                                                 │
│ - Security Scan                                         │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ Merge to Main                                           │
│ - All PR checks                                         │
│ - Integration Tests                                     │
│ - E2E Tests                                             │
│ - Build Production                                      │
│ - Deploy to Staging                                     │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│ Release Tag (v*..)                                      │
│ - Deploy to Production                                  │
│ - Smoke Tests                                           │
│ - Rollback if failed                                    │
└─────────────────────────────────────────────────────────┘


## Main CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
      - 'feature/**'
      - 'bugfix/**'
      - 'hotfix/**'
  pull_request:
    branches:
      - main
      - develop
  release:
    types: [published]

env:
  NODE_VERSION: '20'
  CACHE_VERSION: v1

jobs:
  # Job 1: Lint and Code Quality
  lint:
    name: Lint & Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd apps/angular-host && npm ci
          cd ../react-login-remote && npm ci
          cd ../backend/auth-service && npm ci
          cd ../charge-service && npm ci
          cd ../renegotiation-service && npm ci
      
      - name: Run ESLint (Angular)
        run: |
          cd apps/angular-host
          npm run lint
      
      - name: Run ESLint (React)
        run: |
          cd apps/react-login-remote
          npm run lint
      
      - name: Run Prettier check
        run: npm run format:check
      
      - name: Check TypeScript types
        run: |
          cd apps/angular-host && npm run type-check
          cd ../react-login-remote && npm run type-check

  # Job 2: Unit Tests
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    
    strategy:
      matrix:
        project: [angular-host, react-login-remote, auth-service, charge-service, renegotiation-service]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies - ${{ matrix.project }}
        run: |
          if [[ "${{ matrix.project }}" == "angular-host" || "${{ matrix.project }}" == "react-login-remote" ]]; then
            cd apps/${{ matrix.project }}
          else
            cd apps/backend/${{ matrix.project }}
          fi
          npm ci
      
      - name: Run unit tests - ${{ matrix.project }}
        run: |
          if [[ "${{ matrix.project }}" == "angular-host" || "${{ matrix.project }}" == "react-login-remote" ]]; then
            cd apps/${{ matrix.project }}
          else
            cd apps/backend/${{ matrix.project }}
          fi
          npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: ${{ matrix.project }}
          name: ${{ matrix.project }}-coverage

  # Job 3: Integration Tests
  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: test-unit
    if: github.ref == 'refs/heads/main' || github.event_name == 'pull_request'
    
    services:
      db:
        image: node:20-alpine
        options: >-
          --health-cmd "wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install backend dependencies
        run: |
          cd apps/backend/auth-service && npm ci
          cd ../charge-service && npm ci
          cd ../renegotiation-service && npm ci
          cd ../db && npm ci
      
      - name: Start services
        run: |
          cd apps/backend
          npm run start:all &
          sleep 10
      
      - name: Run integration tests
        run: |
          cd apps/backend
          npm run test:integration
      
      - name: Stop services
        if: always()
        run: pkill -f node

  # Job 4: E2E Tests
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test-integration
    if: github.ref == 'refs/heads/main' || github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install Playwright
        run: |
          npm ci
          npx playwright install --with-deps
      
      - name: Install all dependencies
        run: |
          cd apps/angular-host && npm ci
          cd ../react-login-remote && npm ci
          cd ../backend/auth-service && npm ci
          cd ../backend/charge-service && npm ci
          cd ../backend/renegotiation-service && npm ci
          cd ../backend/db && npm ci
      
      - name: Build applications
        run: |
          cd apps/angular-host && npm run build
          cd ../react-login-remote && npm run build
      
      - name: Start all services
        run: |
          cd apps/backend && npm run start:all &
          cd apps/angular-host && npm run start:prod &
          cd apps/react-login-remote && npm run start:prod &
          sleep 20
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # Job 5: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run npm audit
        run: |
          npm audit --audit-level=moderate || true
          cd apps/angular-host && npm audit --audit-level=moderate || true
          cd ../react-login-remote && npm audit --audit-level=moderate || true
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # Job 6: Build Production
  build:
    name: Build Production
    runs-on: ubuntu-latest
    needs: [test-unit, security]
    if: github.ref == 'refs/heads/main' || github.event_name == 'release'
    
    strategy:
      matrix:
        app: [angular-host, react-login-remote]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies - ${{ matrix.app }}
        run: |
          cd apps/${{ matrix.app }}
          npm ci
      
      - name: Build ${{ matrix.app }}
        run: |
          cd apps/${{ matrix.app }}
          npm run build
        env:
          NODE_ENV: production
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.app }}-build
          path: apps/${{ matrix.app }}/dist
          retention-days: 7

  # Job 7: Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, test-e2e]
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging-pj.itau.com.br
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download Angular build
        uses: actions/download-artifact@v4
        with:
          name: angular-host-build
          path: ./dist/angular-host
      
      - name: Download React build
        uses: actions/download-artifact@v4
        with:
          name: react-login-remote-build
          path: ./dist/react-login-remote
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Angular to S3
        run: |
          aws s3 sync ./dist/angular-host s3://itau-pj-staging-angular --delete
      
      - name: Deploy React to S3
        run: |
          aws s3 sync ./dist/react-login-remote s3://itau-pj-staging-react --delete
      
      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_STAGING_DISTRIBUTION_ID }} \
            --paths "/*"
      
      - name: Deploy backend services
        run: |
          # Deploy to ECS or Lambda (example)
          echo "Deploying backend services to staging..."

  # Job 8: Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://pj.itau.com.br
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download builds
        uses: actions/download-artifact@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: us-east-1
      
      - name: Deploy to Production S3
        run: |
          aws s3 sync ./angular-host-build s3://itau-pj-prod-angular --delete
          aws s3 sync ./react-login-remote-build s3://itau-pj-prod-react --delete
      
      - name: Invalidate Production CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_PROD_DISTRIBUTION_ID }} \
            --paths "/*"
      
      - name: Run smoke tests
        run: |
          npm ci
          npm run test:smoke -- --url=https://pj.itau.com.br
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  # Job 9: Rollback (Manual trigger)
  rollback:
    name: Rollback Production
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: us-east-1
      
      - name: Rollback to previous version
        run: |
          # Restore from backup or previous build
          echo "Rolling back to previous deployment..."
```

## Branch Protection Rules

```yaml
# .github/branch-protection.yml
main:
  required_status_checks:
    - lint
    - test-unit
    - test-integration
    - test-e2e
    - security
  required_approvals: 2
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  enforce_admins: false

develop:
  required_status_checks:
    - lint
    - test-unit
  required_approvals: 1
```

## Secrets Configuration

Required GitHub Secrets:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD

# CloudFront
CLOUDFRONT_STAGING_DISTRIBUTION_ID
CLOUDFRONT_PROD_DISTRIBUTION_ID

# Security
SNYK_TOKEN
SONAR_TOKEN

# Notifications
SLACK_WEBHOOK
```

## Performance Budgets

```yaml
# .github/workflows/performance-budget.yml
name: Performance Budget

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Audit URLs using Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://staging-pj.itau.com.br
          budgetPath: ./budget.json
          uploadArtifacts: true
```

```json
// budget.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

---

*Follow this CI/CD pipeline to ensure quality, security, and reliable deployments.*