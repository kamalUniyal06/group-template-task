// Static demo data. When the backend is ready, replace these with API calls.

export const ROLES = ['Company Head', 'Manager', 'Team Leader', 'Senior', 'Junior', 'Intern'];

export const USERS = [
  { id: 1, name: 'Aarav Mehta', role: 'Company Head', dept: 'All', email: 'aarav@taskflow.dev' },
  { id: 2, name: 'Neha Kapoor', role: 'Manager', dept: 'Operations', email: 'neha@taskflow.dev' },
  { id: 3, name: 'Rohan Verma', role: 'Team Leader', dept: 'Development', email: 'rohan@taskflow.dev' },
  { id: 4, name: 'Sana Iqbal', role: 'Senior', dept: 'Development', email: 'sana@taskflow.dev' },
  { id: 5, name: 'Kabir Singh', role: 'Junior', dept: 'Development', email: 'kabir@taskflow.dev' },
  { id: 6, name: 'Mira Das', role: 'Intern', dept: 'Design', email: 'mira@taskflow.dev' },
  { id: 7, name: 'Dev Patel', role: 'Team Leader', dept: 'Design', email: 'dev@taskflow.dev' },
  { id: 8, name: 'Isha Rao', role: 'Senior', dept: 'Design', email: 'isha@taskflow.dev' },
  { id: 9, name: 'Zoya Khan', role: 'Junior', dept: 'Marketing', email: 'zoya@taskflow.dev' },
];

// Every demo account uses this password until real auth exists.
export const DEMO_PASSWORD = 'demo1234';

export const STATUS = {
  todo: 'To do',
  prog: 'In progress',
  review: 'In review',
  blocked: 'Blocked',
  done: 'Done',
};

export const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

export const AVATAR_COLORS = ['#ffc61a', '#ffe08a', '#8fd3ff', '#b8f0c0', '#ffb3c7', '#d7c4ff'];

export const THEMES = [
  ['sun', '#ffc61a'],
  ['night', '#14130f'],
  ['ocean', '#2f9bff'],
  ['forest', '#3ecf6e'],
  ['rose', '#ff4f7b'],
];

export const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// [title, dept, assigneeId, priority, status, dueInDays, estimateHours, createdBy]
const RAW = [
  ['Redesign checkout flow', 'Development', 4, 'urgent', 'prog', 1, 16, 3],
  ['API rate limiting', 'Development', 5, 'high', 'review', 2, 10, 3],
  ['Write release notes', 'Development', 4, 'low', 'done', -1, 3, 3],
  ['Fix login redirect bug', 'Development', 5, 'high', 'blocked', -2, 5, 3],
  ['Brand refresh moodboard', 'Design', 6, 'medium', 'prog', 3, 8, 7],
  ['Icon set v2', 'Design', 8, 'medium', 'review', 1, 12, 7],
  ['Landing page hero', 'Design', 8, 'high', 'todo', 5, 14, 7],
  ['Q4 campaign brief', 'Marketing', 9, 'high', 'todo', 2, 6, 2],
  ['Newsletter draft', 'Marketing', 9, 'low', 'done', -3, 2, 2],
  ['Sprint planning deck', 'Development', 3, 'medium', 'todo', 0, 4, 2],
  ['Onboarding checklist', 'Operations', 2, 'medium', 'prog', 6, 5, 1],
  ['Vendor contract review', 'Operations', 2, 'urgent', 'review', -1, 7, 1],
  ['Intern shadowing plan', 'Design', 7, 'low', 'todo', 7, 3, 2],
  ['Performance audit', 'Development', 4, 'high', 'todo', 0, 9, 3],
];

export const seedTasks = () =>
  RAW.map((x, i) => ({
    id: 'T-' + (101 + i),
    title: x[0],
    description: '',
    dept: x[1],
    assignee: x[2],
    priority: x[3],
    status: x[4],
    due: day(x[5]),
    hours: x[6],
    createdBy: x[7],
    comments: [],
    createdAt: Date.now() - (RAW.length - i) * 3600e3,
  }));

export const seedNotes = () => [
  { id: 'n1', title: 'Welcome to Taskflow', msg: 'Demo data is loaded. Try dragging a task across the board.', to: 'all', readBy: [], at: Date.now() - 7200e3 },
  { id: 'n2', title: 'Review requested', msg: 'API rate limiting is waiting for review.', to: [1, 2, 3], readBy: [], at: Date.now() - 3600e3 },
  { id: 'n3', title: 'Task blocked', msg: 'Fix login redirect bug is blocked.', to: [1, 2, 3, 5], readBy: [], at: Date.now() - 1800e3 },
];
