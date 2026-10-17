// Role-based rules. The flags come from the user's tf_Roles record in SugarCRM
// (can_view_all, can_view_team, can_assign_any, can_assign_team, can_review, can_delete_any).
import { day } from './constants';

const flag = (u, f) => !!u?.perm?.[f];

export const isReviewer = (u) => flag(u, 'can_review');

export const canReviewTask = (u, t) => flag(u, 'can_review') && (flag(u, 'can_view_all') || t.deptId === u.deptId);

export const canSeeTask = (u, t) =>
  flag(u, 'can_view_all') ||
  (flag(u, 'can_view_team') && t.deptId === u.deptId) ||
  t.assignee === u.id ||
  t.createdBy === u.id;

export const visibleTasks = (u, tasks) => tasks.filter((t) => canSeeTask(u, t));

export const assignableUsers = (u, users) => {
  if (flag(u, 'can_assign_any')) return users;
  if (flag(u, 'can_assign_team')) return users.filter((x) => x.deptId === u.deptId);
  return users.filter((x) => x.id === u.id);
};

export const canEditTask = (u, t) => canReviewTask(u, t) || t.assignee === u.id || t.createdBy === u.id;

export const canDeleteTask = (u, t) => flag(u, 'can_delete_any') || t.createdBy === u.id;

// Only a reviewer may move a task to Done.
export const canMoveTo = (u, t, status) => (status === 'done' ? canReviewTask(u, t) : canEditTask(u, t));

export const isLate = (t) => t.status !== 'done' && !!t.due && t.due < day(0);

export const PERMISSION_LABELS = [
  ['can_view_all', 'See all tasks'],
  ['can_view_team', 'See department tasks'],
  ['can_assign_any', 'Assign to anyone'],
  ['can_assign_team', 'Assign within department'],
  ['can_review', 'Approve reviews'],
  ['can_delete_any', 'Delete any task'],
];
