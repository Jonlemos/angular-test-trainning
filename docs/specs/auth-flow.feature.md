# Spec: Authentication Flow (Growth Optimized)

## 🎯 Objetivo
Garantir que o fluxo de autenticação seja seguro, amigável e otimizado para conversão de usuários PJ.

---

## 🚦 Cenário 1: Login com Sucesso (MFA Requerido)

**Contexto:** O usuário possui uma conta PJ ativa com MFA habilitado.

1.  **Ação:** O usuário insere CPF/CNPJ e senha válidos no micro-frontend de Login.
2.  **Validação:** O sistema deve validar o formato do documento (masking) e a força da senha no frontend.
3.  **Resposta da API:** O backend retorna `requiresMFA: true` e um `sessionToken` temporário (5 min).
4.  **UI:** O frontend deve transicionar suavemente para a tela de inserção de código MFA sem recarregar a página.

---

## 🚦 Cenário 2: Sessão Expirada (Background Refresh)

**Contexto:** O usuário está navegando no Dashboard (Angular Host) e o token JWT está prestes a expirar.

1.  **Ação:** O `TokenRefreshService` dispara um polling em background.
2.  **Requisito:** O refresh deve ocorrer de forma silenciosa, sem interromper a interação do usuário.
3.  **Sincronização:** O novo token deve ser atualizado no `LocalStorage` e disparar um evento para sincronizar o micro-frontend React.
4.  **Falha:** Caso o refresh falhe (ex: conta bloqueada), o usuário deve ser redirecionado para `/login` com uma mensagem clara.

---

## 📈 Métricas de Growth (Analytics)

Todos os passos da autenticação devem disparar eventos:
- `login_attempt`: Ao clicar em entrar.
- `mfa_view`: Ao abrir a tela de MFA.
- `login_success`: Ao concluir o fluxo com sucesso.
- `login_error`: Com o código do erro (ex: `INVALID_CREDENTIALS`).

---

## 🎨 Requisitos de UI/UX
- **Loading State:** Botões devem mostrar um spinner durante a requisição.
- **Error Feedback:** Erros devem ser exibidos via `MatSnackBar` (Host) ou Toasts (Remote) com a `user_message` retornada pela API.
