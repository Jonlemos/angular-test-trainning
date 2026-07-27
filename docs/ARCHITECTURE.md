# Arquitetura do Sistema - Banco PJ Dashboard

## Visão Geral
O projeto segue uma arquitetura de **Micro-frontends (MFE)** com um **Backend de Microserviços**. O objetivo é permitir que times diferentes trabalhem em partes distintas do dashboard com independência tecnológica e ciclos de deploy separados.

---

## Componentes da Arquitetura

### 1. Frontend Shell (Host)
- **Tecnologia:** Angular 18+ (Standalone Components, Signals).
- **Responsabilidade:** Atua como o orquestrador principal, gerenciando o layout (Sidebar, Navbar), a autenticação centralizada e o roteamento entre os diferentes MFEs.
- **Integração:** Utiliza **Webpack Module Federation** para carregar remotos em tempo de execução.

### 2. Micro-frontends (Remotes)
- **Login MFE:** React 19 + Vite 6.
- **Responsabilidade:** Fluxo de autenticação, MFA e recuperação de senha.
- **Padrão de Exposição:** Expõe uma função `mount` agnóstica de framework para garantir que o Host Angular possa renderizá-lo sem conflitos de dependências.

### 3. Backend Microservices
- **Auth Service:** Node.js + Express. Gerencia JWT, Refresh Tokens e Bcrypt.
- **Charge Service:** Node.js + Express. Gestão de cobranças e faturamento.
- **Renegotiation Service:** Node.js + Express. Motor de propostas de renegociação.
- **DB Mock:** JSON Server atuando como base de dados compartilhada para desenvolvimento.

---

## Fluxo de Dados e Comunicação

### Autenticação
1. O usuário faz login no **Login MFE** (React).
2. O **Auth Service** valida e retorna um par de tokens (Access + Refresh).
3. O **Host Angular** intercepta o sucesso, armazena os tokens no `LocalStorage` e inicia o polling de refresh automático.
4. Outros MFEs consomem o token do `LocalStorage` ou via Props passadas pelo Host.

### Comunicação Inter-MFE
- **Sincronização via Storage:** Uso de `storage events` para reagir a mudanças de sessão em diferentes camadas.
- **Custom Events:** Disparo de eventos nativos do browser (`banco-pj:*`) para ações globais.

---

## Infraestrutura (Target)
- **Deploy:** AWS (S3 para estáticos, Lambda/ECS para backend).
- **CDN:** CloudFront para entrega global e cache.
- **API Gateway:** Ponto único de entrada para os microserviços.
