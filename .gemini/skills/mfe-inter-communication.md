# Itaú PJ Dashboard - MFE Inter-communication

## 🎯 Architecture Goal
Ensure seamless and secure data/state exchange between the Angular Host and React Remote micro-frontends.

---

## 🔄 Session & Auth Synchronization

The system uses a **Single Source of Truth** for authentication stored in `LocalStorage`.

### Synchronization Mechanism:
1. **Host to Remote:** The `AuthService` (Angular) updates `LocalStorage`. The React `authStore` initializes from these values.
2. **Cross-Tab/MFE Sync:** Both layers listen for `storage` events. When a token is refreshed or cleared in one layer, the other reacts instantly.

---

## 📡 Data Exchange Patterns

### 1. Host -> Remote (Props-driven)
The Angular wrapper passes initial data and configuration via the `mount` function:
```typescript
// Angular Wrapper
mount(element, { 
  theme: 'itau-dark', 
  onSuccess: (data) => this.handleSuccess(data) 
});
```

### 2. Remote -> Host (Event-driven)
For actions that require Host-level side effects (like full page navigation), the Remote should dispatch a `CustomEvent` or call a provided callback.

---

## 🛠️ Lifecycle Management

The Angular wrapper MUST properly clean up the React component to prevent memory leaks:
```typescript
// Angular ngOnDestroy
const container = document.getElementById('react-root');
if (container) {
  const root = (container as any)._reactRoot; // Or use an explicit unmount export
  root?.unmount();
}
```

---

## ⚠️ Critical Rules
- **Never** share deep state objects (like large RxJS Observables) between frameworks; keep the bridge simple with primitive types or plain JSON objects.
- **Always** prefix inter-MFE custom events with `itau-pj:` to avoid collisions.
