# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## NixOS / Playwright setup

If you're on NixOS, use the provided dev shell so Playwright works without manually installing Ubuntu libraries:

```bash
nix develop
pnpm install
pnpm --filter web test
```

The shell uses `playwright-driver` and sets the required Playwright env vars automatically.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
