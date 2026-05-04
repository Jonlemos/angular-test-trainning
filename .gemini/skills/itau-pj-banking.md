# Itaú PJ Banking Domain Knowledge

## Overview
This skill provides context about Itaú's PJ (Pessoa Jurídica - Legal Entity) banking services and business requirements for building growth-focused financial dashboards.

## Business Context

### Target Audience
- **Micro MEI (Microempreendedor Individual):** Revenue up to R$ 81k/year
- **Small Business:** Revenue R$ 81k - R$ 4.8M/year
- **Medium Enterprise:** Revenue R$ 4.8M - R$ 300M/year
- **Large Corporation:** Revenue > R$ 300M/year

### Core PJ Services
1. **Current Account (Conta Corrente PJ)**
   - Balance checking
   - Statement generation
   - Transaction history
   - Multi-user access with permissions

2. **Payments & Transfers**
   - Boletos (Brazilian payment slips)
   - TED/DOC transfers
   - PIX payments
   - Payroll processing
   - Supplier payments

3. **Receivables Management**
   - Invoice tracking
   - Payment anticipation
   - Credit card receivables
   - Collections management

4. **Credit Products**
   - Working capital loans
   - Credit cards
   - Overdraft facilities
   - Asset financing

5. **Investments**
   - CDB (Certificates of Deposit)
   - Treasury bonds
   - Investment funds
   - Cash management

## Growth Metrics (Critical for this Role)

### Primary KPIs
- **Conversion Rate:** New account openings → active usage
- **Engagement:** Daily/weekly active users
- **Adoption Rate:** Feature usage per customer segment
- **Revenue per User:** Cross-sell success
- **Retention:** 90-day retention rate
- **NPS:** Net Promoter Score

### User Journey Optimization Points
1. **Onboarding:** Reduce time-to-first-transaction
2. **Discovery:** Increase feature awareness
3. **Activation:** Drive first meaningful action
4. **Retention:** Build habit formation
5. **Referral:** Enable viral growth

## UX Principles for Banking

### Security-First Design
- Multi-factor authentication (MFA)
- Session timeout warnings
- Sensitive data masking
- Audit trail visibility
- Clear permission hierarchies

### Accessibility Requirements
- WCAG 2.1 AA compliance minimum
- Screen reader optimization
- Keyboard navigation
- High contrast mode
- Font size controls

### Performance Expectations
- **Critical path loading:** < 2s
- **API response time:** < 500ms (p95)
- **Offline capability:** Show cached data with sync status
- **Error recovery:** Clear paths to resolution

## Regulatory Compliance (Brazil)

### LGPD (Lei Geral de Proteção de Dados)
- Explicit consent for data usage
- Right to data portability
- Right to deletion
- Data breach notification

### BACEN (Banco Central do Brasil) Requirements
- Transaction logging (5 years minimum)
- Anti-fraud measures
- KYC (Know Your Customer) validation
- AML (Anti-Money Laundering) checks

### PCI-DSS (Payment Card Industry)
- Never store CVV
- Encrypt card numbers
- Tokenize sensitive data
- Regular security audits

## Common User Flows

### 1. Dashboard Home
User lands → See balance + quick actions → Access recent transactions → Navigate to detailed views

### 2. Payment Creation
Select payment type → Enter recipient details → Set amount + date → Review → Authenticate (2FA) → Confirm → Receipt

### 3. Statement Generation
Select date range → Choose format (PDF/Excel) → Apply filters → Generate → Download/Email

### 4. Credit Application
Pre-qualification check → Document upload → Credit analysis → Approval → Contract signing (digital) → Funds release

### 5. User Permission Management
Assign user roles → Set transaction limits → Approve access requests → Monitor activity → Revoke access

## Performance Targets

| Metric | Target |
|--------|--------|
| **FCP** | < 1.8s |
| **LCP** | < 2.5s |
| **CLS** | < 0.1 |
| **API p95** | < 500ms |
| **Bundle Size** | < 200KB |
| **TTC (Time to Conversion)** | < 10 minutes |

## Design System Tokens

### Colors
- **Primary:** Itaú Red (#D30F24)
- **Secondary:** Itaú Blue (#0047AB)
- **Neutral:** Gray scale (0-900)
- **Status:** Green (success), Yellow (warning), Red (error)

### Typography
- **Font Family:** Inter, Roboto
- **Base Size:** 14px
- **Line Height:** 1.5

### Spacing
- Base unit: 8px
- Grid system: 4px increments
- Consistent spacing tokens throughout

## API Contract Template

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
}

interface Transaction {
  id: string;
  date: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: string;
  balance_after: number;
}
```

## Design Patterns

### Dashboard Components
- **Balance Card:** Prominent, with hide/show toggle
- **Quick Actions:** Max 6 most-used features
- **Transaction List:** Infinite scroll, filterable
- **Alerts:** Non-intrusive, actionable
- **Charts:** Revenue/expense trends, category breakdowns

### Form Design
- Progressive disclosure (multi-step for complex flows)
- Inline validation with helpful error messages
- Auto-save drafts
- Clear CTAs with loading states
- Confirmation modals for destructive actions

### Mobile Considerations
- Touch-friendly targets (min 44px)
- Swipe gestures for quick actions
- Biometric authentication support
- Reduced data usage (lazy loading)
- Offline queue for actions

## API Integration Standards

### Authentication
```typescript
// JWT-based auth with refresh tokens
Authorization: Bearer <access_token>
X-Request-ID: <unique-request-id>
X-Client-Version: <app-version>
```

### Error Handling
```typescript
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Saldo insuficiente para realizar a operação",
    "user_message": "Você não tem saldo suficiente. Saldo atual: R$ 1.234,56",
    "suggestion": "Considere fazer uma transferência ou usar o limite do cheque especial",
    "docs_url": "https://docs.itau.com.br/errors/INSUFFICIENT_FUNDS"
  }
}
```

### Request Validation
- Use Zod schemas for type-safe validation
- Sanitize inputs to prevent injection
- Rate limiting per user/IP
- Request size limits

## Testing Requirements

### Unit Tests
- Business logic in services
- Form validation rules
- Utility functions
- State management

### Integration Tests
- API contract tests
- Authentication flows
- Payment processing
- Statement generation

### E2E Tests (Critical Paths)
- Login → Dashboard view
- Create payment → Confirm
- Generate statement
- Transfer funds

### Accessibility Tests
- Automated: axe-core
- Manual: Screen reader navigation
- Keyboard-only interaction
- Color contrast validation

## Performance Budgets

### Bundle Sizes
- Initial load: < 200KB (gzipped)
- Route chunks: < 100KB each
- Images: WebP with fallbacks
- Fonts: Variable fonts, subset

### Loading Strategy
- Critical CSS inline
- Defer non-critical scripts
- Lazy load below-fold content
- Preload critical assets

## Localization

### Brazilian Portuguese Standards
- Currency: R$ 1.234,56 (period for thousands, comma for decimals)
- Date: DD/MM/YYYY
- Time: 24-hour format
- Phone: +55 (11) 98765-4321

### Tone of Voice
- **Professional but friendly**
- Avoid banking jargon
- Use active voice
- Be concise and clear
- Empathetic error messages

## Deployment Strategy

### Environment Progression
1. **Dev:** Feature branches (auto-deploy)
2. **QA:** Integration testing
3. **Staging:** UAT + performance testing
4. **Production:** Blue/green deployment

### Rollout Strategy
- Feature flags for gradual rollout
- A/B testing for UX changes
- Rollback capability within 5 minutes
- Monitor error rates post-deploy

## Resources

- [Itaú Design System](https://design.itau.com.br)
- [BACEN Regulations](https://www.bcb.gov.br)
- [LGPD Compliance](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [PCI-DSS Standards](https://www.pcisecuritystandards.org)

---

*Use this knowledge when implementing PJ banking features to ensure compliance, security, and optimal user experience.*