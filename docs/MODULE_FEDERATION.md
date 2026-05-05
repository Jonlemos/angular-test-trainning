# Guia de Module Federation - Itaú PJ

## Visão Híbrida
Este projeto utiliza uma das configurações mais avançadas de Module Federation: **Webpack (Host) integrando com Vite (Remote)**.

---

## Configuração do Host (Angular)

O Host utiliza `@angular-architects/module-federation` com Webpack.

### Pontos Chave:
- **`webpack.config.js`:** Define os compartilhamentos (`shared`) para evitar duplicidade de bibliotecas base como `rxjs` ou `zone.js`.
- **`public/federation.manifest.json`:** Contém o mapeamento dinâmico dos remotos.
  ```json
  {
    "login": "http://localhost:4201/assets/remoteEntry.js"
  }
  ```

---

## Configuração do Remote (React + Vite)

O Remote utiliza `@module-federation/vite`.

### Regras Críticas para Sucesso:
1.  **Formato de Saída:** O Remote deve gerar um container compatível com o padrão Webpack.
2.  **Base URL:** O `base` no `vite.config.ts` deve apontar para a URL absoluta do remote (`http://localhost:4201/`) para garantir que assets como CSS e imagens carreguem corretamente.
3.  **Exposição:** Não expomos o componente React diretamente. Expomos uma função `mount`:
    ```typescript
    export const mount = (el: HTMLElement, props: any) => {
      const root = createRoot(el);
      root.render(<App {...props} />);
    };
    ```

---

## Estratégia de Compartilhamento (Shared)

Para manter a estabilidade, fixamos versões críticas:
- **zone.js:** Sempre compartilhada e única (singleton).
- **rxjs:** Compartilhada para garantir que eventos do host cheguem aos remotes.
- **React/ReactDOM:** **NÃO** são compartilhados entre Angular e React para evitar conflitos de versões e garantir isolamento total.

---

## Resolução de Problemas Comuns

### 1. "OriginalFactory is undefined"
Geralmente ocorre quando há mismatch de versões de `module-federation` ou quando o remote não exportou corretamente o entry point.

### 2. Assets (Imagens/CSS) não carregam
Verifique se a `base` no Vite está configurada com a URL completa (incluindo porta) e se o `assetFileNames` está fixo (sem hash) no build.
