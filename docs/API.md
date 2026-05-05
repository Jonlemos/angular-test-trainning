# Documentação da API - Itaú PJ Dashboard

## Visão Geral
Este projeto segue o padrão **Spec-Driven Development (SDD)**. A fonte única de verdade para todos os contratos de API é o arquivo OpenAPI localizado em:

👉 `docs/specs/openapi.yaml`

---

## Microserviços e Endpoints

### 1. Auth Service (Port 3001)
Gerencia o ciclo de vida da sessão e segurança.

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autenticação inicial (CPF/CNPJ + Senha) |
| POST | `/api/auth/mfa/verify` | Validação de código MFA |
| POST | `/api/auth/refresh` | Renovação de token JWT |
| POST | `/api/auth/validate` | Verificação de integridade do token |

### 2. Charge Service (Port 3002)
Gestão financeira e cobranças PJ.

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/charges` | Lista cobranças do usuário |
| POST | `/api/charges` | Emissão de nova cobrança |

---

## Padrões de Resposta

### Sucesso
Todas as respostas de sucesso seguem o padrão JSON definido no schema OpenAPI.

### Erros
Erros seguem uma estrutura padronizada para facilitar o tratamento no frontend:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Technical description",
    "user_message": "Mensagem amigável para o cliente"
  }
}
```

---

## Como testar localmente
1. Certifique-se de que o **Mock DB** esteja rodando (`npm run dev:backend`).
2. Utilize o Swagger UI ou import o `openapi.yaml` no **Postman/Insomnia**.
