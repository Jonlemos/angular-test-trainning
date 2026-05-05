# Module Federation Setup - Angular (Webpack) + React (Vite) Integration

## Overview
This skill covers the implementation of Module Federation between an **Angular 18 Host (Webpack-based)** and a **React 19 Remote (Vite-based)**. This hybrid setup is common when migrating or integrating modern Vite MFEs into existing Angular Webpack ecosystems.

> [!IMPORTANT]
> **Validated Stack:** 
> - **Host:** Angular 18 + `@angular-architects/module-federation` (ngx-build-plus)
> - **Remote:** React 19 + `@module-federation/vite@^1.1.0`
> - **Boundary Pattern:** Framework-agnostic `mount` function.

## Architecture Overview
┌─────────────────────────────────────────────┐
│ Angular 18 Host (Webpack)                   │
│ - Uses loadRemoteModule                     │
│ - Handles Shell & Routing                   │
└──────────────┬──────────────────────────────┘
               │
               │ Dynamic Import (type: module)
               │
               ▼
┌──────────────────────────────────────────────┐
│ React 19 + Vite 6 Remote                     │
│ - Exposes ./Login via @module-federation/vite│
│ - Bundles styles into assets/style.css       │
└──────────────────────────────────────────────┘

## Angular Host Configuration (Webpack)

### 1. Load Remote Dynamically
Never define Vite remotes in `webpack.config.js`. Vite produces ES Modules which Webpack's static loader cannot parse at build time. Use dynamic loading.

```typescript
// apps/angular-host/src/app/react-wrapper/react-wrapper.component.ts
import { loadRemoteModule } from '@angular-architects/module-federation';

async ngAfterViewInit() {
  try {
    const remoteModule = await loadRemoteModule({
      type: 'module', // CRITICAL: Vite remotes are ESM
      remoteEntry: 'http://localhost:4201/remoteEntry.js',
      exposedModule: './Login'
    });

    // 🎨 Manual CSS Injection (Vite MF injection often fails in Webpack)
    if (!document.getElementById('remote-style')) {
      const link = document.createElement('link');
      link.id = 'remote-style';
      link.rel = 'stylesheet';
      link.href = 'http://localhost:4201/assets/style.css';
      document.head.appendChild(link);
    }

    // Call the agnostic mount function
    remoteModule.mount(this.container.nativeElement, {
      router: this.router,
      // props...
    });
  } catch (err) {
    console.error('Remote load failed', err);
  }
}
```

## React Remote Configuration (Vite)

### 1. Configure `vite.config.ts`
Use the official `@module-federation/vite` plugin.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  base: 'http://localhost:4201/', // Ensure assets point to remote port
  plugins: [
    react(),
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
    cssCodeSplit: false, // Bundle CSS together
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[ext]', // Predictable names (no hash)
      },
    },
  },
});
```

### 2. Implement the `mount` pattern
Avoid exporting React components directly to prevent React version/instance conflicts between Host and Remote.

```typescript
// apps/react-login-remote/src/components/Login.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';

export const mount = (el: HTMLElement, props: any) => {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>
  );
  return () => root.unmount(); // Return cleanup fn
};
```

## Critical Rules & Pitfalls

### 1. The "import.meta" Error in Angular
If you see `Uncaught SyntaxError: import.meta may only appear in a module` in Angular's `styles.js`:
- This is a harmless dev-server bug in Angular 18 + HMR + Webpack.
- It does NOT affect the functionality of the micro-frontend.
- In production, Webpack handles this correctly.

### 2. React Shared Internals (H is null)
If you get `ReactSharedInternals.H is null`:
- This means two different versions of React are fighting.
- **Fix:** Ensure the remote is loaded as `type: 'module'` and uses the `mount` pattern so the remote manages its own React lifecycle.

### 3. CSS Not Loading
- **Vite Hash Problem:** Vite adds hashes to filenames by default.
- **Fix:** Use `assetFileNames: 'assets/[name].[ext]'` in Vite and manually inject `<link href=".../style.css">` in the Host.

### 4. CORS Issues
Vite's dev server needs to allow requests from the Host.
```typescript
server: {
  cors: true,
  port: 4201,
}
```

## Development Workflow
1. **Build Remote:** `npm run build` in `apps/react-login-remote` (or run in dev mode).
2. **Start Host:** `npm start` in `apps/angular-host`.
3. **Verify Port:** Remote must be on 4201, Host on 4200.

---
*Updated: May 5, 2026 — Optimized for Angular Webpack + Vite ESM integration.*