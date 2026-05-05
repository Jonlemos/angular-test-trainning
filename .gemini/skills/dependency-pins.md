# Dependency Pins — React Login Remote (Vite)

## Overview

This skill documents the **exact dependency versions** required for the `react-login-remote` micro-frontend (Vite-based) to integrate seamlessly with the Angular Webpack host.

---

## Pinned Versions Table

| Package | Required Version | Location | Rationale |
|---|---|---|---|
| `@module-federation/vite` | `^1.15.2` | `devDependencies` | Official plugin required for correct ESM remote generation. |
| `vite` | `^8.0.10` | `devDependencies` | Build engine compatible with the Federation plugin. |
| `react` | `^19.x` | `dependencies` | Must be singleton shared with other React remotes if applicable. |
| `tailwindcss` | `^3.x` | `devDependencies` | Current project uses Tailwind v3 for the remote. |

---

## `package.json` Reference (Validated)

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite build --watch --mode development",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4201"
  },
  "dependencies": {
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "@tanstack/react-query": "^5.100.9"
  },
  "devDependencies": {
    "@module-federation/vite": "^1.15.2",
    "vite": "^8.0.10",
    "typescript": "~6.0.2"
  }
}
```

---

## Critical Configurations

### 1. `build.target: 'esnext'`
In `vite.config.ts`, `build.target` must be set to `esnext` to ensure top-level await and other modern ESM features required by Module Federation are preserved.

### 2. `cssCodeSplit: false`
Must be `false` to ensure all component styles are bundled into a single `style.css` for easy manual injection by the Angular host.

### 3. `assetFileNames`
To prevent broken links in the Angular host, hashes are disabled for CSS:
```typescript
rollupOptions: {
  output: {
    assetFileNames: 'assets/[name].[ext]',
  },
}
```

---
*Last updated: May 5, 2026 — Migration from Next.js to Vite MF completed.*
