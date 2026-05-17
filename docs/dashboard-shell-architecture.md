# Dashboard Shell Architecture

This document describes the dashboard shell added for issue #2.

## Goals

- Replace starter screen with a production-style dashboard shell.
- Establish semantic, accessible layout regions before task CRUD implementation.
- Create stable task-domain contracts for upcoming features.

## UI Shell Composition

`apps/web/app/page.tsx` defines these stable regions:

1. **Header context** (`header`) with dashboard title and purpose.
2. **Primary actions** (`section[aria-labelledby]`) for future task creation/import actions.
3. **Search and filters** (`section` + `form[role="search"]`) for future query/filter controls.
4. **Task list content** (`section`) for list/card task rendering.
5. **Summary and metadata** (`section`) for counts and persistence status.

The main layout uses responsive grid behavior:

- Mobile/tablet: single column stack
- Desktop: two-column shell (`lg:grid-cols-[2fr_1fr]`)

## Accessibility Baseline

- Semantic landmarks: `header` and `main`
- Named regions via heading + `aria-labelledby`
- Keyboard-focusable controls with accessible names:
  - `New Task`
  - `Import Template`
  - `Search tasks` search input
  - status and priority selects
- Focus-visible styles are present for native controls and button component.

## Task Domain Extension Points

Task contracts and boundaries live in `apps/web/lib/tasks/`:

- `types.ts`
  - `TaskPriority`, `TaskStatus`, `Task`
  - `TaskState` and filter types
- `state.ts`
  - `defaultTaskState`
  - `createInitialTaskState()`
- `utils.ts`
  - `summarizeTasks(tasks)` derived metadata helper

These modules are intentionally small, stable interfaces so future CRUD, filtering, and persistence can be added without reshaping shell-level components.

## Test Coverage (Current)

- `apps/web/test/page.spec.tsx`
  - semantic landmarks and shell regions
  - keyboard-focusable named controls
  - responsive layout contract classes
- `apps/web/test/task-contracts.spec.ts`
  - default task state contract
  - derived task summary behavior
  - constrained priority/status union usage
