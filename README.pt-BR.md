[English](README.en-US.md) · **Português**

# FIAP Games — Frontend

React + Vite + TypeScript. Fala com todo backend através de uma única URL base relativa (`/api/*`) — o Ingress roteia por caminho, então este app nunca precisa de uma porta ou host específico por serviço. Ver [`instructions.md`](https://github.com/tc2-fiap/documentation/blob/main/spec/instructions.md) §7 no repositório `documentation` ([github.com/tc2-fiap/documentation](https://github.com/tc2-fiap/documentation), ou `../documentation/spec/instructions.md` se você o tiver clonado como irmão).

## Rodar de forma independente

Ciclo mais rápido, precisa de um backend acessível em `localhost:80` (por exemplo, o ingress do cluster kind):

```bash
npm install
npm run dev
```

O `vite.config.ts` faz proxy de `/api/*` para `http://localhost:80` em dev.

Ou, para comprovar que o container construído serve corretamente sozinho (sem o proxy de desenvolvimento):

```bash
docker compose up --build
```

## Rodar como parte do sistema

Implantado pelo chart Helm [`orchestration`](https://github.com/tc2-fiap/orchestration) junto com os cinco serviços de backend — ver `repos/orchestration`.

## O que tem aqui

- `src/api/` — cliente fetch, chamadas de endpoint tipadas, DTOs de resposta compatíveis com o formato dos backends.
- `src/auth/` — armazenamento de JWT + um decodificador de JWT no lado do cliente, usado apenas para controlar a exibição da UI (por exemplo, mostrar o link de navegação de admin); a decisão real de autorização sempre acontece no servidor.
- `src/i18n/` — `LocaleContext`/`useLocale()` (espelha o formato do `AuthContext`) controlando a alternância de idioma EN/PT no cabeçalho, além dos dicionários de tradução `en`/`pt` e o `locale-currency.ts` (`en → USD`, `pt → BRL`). Persistido em `localStorage`; o padrão é inglês.
- `src/utils/currency.ts` — `formatPrice(value, currency)` (BRL via `pt-BR`/`Intl.NumberFormat`, USD via `en-US`, com padrão BRL) e `brlToUsd()`. Todo preço no backend continua sendo um número em BRL — o `src/hooks/useQuotation.ts` busca a cotação ao vivo do [`catalog-api`](https://github.com/tc2-fiap/catalog-api) uma vez por carregamento de página, e o catálogo converte para exibição só quando a alternância está em inglês, voltando ao BRL nativo se a cotação estiver indisponível.
- `src/pages/` — cadastro/login (incluindo um botão de login com Google renderizado condicionalmente — ver `GET /api/users/config`), catálogo (com capas de jogos, voltando a um bloco com a inicial quando um jogo não tem uma), a página de checkout/status do pedido (item de linha do produto, preço em duas moedas, QR code PIX quando um gateway real está ativo, consulta enquanto `Pending`), biblioteca, e três visões de admin: todos os pedidos, trilha de auditoria entre serviços por pedido, e `AdminEventsPage.tsx` em `/admin/events` — todo evento/mensagem entre os serviços, filtrável por origem/tipo/categoria/data, composta a partir de quatro endpoints de admin via `Promise.allSettled` da mesma forma que a página por pedido (`../documentation/spec/notes.md` 43).
- `src/utils/formatJson.ts` — o helper de formatação/fallback de JSON compartilhado pelas páginas de admin por pedido e de todo o sistema.
- Os ativos de marca (`theme.css`, `Logo.tsx`, `public/favicon.svg`) vêm literalmente do próprio `design/` deste repositório — ver `design/style-guide.md` e `../documentation/spec/notes.md` 31.

## Build

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```
