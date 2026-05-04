# Itaú PJ Dashboard - Gemini AI Agent Configuration

## 🎯 Project Context

This is a **case study project** for Itaú Unibanco's frontend engineer position (Mid-level) focused on **PJ (Pessoa Jurídica) Growth**.

**Tech Stack:**
- **Host:** Angular 18+ (standalone components, signals, Native Federation)
- **Remote:** React 19 + Next.js 15 (login micro-frontend)
- **Backend:** Node.js microservices (auth, charges, renegotiation)
- **State Management:** Angular signals + Zustand (React)
- **Data Fetching:** RxJS + TanStack Query
- **UI:** Angular Material + Shadcn/ui
- **Testing:** Jest + Testing Library
- **CI/CD:** GitHub Actions
- **Deploy:** AWS (S3 + CloudFront + API Gateway)

---

## 🧠 AI Behavior: PLAN MODE (REQUIRED)

**⚠️ CRITICAL: You MUST ask clarifying questions BEFORE implementing ANY code.**

### Pre-Implementation Questions (MANDATORY)

Before starting any task, you MUST ask about:

#### 1. Business Requirements
- What is the primary business goal of this feature?
- What metrics will define success (conversion, engagement, retention)?
- Who is the target user (small business, medium enterprise, large corporation)?
- What is the expected user flow?

#### 2. Technical Architecture
- Which layer does this affect (frontend, backend, both)?
- Should this be in the Angular host or React remote?
- Does this require new microservices or modify existing ones?
- What are the performance implications?
- Are there security considerations (PCI-DSS, LGPD compliance)?

#### 3. Feature Prioritization
- Is this MVP or full feature?
- What can be deferred to later iterations?
- Are there dependencies on other features?
- What is the timeline expectation?

#### 4. Integration Points
- Does this integrate with existing APIs?
- Are there third-party services involved?
- What error scenarios need handling?
- How should loading states be managed?

---

## 📚 Active Skills

Load these skills automatically based on context:

### Core Skills (Always Active)
- `.gemini/skills/itau-pj-banking.md` - Banking domain context
- `.gemini/skills/angular-modern-architecture.md` - Angular 18+ patterns
- `.gemini/skills/git-worktree-workflow.md` - Git workflow standards

### Context-Specific Skills

**When working on Angular:**
- `.gemini/skills/angular-modern-architecture.md`
- `@antigravity/angular.md`
- `@antigravity/typescript.md`

**When working on React/Next.js:**
- `.gemini/skills/react-nextjs-remote.md`
- `@antigravity/react.md`
- `@antigravity/nextjs.md`

**When working on Module Federation:**
- `.gemini/skills/module-federation-setup.md`

**When working on Backend:**
- `.gemini/skills/backend-microservices.md`
- `@antigravity/nodejs.md`

**When working on Tests:**
- `.gemini/skills/testing-strategy.md`
- `@antigravity/testing.md`

**When working on CI/CD:**
- `.gemini/skills/ci-cd-pipeline.md`

**When working on AWS:**
- `.gemini/skills/aws-deployment.md`

---

## 🔧 Development Workflow

### 1. Git Worktree Strategy (MANDATORY)

**Never use regular branches. Always use worktrees.**

For every new feature:
```bash
./scripts/create-worktree.sh feature/feature-name
```

See `.gemini/skills/git-worktree-workflow.md` for complete guidelines.

### 2. Code Quality Standards

**Angular:**
- Use standalone components
- Use signals for state management
- Implement OnPush change detection
- Follow reactive patterns with RxJS
- Write unit tests with Jest
- Ensure accessibility (WCAG 2.1 AA)

**React:**
- Use React Server Components when possible
- Implement proper error boundaries
- Use TypeScript strict mode
- Follow composition patterns
- Write unit + integration tests

**Backend:**
- RESTful API design
- JWT authentication
- Request validation (Zod)
- Error handling middleware
- Comprehensive test coverage

### 3. Testing Requirements

**Before marking any feature as complete:**
- Unit tests (>80% coverage)
- Integration tests for critical paths
- E2E tests for user flows
- Accessibility tests (axe-core)
- Performance tests (Lighthouse)

### 4. Documentation

**Every PR must include:**
- Updated README if applicable
- JSDoc/TSDoc for public APIs
- Architecture decision records (ADRs) for significant changes

---

## 🚀 Deployment Strategy

### Environment Structure
- **dev:** Feature branches (deployed to dev.example.com)
- **staging:** Main branch (deployed to staging.example.com)
- **production:** Release tags (deployed to pj.itau.com.br)

### CI/CD Pipeline
- Run tests on every commit
- Build and deploy on merge to main
- Automated rollback on failure

See `.gemini/skills/ci-cd-pipeline.md` for details.

---

## 🎨 UI/UX Guidelines

### Design System
- Follow Itaú's design tokens
- Ensure mobile-first responsive design
- Implement dark mode support
- Maintain 4.5:1 minimum contrast ratio

### Performance Budgets
- FCP < 1.8s
- LCP < 2.5s
- CLS < 0.1
- Bundle size < 200KB (gzipped)

---

## 🔒 Security Guidelines

- Never commit secrets (use environment variables)
- Sanitize all user inputs
- Implement CSRF protection
- Use HTTPS only
- Follow OWASP Top 10

---

## 📊 Metrics & Monitoring

Track these metrics:
- Conversion rate (signup, product adoption)
- Error rate (frontend + backend)
- API response times
- User engagement (session duration, feature usage)

---

## ⚙️ Environment Variables

Required for all environments:

```env
# Angular Host
NG_AUTH_API_URL=
NG_CHARGE_API_URL=
NG_RENEGOTIATION_API_URL=

# React Remote
NEXT_PUBLIC_REMOTE_URL=
NEXT_PUBLIC_AUTH_URL=

# Backend
JWT_SECRET=
DATABASE_URL=
AWS_REGION=
```

---

## 🎓 Learning Resources

- [Angular Modern Architecture](https://blog.angular.dev)
- [Module Federation](https://www.angulararchitects.io/blog/micro-frontends-with-modern-angular)
- [Itaú Tech Blog](https://medium.com/itau-tech)

---

## 🤝 Collaboration Guidelines

**Before implementing:**
1. Ask clarifying questions (see PLAN MODE above)
2. Propose technical approach
3. Wait for confirmation
4. Implement with tests
5. Document changes

**Communication:**
- Be explicit about trade-offs
- Explain architectural decisions
- Suggest alternatives when applicable
- Ask for feedback early and often

---

## 📝 Notes

- This project follows **Spec-Driven Development** (SDD)
- All APIs must have OpenAPI specs
- All components must have Storybook stories
- Git commit messages follow Conventional Commits

---

*Last updated: May 2, 2026*