// UI constants. All records (users, roles, departments, tasks, comments, notifications) come from SugarCRM.

// Must match the tf_task_status_list / tf_task_priority_list dropdowns in the CRM package.
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

// Seeded demo accounts (backend/sugarcrm/scripts/seed.php); all use the password demo1234.
export const DEMO_ACCOUNTS = [
  ['aarav', 'Company Head'],
  ['neha', 'Manager'],
  ['rohan', 'Team Leader · Development'],
  ['dev', 'Team Leader · Design'],
  ['sana', 'Senior · Development'],
  ['kabir', 'Junior · Development'],
  ['isha', 'Senior · Design'],
  ['mira', 'Intern · Design'],
  ['zoya', 'Junior · Marketing'],
];

export const day = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
