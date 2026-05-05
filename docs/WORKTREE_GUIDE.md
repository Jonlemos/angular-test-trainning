# Guia de Git Worktree - Fluxo de Desenvolvimento

## O que são Worktrees?
Ao invés de alternar entre branches no mesmo diretório (`git checkout`), utilizamos **Worktrees** para manter múltiplas branches abertas em diretórios físicos separados dentro da pasta `worktrees/`.

---

## Por que usamos este fluxo?
1.  **Isolamento Total:** Você pode rodar o backend em uma branch e o frontend em outra simultaneamente.
2.  **Zero Conflitos de `node_modules`:** Cada worktree tem seu próprio estado, evitando o custo de reinstalação ao trocar de contexto.
3.  **Code Review Ágil:** Você pode abrir o código de um colega em um diretório separado sem fechar o seu trabalho atual.

---

## Comandos Automatizados

### 1. Criar uma nova feature
```bash
npm run worktree:create feature/nome-da-feature
```
Este comando:
- Cria a branch no Git.
- Cria a pasta em `worktrees/feature-nome-da-feature`.
- Cria links simbólicos (**symlinks**) para os arquivos `.env` e configurações globais.

### 2. Listar worktrees ativos
```bash
npm run worktree:list
```

### 3. Remover uma feature concluída
```bash
npm run worktree:remove feature/nome-da-feature
```

---

## Boas Práticas
- **Não commite dentro da pasta `worktrees/` do repositório principal.** O diretório `worktrees/` está no `.gitignore`.
- **Sempre utilize os scripts fornecidos.** Eles garantem que os symlinks de ambiente sejam criados corretamente para que os apps funcionem imediatamente.
