# CONTEXT.md — Task Manager V2

## What Is This?

A single-user, personal task and project management web application. Inspired by Things 3 and Linear. Built fast, stays clean, ships MVP-first.

## Why Does This Exist?

Notion, ClickUp, and similar tools are either too complex, too generic, or force workflows that don't match personal productivity rhythms. This tool adapts to the user, not the other way around.

## Core Principles

1. **Speed first** — capture a task in under 2 seconds
2. **Hosted** — data lives on a backend SQLite DB
3. **Simple by default, powerful on demand** — clean UI, keyboard shortcuts unlock power
4. **MVP first, then iterate** — nothing gets scope-crept on day one

## What You're Working On

Build the MVP of a task/project manager with 5 views (Today, Upcoming, Inbox, Tasks, Projects), a slide-over modal for CRUD, keyboard shortcuts, and JSON export/import. See `SPEC.md` for the complete feature spec.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | SvelteKit | Small bundle, fast, built-in routing, excellent keyboard handling |
| Database | SQLite (Better-SQLite3) | Simple, reliable, no infra overhead |
| ORM | Drizzle ORM | Type-safe queries, auto-migrate support |
| Styling | Tailwind CSS | Rapid UI dev, easy dark mode, clean aesthetic |
| Auth | Lucia Auth | SvelteKit-compatible, email + password |
| Deployment | Railway | Easy SQLite hosting, persistent storage, $5/mo |
| Migration | Drizzle auto-migrate on startup | Zero migration file management |

## Key Design Decisions (Locked In)

### Single User, No Accounts
- No signup flow, no multi-tenant, no `userId` on tables
- First-run setup screen creates the single account
- Persistent HTTP-only cookie session, no sign out button

### Auto-Create Tasks
- Task is persisted to the database when the user *exits focus* (blur) from the title field — no "Save" button required
- If the user presses `Esc` while the modal is open and the title has not yet blurred (task not persisted), the modal closes without creating the task
- Optional fields (description, due date, priority) save on blur or submit
- This is the primary mechanism for hitting the "under 2 seconds" capture goal

### Query-Time Filtering, Not Deletion
- Completed tasks older than 7 days are excluded from queries (not deleted from DB)
- Data stays in SQLite for export/backup purposes
- No cron jobs or background cleanup needed

### Context-Aware Creation
- `Cmd+N` key creates a task scoped to the current view context
- In a Project detail view → task auto-attaches to that project
- In any other view → task is an orphan (no project)

### Auto-Sort, No Drag-and-Drop
- Tasks sort by: priority → due date → created date
- No manual reordering to implement or debug

### Due Date Prompt on Modal Close
- When a task is created without a due date, the prompt appears when the slide-over modal closes
- Does NOT interrupt the fast capture flow
- Options: Today, Tomorrow, This Week, Pick a date, None (→ Inbox)
- `Esc` or clicking outside the modal simply closes it — no deletion, since the task is only created on blur

### Visual + Badge for Overdue
- Red due date text on task rows
- Red dot badge on "Today" nav item showing overdue count
- No push notifications, no emails

### Task Row Navigation
- `↑` / `↓` move selection between task rows (visible focus ring)
- `Space`, `Enter`, `D` act on the selected task row

### Timezone Handling
- User timezone stored in Settings (IANA string, e.g. `America/New_York`)
- "Today" / "overdue" queries compute date boundaries server-side using the user's timezone
- Due dates stored as `YYYY-MM-DD` strings, interpreted in the user's timezone

### Form Validation
- Task title: required, max 256 chars
- Task description: optional, max 4096 chars
- Project title: required, max 128 chars
- Project description: optional, max 2048 chars
- Server-side validation on all API endpoints; client-side for instant feedback

## Database Schema

### Tasks Table
```
id          INTEGER PRIMARY KEY
title       TEXT NOT NULL
description TEXT (nullable)
completed   BOOLEAN DEFAULT FALSE
dueDate     DATETIME (nullable — null means Inbox)
projectId   INTEGER (nullable — null means orphan)
priority    TEXT ENUM('none', 'low', 'medium', 'urgent')
createdAt   DATETIME
updatedAt   DATETIME
```

### Projects Table
```
id          INTEGER PRIMARY KEY
title       TEXT NOT NULL
description TEXT (nullable)
archived    BOOLEAN DEFAULT FALSE
createdAt   DATETIME
updatedAt   DATETIME
```

### Settings Table
```
id                 INTEGER PRIMARY KEY (single row)
theme              TEXT ('light', 'dark', 'system')
accentColor        TEXT (hex)
shortcutsEnabled   BOOLEAN DEFAULT TRUE
timezone           TEXT (IANA string, e.g. 'America/New_York', defaults to 'UTC')
```

#### Settings Seed Logic

In `hooks.server.ts`, after Drizzle auto-migrate runs, check if row `id=1` exists. If not, seed the defaults:

```ts
await db.insert(settings).values({
    id: 1,
    theme: 'system',
    accentColor: '#6366f1',
    shortcutsEnabled: true,
    timezone: 'UTC'
}).onConflictDoNothing();
```

Idempotent — runs once at startup, no-ops on subsequent starts.

## Views

| View | Query Logic |
|------|-------------|
| Today | `dueDate = today AND completed = false` OR `dueDate < today AND completed = false` (overdue) |
| Upcoming | `dueDate > today AND dueDate <= today + 7 days AND completed = false` |
| Inbox | `dueDate IS NULL AND completed = false` |
| Tasks | All tasks, grouped by project or "Orphan" |
| Projects | List of projects (archived = false) with incomplete task count |

## Keyboard Shortcuts

`Cmd+N` new task · `Cmd+P` new project · `1-5` switch views · `Cmd+Z` undo · `?` shortcut help · `Cmd+K` search · `Space` toggle complete · `Enter` open editor · `D` delete · `Esc` close · `Cmd+Enter` save

## How to Start Development

1. **Scaffold** — `npm create svelte@latest`, choose SvelteKit
2. **Install deps** — drizzle-orm, better-sqlite3, lucia-auth, tailwindCSS, @tailwindcss/typography
3. **Set up DB** — define Drizzle schema, auto-migrate in `hooks.server.ts`
4. **Build auth** — first-run setup route, session middleware, protected route guard
5. **Build views** — Today, Upcoming, Inbox, Tasks, Projects pages
6. **Build components** — Sidebar, TaskRow, SlideOverModal, DueDatePrompt, Search, Toast
7. **Add shortcuts** — global keyboard listener, shortcut help overlay
8. **Add settings** — theme toggle, accent color, export/import
9. **Deploy** — push to Railway

## Files You'll Need to Create

Key SvelteKit file structure to target:

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema
│   │   └── index.ts           # DB connection + auto-migrate
│   ├── components/
│   │   ├── Sidebar.svelte
│   │   ├── TaskRow.svelte
│   │   ├── SlideOver.svelte
│   │   ├── DueDatePrompt.svelte
│   │   ├── Search.svelte
│   │   ├── Toast.svelte
│   │   └── ShortcutHelp.svelte
│   └── stores/
│       └── keyboard.svelte    # global keyboard shortcuts store
├── routes/
│   ├── +layout.server.ts      # auth guard / session check
│   ├── setup/+page.svelte     # first-run setup screen
│   ├── +page.svelte           # Today view (default route)
│   ├── upcoming/+page.svelte
│   ├── inbox/+page.svelte
│   ├── tasks/+page.svelte
│   ├── projects/+page.svelte
│   ├── projects/[id]/+page.svelte  # project detail view
│   ├── settings/+page.svelte
│   └── api/
│       └── +server.ts         # API endpoints for CRUD
├── hooks.server.ts            # session/auth middleware + auto-migrate
├── app.html
├── app.css                    # Tailwind + custom styles
└── tailwind.config.ts
```

## What's NOT in MVP

Calendar, goals, habits, braindump, tags, milestones, project progress, plugins, quick add, notes, subtasks, drag-and-drop, push notifications, email reminders, PWA, offline support, multi-user.

## Reference Files

- `SPEC.md` — complete feature specification with wireframes
- `CONTEXT.md` — this file
