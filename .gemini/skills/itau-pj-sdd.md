# Itaú PJ - Spec-Driven Development (SDD) Governance

## 🎯 Objetivo
Este skill impõe o fluxo de **Spec-Driven Development** no projeto, garantindo que toda implementação seja validada contra as especificações em `docs/specs/`.

---

## 🚦 Regras de Ouro (MANDATÓRIAS)

1.  **Consulte a Spec Primeiro:** Antes de qualquer alteração (`MODIFY`) em APIs ou fluxos de negócio, você DEVE ler `docs/specs/openapi.yaml` ou o arquivo `.feature.md` correspondente.
2.  **Zero Desvio de Contrato:** Se o código não condiz com a spec, a tarefa é considerada FALHA.
3.  **Spec First, Code Second:** Se uma nova funcionalidade for solicitada e não houver spec, você DEVE propor a criação da spec antes de escrever o código.
4.  **Sincronização:** Mudanças no Backend que alteram a API devem ser refletidas imediatamente no `openapi.yaml`.

---

## 🛠️ Procedimento de Validação

Sempre que trabalhar em uma tarefa, siga este checklist mental:

1.  **Identificação:** Qual endpoint ou fluxo estou alterando?
2.  **Verificação:** O arquivo `docs/specs/openapi.yaml` define este endpoint? Quais são os tipos de Request/Response?
3.  **Implementação:** O código utiliza os nomes de campos e tipos exatos da spec?
4.  **Testes:** Os testes unitários verificam os cenários descritos nas specs comportamentais (`.feature.md`)?

---

## 📂 Estrutura de Documentação
- `docs/specs/openapi.yaml`: Contratos de rede (Single Source of Truth).
- `docs/specs/*.feature.md`: Regras de negócio, UX e métricas de Growth.

---

## ⚠️ Bloqueio de Implementação
Se o USER pedir uma mudança que quebre o contrato definido na spec:
1.  **PARE.**
2.  Alerte sobre o breaking change.
3.  Sugira o update da spec antes de prosseguir.
