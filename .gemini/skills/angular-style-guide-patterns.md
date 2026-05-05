# Angular Style Guide & Design Patterns

## Overview
This skill ensures strict adherence to the official Angular Style Guide (v18+) and the application of robust design patterns for scalable frontend architecture.

## 🏛️ Component Architecture (Style 05)

### 1. Separation of Concerns (SFC)
**Rule:** Separate template and styles into their own files for any component larger than 15 lines of HTML.
- `[name].component.ts`: Logic and metadata.
- `[name].component.html`: Structure.
- `[name].component.scss`: Presentation.

### 2. Standalone & OnPush (Standard)
**Rule:** Use `standalone: true` and `ChangeDetectionStrategy.OnPush` for all new components.
- Rely on **Signals** to trigger change detection.

### 3. Logic-Less Templates
**Rule:** Keep templates clean. Move complex logic to component properties or `computed()` signals.

---

## 🛠️ Design Patterns in Angular

### 1. Smart vs. Dumb Components (Container Pattern)
- **Smart (Containers):** Handle data fetching, services, and state (e.g., `DashboardComponent`).
- **Dumb (Presentational):** Receive data via `input()` and emit events via `output()`. They are reusable and pure.

### 2. Service-as-a-Store Pattern
**Rule:** Use services with Signals to manage shared state instead of complex state management libraries when possible.
```typescript
@Injectable({ providedIn: 'root' })
export class DataStore {
  private state = signal<Data[]>([]);
  public readonly data = this.state.asReadonly();
  // ... methods to update state
}
```

### 3. Adapter/Wrapper Pattern (MFE Integration)
**Rule:** When integrating external frameworks (like React), use a dedicated Wrapper Component to isolate the external logic and bridge the frameworks via clean interfaces (Props/Callbacks).

---

## 🚦 Naming & Folders (Style 02)

- **Feature Modules:** Group files by feature (`/features/auth`, `/features/dashboard`).
- **File Suffixes:** Always use descriptive suffixes: `.component.ts`, `.service.ts`, `.guard.ts`, `.interceptor.ts`.
- **Selectors:** Use `app-` prefix (or project-specific) in kebab-case.

---

## 🔒 Security Best Practices

1. **DomSanitizer:** Avoid `innerHTML` unless absolutely necessary. Use Angular's property binding `[property]` which sanitizes by default.
2. **Auth Interceptors:** Centralize token management in functional interceptors.

---

## ⚡ Performance Checklist

- [ ] Use `track` in `@for` loops.
- [ ] Use `@defer` for heavy components.
- [ ] Avoid function calls in templates (use `computed` signals).
- [ ] Unsubscribe from observables (or use `toSignal`).
