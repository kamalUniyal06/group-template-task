# Taskflow — Group Template Task

A role-based task management portal built with **React 19 + Vite**, backed by **SugarCRM 6.5** through its SmartGateway API. Users, roles, departments, tasks, comments and notifications all live in the CRM. Backend setup: [backend/README.md](backend/README.md).

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The local CRM must be running at http://localhost/taskscrm (XAMPP Apache + MySQL + the PHP 7.4 worker); Vite proxies `/crm` to it. Copy `.env.example` to `.env.local` to use a different CRM.

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`, `npm run lint`.

## Demo login

Sign in with a SugarCRM user. The seeded demo accounts (`aarav`, `neha`, `rohan`, `dev`, `sana`, `isha`, `kabir`, `zoya`, `mira`) use the password **`demo1234`**; click one on the sign-in screen to fill it in.

| Role | Sees | Can |
| --- | --- | --- |
| Company Head / Manager | All tasks | Assign to anyone, approve any review (Head can also delete any task) |
| Team Leader | Their department + own tasks | Assign within department, approve department reviews |
| Senior / Junior / Intern | Own tasks | Work tasks, submit for review, comment |

## Features

- **Role-based views** — tasks, reviews and assignment options depend on who is signed in
- **Dashboard** — stats, today's focus, 25-minute focus timer, completion ring, priority mix, workload, milestone trophy
- **Tasks** — Kanban board with drag-and-drop, sortable table, search, priority/owner filters
- **Task detail** — description, status, approve / request changes, comments, edit, delete
- **Review workflow** — only reviewers can move a task to *Done*
- **Notifications** — created in the CRM by logic hooks for the right people (assignment, review requested, approved, changes requested, blocked, comments); unread badge, mark read, refreshed every 15 seconds with a toast for new ones
- **Teams** — departments and members from the CRM, open-task counts, role-permission matrix read from the Task Roles module
- **Themes** — sun, night, ocean, forest, rose; collapsible sidebar; mobile menu

## Project structure

```
src/
  api/gateway.js           SmartGateway client (signed X-Api-Token) + login
  context/AppContext.jsx   app state, CRM loading/polling, actions
  data/permissions.js      role rules driven by the user's tf_Roles flags
  data/constants.js        statuses, priorities, themes, demo accounts
  components/              Sidebar, Header, TaskCard, TaskForm, TaskDetail, Modal, ...
  pages/                   Login, Dashboard, Tasks, Reviews, Teams, Notifications
backend/
  sugarcrm/build-package.mjs   generates the SugarCRM Module Loader package
  sugarcrm/src/                logic hooks + login entry point (PHP)
  sugarcrm/scripts/            install_package.php, repair.php, seed.php
  sugarcrm/dist/               taskflow_package.zip (upload in Admin > Module Loader)
  xampp/                       Apache + PHP 7.4 config for running the CRM locally
```

## Security

The SmartGateway accepts any request signed with a shared secret that ships in the browser bundle, and role checks happen only in the UI. Fine for local development; see [backend/README.md](backend/README.md#security-notes-read-before-going-live) before deploying.
