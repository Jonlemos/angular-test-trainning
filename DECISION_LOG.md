# Decision Log - Itaú PJ Dashboard

This document records the key architectural decisions made during the development of the Itaú PJ Dashboard case study.

## [2026-05-04] Migration from Next.js to Vite for Remote MFE

**Context:** The initial setup used Next.js for the React remote. However, integrating Next.js into an Angular Webpack host via Module Federation presented significant compatibility issues with hydration and asset loading.

**Decision:** Migrated the `react-login-remote` to use **Vite 6** with `@module-federation/vite`.

**Rationale:**
- Vite provides a more standard ESM output compatible with modern Module Federation.
- Faster development experience (HMR).
- Simplified "mount function" pattern for Angular integration.

**Status:** Accepted

---

## [2026-05-04] Secure Authentication with Bcrypt and JWT Refresh

**Context:** The initial auth service used plain-text password comparison and lacked session renewal mechanisms, which is insecure for a banking application.

**Decision:**
1. Implemented **Bcrypt** hashing for all stored passwords.
2. Mandatory `JWT_SECRET` via environment variables (fail-fast).
3. Implemented a **Refresh Token** flow (`/api/auth/refresh`) with a 5-minute background polling in the Angular host.

**Rationale:**
- Compliance with industry security standards.
- Prevents session hijacking and provides a seamless user experience without frequent logins.

**Status:** Accepted

---

## [2026-05-04] Distributed AI Skill Architecture

**Context:** As the project grew, a single monolithic `GEMINI.md` or a centralized security skill became difficult to manage for the AI agent.

**Decision:** Adopted a **distributed documentation strategy**. Technical rules for specific layers are stored in their respective skills (`angular-modern-architecture.md`, `backend-microservices.md`), while business/inter-layer logic is stored in new specialized skills.

**Rationale:**
- Better context injection for the AI agent (only loads what's needed).
- Easier to maintain and update individual layers without side effects on others.

**Status:** Accepted

---

## [2026-05-05] Hybrid Testing Strategy (Jest + Vitest)

**Context:** The host and backend use Jest (standard for Angular), but Vite-based remotes are significantly faster and more natively supported by Vitest.

**Decision:** Implemented **Jest** for Angular and Node.js services, and **Vitest** for the React remote.

**Rationale:**
- Performance: Vitest is significantly faster in Vite environments.
- Developer Experience: Native integration with Vite config.

**Status:** Accepted
