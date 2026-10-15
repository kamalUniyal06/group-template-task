# Taskflow — Group Template Task

A role-based task management portal built with **React 19 + Vite**. This is the static front end; data lives in the browser (localStorage) until the backend is connected.

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`, `npm run lint`.

## Demo login

Pick any account on the sign-in screen. Every demo account uses the password **`demo1234`**.

| Role | Sees | Can |
| --- | --- | --- |
| Company Head / Manager | All tasks | Assign to anyone, approve any review, delete any task |
| Team Leader | Their department + own tasks | Assign within department, approve department reviews |
| Senior / Junior / Intern | Own tasks | Work tasks, submit for review, comment |

## Features

- **Role-based views** — tasks, reviews and assignment options depend on who is signed in
- **Dashboard** — stats, today's focus, 25-minute focus timer, completion ring, priority mix, workload, milestone trophy
- **Tasks** — Kanban board with drag-and-drop, sortable table, search, priority/owner filters
- **Task detail** — description, status, approve / request changes, comments, edit, delete
- **Review workflow** — only reviewers can move a task to *Done*
- **Notifications** — targeted per user (assignment, review requested, approved, changes requested, blocked, comments), unread badge, mark read
- **Teams** — departments, members, open-task counts, invite, role-permission matrix
- **Themes** — sun, night, ocean, forest, rose; collapsible sidebar; mobile menu

## Project structure

```
src/
  context/AppContext.jsx   app state, actions, notifications, persistence
  data/seed.js             demo users, tasks, constants
  data/permissions.js      role rules (mirror these in the backend)
  data/nav.js              sidebar routes
  components/              Sidebar, Header, TaskCard, TaskForm, TaskDetail, Modal, ...
  pages/                   Login, Dashboard, Tasks, Reviews, Teams, Notifications
public/images/             illustrations
```

## Connecting a backend later

- Replace `login()` in `AppContext.jsx` with a call to your auth API and store the returned user/role.
- Replace `seedTasks()` / `seedNotes()` with fetches, and the action functions (`createTask`, `moveTask`, `addComment`, ...) with API calls.
- Enforce the rules in `data/permissions.js` on the server too; the client checks are for UX only.
