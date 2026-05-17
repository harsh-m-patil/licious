# licious

Task Management Dashboard monorepo (Next.js + Turborepo + shadcn/ui).

Deployed link -> [tasks](https://tasks.harshmpatil.xyz/)

## Run the app

### Install

```bash
pnpm install
```

### Start development

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Build

```bash
pnpm build
```

### Preview production build

```bash
pnpm --filter web start
```

## Test

Run web unit/integration tests locally:

```bash
pnpm --filter web test -- --run
```

Run the repository test image (Docker):

```bash
pnpm test
```

## Dashboard shell architecture

Issue #2 currently implements the dashboard **shell foundation** (not full CRUD).

- UI shell: `apps/web/app/page.tsx`
- Task contracts: `apps/web/lib/tasks/types.ts`
- Task state boundary: `apps/web/lib/tasks/state.ts`
- Task derived helpers: `apps/web/lib/tasks/utils.ts`
- Architecture notes: `docs/dashboard-shell-architecture.md`

## Adding UI components

To add shadcn components for the web app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```
