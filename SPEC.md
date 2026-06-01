# Project SPEC.MD - Task & Project Management Webapp

## Vision & Goals

### Problem

Existing tools (Notion, ClickUp, etc.) are either too complex, too generic, or locked into workflows that don't match personal productivity rhythms. Users need a focused tool that adapts to **their** workflow — not the other way around.

### Vision

A personal productivity system that combines task management and project tracking — all accessible from a fast, clean web interface.

### Core Principles

- **Speed first:** Capture a task or note in under 2 seconds
- **Hosted:** Data lives on a backend SQLite DB, reliable and always available
- **Simple by default, powerful on demand:** Clean UI that doesn't overwhelm
- Start with basic functionality for MVP, iterate later

### Target User

Strictly single-user personal tool. No multi-tenant, no accounts, no signup flow.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | SvelteKit (full-stack: frontend + API) |
| Database | SQLite via Better-SQLite3 |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS |
| Auth | Lucia Auth (or similar SvelteKit-compatible lib), email + password |
| Deployment | Railway |
| Schema Migration | Auto-migrate on startup via Drizzle |

---

## Database Schema

### Tasks

| Field | Type | Notes |
|-------|------|-------|
| id | integer pk | |
| title | text not null | |
| description | text nullable | optional longer text body |
| completed | boolean default false | |
| dueDate | datetime nullable | null = Inbox |
| projectId | integer nullable | null = orphan task |
| priority | text | `none`, `low`, `medium`, `urgent` |
| createdAt | datetime | auto-set on insert |
| updatedAt | datetime | auto-updated on change |

### Projects

| Field | Type | Notes |
|-------|------|-------|
| id | integer pk | |
| title | text not null | |
| description | text nullable | |
| archived | boolean default false | soft delete |
| createdAt | datetime | |
| updatedAt | datetime | |

### Settings

| Field | Type | Notes |
|-------|------|-------|
| id | integer pk | single row |
| timezone | text | IANA timezone string (e.g. `America/New_York`). Used to compute "today" and "overdue" queries server-side. Defaults to `UTC`. Set during first-run setup. |
| theme | text | `light`, `dark`, `system` |
| accentColor | text | hex color value |
| shortcutsEnabled | boolean | default `true` |

#### Settings Seed Logic

In `hooks.server.ts`, after Drizzle auto-migrate runs, check if row `id=1` exists. If not, seed the defaults:

```ts
await db.insert(settings).values({
    id: 1,
    theme: 'system',
    accentColor: '#6366f1',
    shortcutsEnabled: true
}).onConflictDoNothing();
```

Idempotent — runs once at startup, no-ops on subsequent starts.

---

## Core Features

### Authentication

- First-run setup screen: set email + password, pick accent color, then redirected to Today view
- Persistent session via HTTP-only cookie (30-day expiry, renews on activity)
- No sign out button — single-user, always logged in
- Password change available in Settings

### Views

| View | Shows |
|------|-------|
| **Today** | Tasks due today + incomplete overdue tasks |
| **Upcoming** | Incomplete tasks due within the next 7 days, grouped by date |
| **Inbox** | Tasks with no due date |
| **Tasks** | All tasks (global list), grouped by project or "Orphan" |
| **Projects** | Project cards showing title and count of incomplete tasks |

### Project Detail View

- Clicking a project replaces main content area with a scoped task list (only that project's tasks)
- Breadcrumb: `← Projects > Project Name`
- Sidebar remains visible
- Creating a new task (`Cmd+N`) inside project view auto-scopes the task to that project
- CRUD on tasks auto-attaches to the project context

### Task Row

```
[ ] Task title                    Tue May 30  ▸ Project Name  🔴
```

| Element | Behavior |
|---------|----------|
| Checkbox | Click to toggle completed |
| Title | Click to open slide-over editor |
| Due Date | Right-aligned, color-coded: green=today, blue=future, red=overdue, gray=none |
| Priority | Colored dot: red=urgent, orange=medium, yellow=low, none=hidden |
| Project Label | Muted text pill showing project name (only if task has a project) |

### Task Row Navigation

Visible focus ring highlights the selected task row. Navigation via keyboard:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection up/down between task rows |
| `Home` | Jump to first task |
| `End` | Jump to last task |
| `Space` (on selected) | Toggle completed |
| `Enter` (on selected) | Open slide-over editor |
| `D` (on selected) | Delete task |

### Task Sorting (Auto-Sort)

1. Priority: urgent → medium → low → none
2. Due date: earliest first
3. Created date: oldest first (tiebreaker)
4. Incomplete tasks above completed tasks

No drag-and-drop reordering.

### Slide-Over Modal (Add/Edit Task or Project)

- Slides over from the right
- Single reusable component for both create and edit (pre-populated for edit)
- **Auto-create on blur** — the task is persisted to the database when the user *exits focus* (blur) from the title field
- If the user presses `Esc` while the modal is open and the title has not yet blurred (task not persisted), the modal closes without creating the task
- Optional fields (description, due date, priority) save on blur or submit
- Keyboard: `Cmd+Enter` saves and closes
- **`Esc` behavior:** Simply closes the modal. If the title has not yet blurred, no task is created. If the title has already blurred, the task is saved.
- **Clicking outside** the modal simply closes it — no deletion, since the task is only created on blur

### Due Date Prompt

- Triggers on **slide-over modal close** if no due date was set
- Quick options: "Today", "Tomorrow", "This Week", "Pick a date", "None"
- "None" — sends task to Inbox
- "Pick a date" — opens a date picker

### Completed Tasks

- Stay in the same view but **collapsed at bottom** with an "Expand completed" toggle
- **Query-time filtered** — exclude completed tasks older than 7 days from queries (data remains in DB for export)
- **Undo:** completing a task shows a 3-second toast "Task completed" with "Undo" button
- Un-checking the box directly also works to undo

### Form Validation

| Field | Constraint |
|-------|-----------|
| Task title | Required, max 256 characters |
| Task description | Optional, max 4096 characters |
| Project title | Required, max 128 characters |
| Project description | Optional, max 2048 characters |
| dueDate | Must be a valid date; "This Week" resolves to end of current week (Sunday). A week spans Monday–Sunday, interpreted in the user's timezone |
| priority | One of `none`, `low`, `medium`, `urgent` |

Server-side validation on all API endpoints. Client-side validation provides instant feedback.

### Task Deletion

- **Hard delete** with a 3-second undo toast
- `D` key on selected task triggers delete

### Project Deletion / Archiving

**When project has tasks — modal with 3 choices:**
1. Archive project (default, highlighted)
2. Delete project + delete all tasks
3. Delete project + move tasks to orphans

**When project has no tasks — modal with 2 choices:**
1. Archive project (default, highlighted)
2. Delete project

### Inbox Workflow

- Inbox = tasks with no due date
- Tasks leave Inbox when a due date is set (via slide-over editor)
- Setting a due date on an Inbox task automatically moves it to Today/Upcoming
- Creating a new task and choosing "No due date" lands it in Inbox

### Search

- `Cmd+K` focuses search bar in top bar
- Real-time filtering as you type
- Searches both task titles/descriptions and project names (global scope)
- Results shown as inline dropdown
- Clicking a task opens the slide-over modal for that task

### Overdue Tasks

- Red due date text on the task row
- Red dot badge on "Today" nav item showing count of overdue tasks
- No browser notifications or email reminders (MVP)
- No auto-archive, no auto-delete, no auto-complete

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+N` | New task (opens slide-over, auto-scoped to current context) |
| `Cmd+P` | New project |
| `1` | Navigate to Today view |
| `2` | Navigate to Upcoming view |
| `3` | Navigate to Inbox view |
| `4` | Navigate to Tasks view |
| `5` | Navigate to Projects view |
| `Cmd+Z` | Undo the last action (completion, deletion, etc.) |
| `Esc` | Close modal / dismiss dialog |
| `?` | Show keyboard shortcut help overlay |
| `Cmd+K` | Open/focus search |
| `Enter` (on selected task) | Open task slide-over editor |
| `Space` (on selected task) | Toggle completed |
| `D` (on selected task) | Delete task (with undo toast) |
| `Cmd+Enter` (in modal) | Save and close modal |

---

## Layout

### Default View (Today)

```
┌──────────────────────────────────────────────────────────────┐
│  ⬡ TaskApp                            [     Search  ]  ⚙  User  │ ← Top bar
├──────────┬─────────────────────────────────────────────────────┤
│          │                                           │           │
│ ● Today  │    Today, Fri May 30                      │           │
│   ●3     │                                           │           │
│ Upcoming │                                           │           │
│   5      │    ┌──────────────────────────────────┐    │           │
│ Inbox    │    │ [ ] Review PR #42               ▸ Work 🔴 Tue   │    │
│   2      │    ├──────────────────────────────────┤    │           │
│ Tasks    │    │ [ ] Buy groceries               🟡 Today        │    │
│   28     │    ├──────────────────────────────────┤    │           │
│ Projects │    │ [x] Update SPEC.md              ▸ Docs ✓        │    │
│   4      │    ├──────────────────────────────────┤    │           │
│          │    │ [ ] Write blog post              🟠 Next Week    │    │
│          │    ├──────────────────────────────────┤    │           │
│          │    │                                  │    │           │
│          │    │  ─── 1 completed (expand ▾)     │    │           │
│          │    │                                  │    │           │
│          │    └──────────────────────────────────┘    │           │
│          │           │                               │           │
│          │           │  [+] Add a task...             │           │
│          │           │                               │           │
│ ──────── │           │                               │           │
│          │           │                               │           │
│ Export   │           │                               │           │
│ Import   │           │                               │           │
│          │           │                               │           │
└──────────┴─────────────────────────────────────────────────────┘
```

### Legend — Task Row Elements

```
┌─────────────────────────────────────────────────────────────┐
│ [ ] Task title                              Due Date  ▸ Project ● │
│  ^     ^                                  ^        ^        ^     │
│  │     │                                  │        │        │     │
│  │     │                                  │        │        └─ Priority dot (red=urgent)  │
│  │     │                                  │        └──── Project name (muted)            │
│  │     │                                  └──────────── Due date (color-coded)           │
│  │     └─────────── Task title (click → slide-over)                                     │
│  └───────────────── Checkbox (click/toggle/Space to complete)                            │
└─────────────────────────────────────────────────────────────┘

Due date colors:
  🟢 Green  = today
  🔵 Blue   = future (within 7 days)
  🔴 Red    = overdue (past due, not completed)
  ⚫ Gray   = no due date / Inbox
```

### Project Detail View

```
┌──────────────────────────────────────────────────────────────┐
│  ⬡ TaskApp                            [     Search  ]  ⚙  User  │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                           │           │
│ ● Today  │    ← Projects   ▸   Work                         │           │
│   ●3     │                                           │           │
│ Upcoming │    ┌──────────────────────────────────┐    │           │
│   5      │    │ [ ] Review PR #42                🔴 Today        │    │
│ Inbox    │    ├──────────────────────────────────┤    │           │
│   2      │    │ [ ] Deploy staging               🔵 Tomorrow    │    │
│ Tasks    │    ├──────────────────────────────────┤    │           │
│   28     │    │ [x] Fix login bug                           │    │
│ Projects │    ├──────────────────────────────────┤    │           │
│ ▸ ● Work │    │                                  │    │           │
│   3      │    │                                  │    │           │
│ Inbox    │    │                                  │    │           │
│   0      │    │                                  │    │           │
│ Docs     │    │                                  │    │           │
│   1      │    └──────────────────────────────────┘    │           │
│ Personal │    │                               │           │
│   0      │    │  [+] Add task to Work...       │           │
│          │       │                               │           │
│          │       │                               │           │
│ ──────── │       │                               │           │
│          │       │                               │           │
│ Export   │       │                               │           │
│ Import   │       │                               │           │
│          │       │                               │           │
└──────────┴─────────────────────────────────────────────────────┘
```

### Slide-Over Modal (Add/Edit Task)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MAIN CONTENT                       │ ┌────────────────────────────────────┐  │
│                                    │ │  New Task                    [×]  │  │
│                                    │ ├────────────────────────────────────┤  │
│  [ ] Review PR #42            🔴   │ │                                  │  │
│  [ ] Buy groceries            🟡   │ │  Title:                         │  │
│  [x] Update SPEC.md               │ │  [Review new feature PR...]      │  │
│                                    │ │                                  │  │
│                                    │ │  Project:     ▸ [Work        ▾] │  │
│                                    │ │                                  │  │
│                                    │ │  Due date:     ▾ [Today      ▾] │  │
│                                    │ │                                  │  │
│                                    │ │  Priority:     ▾ [Urgent     ▾] │  │
│                                    │ │                                  │  │
│                                    │ │  Description:                    │  │
│                                    │ │  ┌──────────────────────────────┐ │  │
│                                    │ │  │                              │ │  │
│                                    │ │  └──────────────────────────────┘ │  │
│                                    │ │                                  │  │
│                                    │ │                                  │  │
│                                    │ └────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Due Date Prompt Modal (when no date set)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              [    When is this due?    ]                     │
│                                                                              │
│        ┌────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────┐   │
│        │ Today  │  │ Tomorrow │  │ This Week  │  │ Pick.. │  │  None    │   │
│        └────────┘  └──────────┘  └────────────┘  └──────────┘  └────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Overdue Tasks Badge

```
Sidebar nav showing overdue count:

  ● Today         ← solid red dot = overdue tasks exist
  3               ← number of overdue tasks appearing in Today view

Other views with overdue tasks get red text on those task rows:
  [ ] Review PR #42           🔴 Yesterday    ← overdue, red text
```

### Keyboard Shortcut Help (`?`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              [   Keyboard Shortcuts    ]                     │
│                                                                              │
│  NAVIGATION                                                                  │
│    1-5       Switch views                                                    │
│    Cmd+K     Search                                                          │
│                                                                              │
│  TASKS                                                                       │
│    Cmd+N     New task                                                        │
│    Space     Toggle completed                                                │
│    Enter     Open task editor                                                │
│    D         Delete task                                                     │
│                                                                              │
│  PROJECTS                                                                    │
│    Cmd+P     New project                                                     │
│                                                                              │
│  GENERAL                                                                     │
│    Cmd+Z     Undo last action                                                │
│    Esc       Close modal                                                     │
│    Cmd+Enter Save in modal                                                   │
│    ?         Show/hide this overlay                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Responsive Behavior (Mobile)

- Sidebar collapses to hamburger menu
- Slide-over modal becomes a bottom sheet (slides up from bottom)
- No offline support or PWA for MVP
- Touch-friendly task rows and interactions

---

## Design System

- **Aesthetic:** Clean, minimal (inspired by Things 3, Linear)
- **Typography:** System font stack or Inter
- **Colors:** Light/dark mode support, accent color configurable
- **Spacing:** 4px grid system
- **Components:** Reusable component library
- **Dark/Light:** Toggleable in Settings

---

## Settings Page

Accessed via `[Settings]` button in top bar.

| Setting | Description |
|---------|-------------|
| Profile | Display name, email |
| Password | Change password |
| Theme | Light / Dark / System default |
| Accent Color | Pick accent color |
| Keyboard Shortcuts | Toggle on/off, view cheat sheet |

No account deletion.

---

## Data Export / Import

- **Export:** Single JSON file — `{ "tasks": [...], "projects": [...], "exportedAt": "..." }`
- **Import:** Restore from a previously exported JSON file
- Manual trigger only — no automatic backups
- Accessible from sidebar footer (Export / Import links)

---

## Outside Scope for MVP

- Calendar view
- Goals
- Habits
- Braindump
- Tags
- Milestones
- Project progress bars
- Plugins
- Quick add widget
- Notes
- Subtasks
- Drag-and-drop task reordering
- Browser push notifications
- Email reminders
- PWA / offline support
- Multi-user / multi-tenant
