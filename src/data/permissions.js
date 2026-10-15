// Role-based access rules. Kept in one place so the backend can mirror them later.
import { USERS, day } from './seed';

export const findUser = (id) => USERS.find((u) => u.id === Number(id)) || USERS[0];

const isTop = (u) => u.role === 'Company Head' || u.role === 'Manager';
const isLead = (u) => u.role === 'Team Leader';

// Head and Manager review everything; a Team Leader reviews their own department.
export const isReviewer = (u) => isTop(u) || isLead(u);

export const canReviewTask = (u, t) => isTop(u) || (isLead(u) && t.dept === u.dept);

// Which tasks a user can see.
export const canSeeTask = (u, t) => {
  if (isTop(u)) return true;
  if (isLead(u)) return t.dept === u.dept || t.assignee === u.id;
  return t.assignee === u.id;
};

export const visibleTasks = (u, tasks) => tasks.filter((t) => canSeeTask(u, t));

// Who a user may assign tasks to.
export const assignableUsers = (u) => {
  if (isTop(u)) return USERS;
  if (isLead(u)) return USERS.filter((x) => x.dept === u.dept);
  return [u];
};

export const canEditTask = (u, t) => canReviewTask(u, t) || t.assignee === u.id;

export const canDeleteTask = (u, t) => isTop(u) || t.createdBy === u.id;

// Only a reviewer may move a task to Done, and only after it has been in review.
export const canMoveTo = (u, t, status) => {
  if (status !== 'done') return canEditTask(u, t);
  return canReviewTask(u, t);
};

// People who should hear about a task's review / blocked events.
export const reviewersFor = (t) =>
  USERS.filter((u) => isTop(u) || (isLead(u) && u.dept === t.dept)).map((u) => u.id);

export const isLate = (t) => t.status !== 'done' && t.due < day(0);

export const PERMISSIONS = [
  ['See all tasks', ['Company Head', 'Manager']],
  ['See department tasks', ['Company Head', 'Manager', 'Team Leader']],
  ['Assign to anyone', ['Company Head', 'Manager']],
  ['Assign within department', ['Company Head', 'Manager', 'Team Leader']],
  ['Approve reviews', ['Company Head', 'Manager', 'Team Leader']],
  ['Work own tasks', ['Company Head', 'Manager', 'Team Leader', 'Senior', 'Junior', 'Intern']],
];
