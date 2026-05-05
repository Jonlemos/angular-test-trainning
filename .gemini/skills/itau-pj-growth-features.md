# Itaú PJ Dashboard - Growth Features & Domain Standards

## 🎯 Domain Overview
Focus on high-conversion, scalable banking features for PJ users (Small to Large Enterprises).

---

## 📂 Feature Structure (Angular)

All new features MUST follow this folder structure inside `apps/angular-host/src/app/features/`:

```
features/{domain-name}/
├── {domain-name}.component.ts     # Parent standalone component
├── {domain-name}.component.html
├── {domain-name}.component.scss
├── {domain-name}.routes.ts        # Child routes if needed
└── components/                    # Domain-specific sub-components
```

---

## 📈 Growth & Analytics Framework

Every feature must track success metrics using a unified event structure:

### Standard Event Schema
- `feature`: The domain name (e.g., 'charges').
- `action`: The user interaction (e.g., 'click', 'submit', 'view').
- `label`: Contextual description (e.g., 'confirm_renegotiation').
- `value`: (Optional) Numeric value associated with the event.

### Implementation Pattern
Use a centralized `AnalyticsService` in the Angular `core` layer to dispatch these events.

---

## ✨ UX Best Practices for Growth
- **Empty States:** Never leave a screen blank. Provide actionable CTA (Call to Action) buttons.
- **Feedback Loops:** Use `MatSnackBar` or `MatDialog` for immediate success/error feedback after transactions.
- **Progressive Disclosure:** Hide complex options until the user explicitly needs them to reduce cognitive load.

---

## 🔒 Feature Flags
New growth features should be wrapped in feature toggles (config-driven) to allow for A/B testing or canary releases.
