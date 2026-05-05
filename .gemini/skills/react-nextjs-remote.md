# React 19 + Vite 6 Remote (Login Micro-frontend)

## Overview

This skill covers building the React login micro-frontend using **React 19**, **Vite 6**, **TanStack Query**, **Zustand**, and **Tailwind CSS v3** with `@module-federation/vite@^1.15.2`.

> [!IMPORTANT]
> **Vite is the preferred bundler for new remotes.** It provides significantly faster builds and a simpler configuration than Webpack/Next.js for standalone components.

## Architecture & Integration

### 1. The Agnostic `mount` Pattern

Never export raw React components to an Angular host. This prevents React instance conflicts and version mismatches.

```typescript
// apps/react-login-remote/src/components/Login.tsx
import { createRoot } from 'react-dom/client';
import App from '../App';

export const mount = (el: HTMLElement, props: any) => {
  const root = createRoot(el);
  root.render(<App {...props} />);
  return () => root.unmount();
};
```

### 2. Vite Configuration

Use the `@module-federation/vite` plugin for generating Webpack-compatible containers.

```typescript
// vite.config.ts
import { federation } from '@module-federation/vite';

export default defineConfig({
  base: 'http://localhost:4201/',
  plugins: [
    federation({
      name: 'reactLogin',
      filename: 'remoteEntry.js',
      exposes: {
        './Login': './src/components/Login.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]', // Disable hashes for CSS
      },
    },
  },
});
```

## Critical Build Rules

| Rule                             | Rationale                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `base: 'http://localhost:4201/'` | Ensures that images and CSS are requested from the remote server, not the host. |
| `cssCodeSplit: false`            | Bundles all styles into one file for reliable manual injection by the host.     |
| `target: 'esnext'`               | Required for Module Federation's modern ESM runtime features.                   |
| Port 4201                        | The standard port for the React Login remote.                                   |

## Host Integration (Angular)

In the Angular host, use `loadRemoteModule` with `type: 'module'` and manually inject the CSS:

```typescript
const remote = await loadRemoteModule({
  type: 'module',
  remoteEntry: 'http://localhost:4201/remoteEntry.js',
  exposedModule: './Login',
});

// Explicit CSS loading
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'http://localhost:4201/assets/style.css';
document.head.appendChild(link);

remote.mount(element, props);
```

## Troubleshooting

### `SyntaxError: import.meta`

If this appears in Angular's `styles.js`, it is a dev-only bug and can be ignored. It does not affect the React remote.

### Styling Not Applying

- Check if `http://localhost:4201/assets/style.css` is reachable.
- Verify that `base` is correctly set in `vite.config.ts`.
- Ensure the host is manually injecting the link tag.

---

_Last updated: May 5, 2026 — Optimized for Vite 6 + React 19._
