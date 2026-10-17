// Generates the "Taskflow" SugarCRM 6.5 Module Loader package from the definitions below.
//   node backend/sugarcrm/build-package.mjs
// Output: backend/sugarcrm/dist/taskflow_package/ (+ taskflow_package.zip when `zip` or PowerShell is available)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'dist', 'taskflow_package');
const SRC = path.join(HERE, 'src'); // hand-written PHP copied as-is
const VERSION = '1.0.0';

// ---------- dropdowns ----------
const LISTS = {
  tf_task_status_list: { todo: 'To do', prog: 'In progress', review: 'In review', blocked: 'Blocked', done: 'Done' },
  tf_task_priority_list: { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' },
  tf_notification_type_list: {
    assigned: 'Task assigned',
    review: 'Review requested',
    approved: 'Approved',
    changes: 'Changes requested',
    blocked: 'Blocked',
    status: 'Status changed',
    comment: 'New comment',
    system: 'System',
  },
};

// ---------- modules ----------
const relate = (name, idName, module, label, link) => ({
  [idName]: { name: idName, vname: label + ' ID', type: 'id', reportable: false, massupdate: false },
  [name]: {
    name, vname: label, type: 'relate', source: 'non-db', id_name: idName, module, rname: module === 'Users' ? 'user_name' : 'name',
    ...(link ? { link } : {}), table: module === 'Users' ? 'users' : module.toLowerCase(), isnull: 'true', massupdate: false,
  },
});
const link = (name, relationship, module, bean, label, side) => ({
  [name]: { name, type: 'link', relationship, source: 'non-db', module, bean_name: bean, vname: label, ...(side ? { side } : {}) },
});

const MODULES = [
  {
    name: 'tf_Departments', object: 'tf_Departments', table: 'tf_departments', label: 'Departments', single: 'Department',
    templates: ['basic'],
    fields: {
      color: { name: 'color', vname: 'LBL_COLOR', type: 'varchar', len: 20, default: '#ffc61a' },
      ...link('tf_departments_users', 'tf_departments_users', 'Users', 'User', 'LBL_USERS'),
      ...link('tf_departments_tf_tasks', 'tf_departments_tf_tasks', 'tf_Tasks', 'tf_Tasks', 'LBL_TASKS'),
    },
    labels: { LBL_COLOR: 'Color', LBL_USERS: 'Members', LBL_TASKS: 'Tasks' },
    list: ['name', 'color', 'date_entered'],
    detail: [['name', 'color'], ['description']],
    subpanels: [
      { module: 'Users', link: 'tf_departments_users', title: 'LBL_USERS' },
      { module: 'tf_Tasks', link: 'tf_departments_tf_tasks', title: 'LBL_TASKS' },
    ],
  },
  {
    name: 'tf_Roles', object: 'tf_Roles', table: 'tf_roles', label: 'Task Roles', single: 'Task Role',
    templates: ['basic'],
    fields: {
      level: { name: 'level', vname: 'LBL_LEVEL', type: 'int', len: 3, default: 50, comment: 'Lower = more senior' },
      can_view_all: { name: 'can_view_all', vname: 'LBL_CAN_VIEW_ALL', type: 'bool', default: 0 },
      can_view_team: { name: 'can_view_team', vname: 'LBL_CAN_VIEW_TEAM', type: 'bool', default: 0 },
      can_assign_any: { name: 'can_assign_any', vname: 'LBL_CAN_ASSIGN_ANY', type: 'bool', default: 0 },
      can_assign_team: { name: 'can_assign_team', vname: 'LBL_CAN_ASSIGN_TEAM', type: 'bool', default: 0 },
      can_review: { name: 'can_review', vname: 'LBL_CAN_REVIEW', type: 'bool', default: 0 },
      can_delete_any: { name: 'can_delete_any', vname: 'LBL_CAN_DELETE_ANY', type: 'bool', default: 0 },
      ...link('tf_roles_users', 'tf_roles_users', 'Users', 'User', 'LBL_USERS'),
    },
    labels: {
      LBL_LEVEL: 'Level', LBL_CAN_VIEW_ALL: 'Can view all tasks', LBL_CAN_VIEW_TEAM: 'Can view department tasks',
      LBL_CAN_ASSIGN_ANY: 'Can assign to anyone', LBL_CAN_ASSIGN_TEAM: 'Can assign within department',
      LBL_CAN_REVIEW: 'Can approve reviews', LBL_CAN_DELETE_ANY: 'Can delete any task', LBL_USERS: 'Users',
    },
    list: ['name', 'level', 'can_view_all', 'can_review'],
    detail: [['name', 'level'], ['can_view_all', 'can_view_team'], ['can_assign_any', 'can_assign_team'], ['can_review', 'can_delete_any'], ['description']],
    subpanels: [{ module: 'Users', link: 'tf_roles_users', title: 'LBL_USERS' }],
  },
  {
    name: 'tf_Tasks', object: 'tf_Tasks', table: 'tf_tasks', label: 'Taskflow Tasks', single: 'Taskflow Task',
    templates: ['basic', 'assignable'],
    fields: {
      task_number: { name: 'task_number', vname: 'LBL_TASK_NUMBER', type: 'int', auto_increment: true, required: true, readonly: true, disable_num_format: true, len: 11 },
      status: { name: 'status', vname: 'LBL_STATUS', type: 'enum', options: 'tf_task_status_list', len: 20, default: 'todo', massupdate: true },
      priority: { name: 'priority', vname: 'LBL_PRIORITY', type: 'enum', options: 'tf_task_priority_list', len: 20, default: 'medium', massupdate: true },
      date_due: { name: 'date_due', vname: 'LBL_DATE_DUE', type: 'date', massupdate: true },
      estimate_hours: { name: 'estimate_hours', vname: 'LBL_ESTIMATE_HOURS', type: 'int', len: 5, default: 4 },
      ...relate('tf_department_name', 'tf_department_id', 'tf_Departments', 'LBL_DEPARTMENT', 'tf_departments_tf_tasks'),
      ...link('tf_departments_tf_tasks', 'tf_departments_tf_tasks', 'tf_Departments', 'tf_Departments', 'LBL_DEPARTMENT'),
      ...relate('owner_name', 'owner_id', 'Users', 'LBL_OWNER'),
      last_actor_id: { name: 'last_actor_id', vname: 'LBL_LAST_ACTOR', type: 'id', reportable: false, comment: 'User who made the latest change (set by the frontend)' },
      ...link('tf_tasks_tf_comments', 'tf_tasks_tf_comments', 'tf_Comments', 'tf_Comments', 'LBL_COMMENTS'),
      ...link('tf_tasks_tf_notifications', 'tf_tasks_tf_notifications', 'tf_Notifications', 'tf_Notifications', 'LBL_NOTIFICATIONS'),
    },
    indices: [
      { name: 'tf_tasks_number', type: 'unique', fields: ['task_number'] },
      { name: 'idx_tf_tasks_assigned', type: 'index', fields: ['assigned_user_id', 'status', 'deleted'] },
      { name: 'idx_tf_tasks_dept', type: 'index', fields: ['tf_department_id', 'deleted'] },
    ],
    relationships: {
      tf_departments_tf_tasks: { lhs_module: 'tf_Departments', lhs_table: 'tf_departments', lhs_key: 'id', rhs_module: 'tf_Tasks', rhs_table: 'tf_tasks', rhs_key: 'tf_department_id', relationship_type: 'one-to-many' },
    },
    labels: {
      LBL_TASK_NUMBER: 'Task #', LBL_STATUS: 'Status', LBL_PRIORITY: 'Priority', LBL_DATE_DUE: 'Due date', LBL_ESTIMATE_HOURS: 'Estimate (hours)',
      LBL_DEPARTMENT: 'Department', LBL_OWNER: 'Created by (user)', LBL_LAST_ACTOR: 'Last changed by', LBL_COMMENTS: 'Comments', LBL_NOTIFICATIONS: 'Notifications',
    },
    list: ['task_number', 'name', 'status', 'priority', 'date_due', 'assigned_user_name', 'tf_department_name'],
    detail: [['task_number', 'status'], ['name', 'priority'], ['assigned_user_name', 'date_due'], ['tf_department_name', 'estimate_hours'], ['owner_name', ''], ['description']],
    hooks: [['after_save', 1, 'Taskflow task notifications', 'custom/modules/tf_Tasks/TaskflowHooks.php', 'TaskflowHooks', 'taskSaved']],
    subpanels: [
      { module: 'tf_Comments', link: 'tf_tasks_tf_comments', title: 'LBL_COMMENTS' },
      { module: 'tf_Notifications', link: 'tf_tasks_tf_notifications', title: 'LBL_NOTIFICATIONS' },
    ],
  },
  {
    name: 'tf_Comments', object: 'tf_Comments', table: 'tf_comments', label: 'Task Comments', single: 'Task Comment',
    templates: ['basic'],
    fields: {
      ...relate('tf_task_name', 'tf_task_id', 'tf_Tasks', 'LBL_TASK', 'tf_tasks_tf_comments'),
      ...link('tf_tasks_tf_comments', 'tf_tasks_tf_comments', 'tf_Tasks', 'tf_Tasks', 'LBL_TASK'),
      ...relate('author_name', 'author_id', 'Users', 'LBL_AUTHOR'),
    },
    indices: [{ name: 'idx_tf_comments_task', type: 'index', fields: ['tf_task_id', 'deleted'] }],
    relationships: {
      tf_tasks_tf_comments: { lhs_module: 'tf_Tasks', lhs_table: 'tf_tasks', lhs_key: 'id', rhs_module: 'tf_Comments', rhs_table: 'tf_comments', rhs_key: 'tf_task_id', relationship_type: 'one-to-many' },
    },
    labels: { LBL_TASK: 'Task', LBL_AUTHOR: 'Author' },
    list: ['name', 'tf_task_name', 'author_name', 'date_entered'],
    detail: [['tf_task_name', 'author_name'], ['name'], ['description']],
    hooks: [['after_save', 1, 'Taskflow comment notifications', 'custom/modules/tf_Tasks/TaskflowHooks.php', 'TaskflowHooks', 'commentSaved']],
  },
  {
    name: 'tf_Notifications', object: 'tf_Notifications', table: 'tf_notifications', label: 'Task Notifications', single: 'Task Notification',
    templates: ['basic', 'assignable'],
    fields: {
      is_read: { name: 'is_read', vname: 'LBL_IS_READ', type: 'bool', default: 0, massupdate: true },
      notif_type: { name: 'notif_type', vname: 'LBL_NOTIF_TYPE', type: 'enum', options: 'tf_notification_type_list', len: 20, default: 'system' },
      ...relate('tf_task_name', 'tf_task_id', 'tf_Tasks', 'LBL_TASK', 'tf_tasks_tf_notifications'),
      ...link('tf_tasks_tf_notifications', 'tf_tasks_tf_notifications', 'tf_Tasks', 'tf_Tasks', 'LBL_TASK'),
      ...relate('actor_name', 'actor_id', 'Users', 'LBL_ACTOR'),
    },
    indices: [{ name: 'idx_tf_notif_user', type: 'index', fields: ['assigned_user_id', 'is_read', 'deleted'] }],
    relationships: {
      tf_tasks_tf_notifications: { lhs_module: 'tf_Tasks', lhs_table: 'tf_tasks', lhs_key: 'id', rhs_module: 'tf_Notifications', rhs_table: 'tf_notifications', rhs_key: 'tf_task_id', relationship_type: 'one-to-many' },
    },
    labels: { LBL_IS_READ: 'Read', LBL_NOTIF_TYPE: 'Type', LBL_TASK: 'Task', LBL_ACTOR: 'Triggered by', LBL_ASSIGNED_TO_NAME: 'Recipient' },
    list: ['name', 'notif_type', 'assigned_user_name', 'is_read', 'date_entered'],
    detail: [['name', 'notif_type'], ['assigned_user_name', 'is_read'], ['tf_task_name', 'actor_name'], ['description']],
  },
];

// Fields + relationships added to the core Users module.
const USER_EXT = {
  fields: {
    ...relate('tf_department_name', 'tf_department_id', 'tf_Departments', 'LBL_TF_DEPARTMENT', 'tf_departments_users'),
    ...link('tf_departments_users', 'tf_departments_users', 'tf_Departments', 'tf_Departments', 'LBL_TF_DEPARTMENT'),
    ...relate('tf_role_name', 'tf_role_id', 'tf_Roles', 'LBL_TF_ROLE', 'tf_roles_users'),
    ...link('tf_roles_users', 'tf_roles_users', 'tf_Roles', 'tf_Roles', 'LBL_TF_ROLE'),
  },
  relationships: {
    tf_departments_users: { lhs_module: 'tf_Departments', lhs_table: 'tf_departments', lhs_key: 'id', rhs_module: 'Users', rhs_table: 'users', rhs_key: 'tf_department_id', relationship_type: 'one-to-many' },
    tf_roles_users: { lhs_module: 'tf_Roles', lhs_table: 'tf_roles', lhs_key: 'id', rhs_module: 'Users', rhs_table: 'users', rhs_key: 'tf_role_id', relationship_type: 'one-to-many' },
  },
  labels: { LBL_TF_DEPARTMENT: 'Taskflow Department', LBL_TF_ROLE: 'Taskflow Role' },
};

// ---------- PHP serialisation ----------
const q = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
function php(v, ind = '') {
  if (v === true) return 'true';
  if (v === false) return 'false';
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return q(v);
  const i2 = ind + '  ';
  if (Array.isArray(v)) return 'array(\n' + v.map((x) => i2 + php(x, i2) + ',\n').join('') + ind + ')';
  return 'array(\n' + Object.entries(v).map(([k, x]) => i2 + q(k) + ' => ' + php(x, i2) + ',\n').join('') + ind + ')';
}
const HEADER = '<?php\n// Generated by backend/sugarcrm/build-package.mjs — edit the generator, not this file.\n';

// ---------- writers ----------
const files = new Map();
const put = (p, content) => files.set(p, content);

for (const m of MODULES) {
  const dir = `SugarModules/modules/${m.name}`;
  const assignable = m.templates.includes('assignable');
  put(`${dir}/${m.name}.php`, `${HEADER}
class ${m.object} extends Basic
{
    public $new_schema = true;
    public $module_dir = ${q(m.name)};
    public $object_name = ${q(m.object)};
    public $table_name = ${q(m.table)};
    public $importable = true;
    public $disable_row_level_security = true;

    public function bean_implements($interface)
    {
        return $interface === 'ACL';
    }
}
`);

  const dict = {
    table: m.table,
    audited: m.name === 'tf_Tasks',
    duplicate_merge: true,
    fields: m.fields,
    relationships: m.relationships || {},
    indices: m.indices || [],
    optimistic_locking: true,
    unified_search: m.name === 'tf_Tasks',
  };
  put(`${dir}/vardefs.php`, `${HEADER}
$dictionary[${q(m.object)}] = ${php(dict)};

if (!class_exists('VardefManager')) {
    require_once 'include/SugarObjects/VardefManager.php';
}
VardefManager::createVardef(${q(m.name)}, ${q(m.object)}, ${php(m.templates)});
`);

  put(`${dir}/language/en_us.lang.php`, `${HEADER}
$mod_strings = ${php({
    LBL_MODULE_NAME: m.label,
    LBL_MODULE_TITLE: m.label,
    LBL_LIST_FORM_TITLE: m.label + ' List',
    LBL_NEW_FORM_TITLE: 'Create ' + m.single,
    LNK_NEW_RECORD: 'Create ' + m.single,
    LNK_LIST: 'View ' + m.label,
    LBL_SEARCH_FORM_TITLE: 'Search ' + m.label,
    LBL_HOMEPAGE_TITLE: 'My ' + m.label,
    LBL_ID: 'ID',
    LBL_NAME: m.name === 'tf_Notifications' ? 'Title' : 'Name',
    LBL_DESCRIPTION: m.name === 'tf_Comments' ? 'Comment' : m.name === 'tf_Notifications' ? 'Message' : 'Description',
    LBL_DATE_ENTERED: 'Date Created',
    LBL_DATE_MODIFIED: 'Date Modified',
    LBL_CREATED: 'Created By',
    LBL_MODIFIED: 'Modified By',
    LBL_ASSIGNED_TO_ID: 'Assigned User Id',
    LBL_ASSIGNED_TO_NAME: 'Assigned to',
    ...m.labels,
  })};
`);

  put(`${dir}/Menu.php`, `${HEADER}
global $mod_strings;
$module_menu = array();
if (ACLController::checkAccess(${q(m.name)}, 'edit', true)) {
    $module_menu[] = array('index.php?module=${m.name}&action=EditView&return_module=${m.name}&return_action=DetailView', $mod_strings['LNK_NEW_RECORD'], 'Create', ${q(m.name)});
}
if (ACLController::checkAccess(${q(m.name)}, 'list', true)) {
    $module_menu[] = array('index.php?module=${m.name}&action=index', $mod_strings['LNK_LIST'], 'List', ${q(m.name)});
}
`);

  const fieldLabel = (f) => {
    const def = m.fields[f];
    if (def) return def.vname;
    return { name: 'LBL_NAME', date_entered: 'LBL_DATE_ENTERED', assigned_user_name: 'LBL_ASSIGNED_TO_NAME', description: 'LBL_DESCRIPTION' }[f] || 'LBL_' + f.toUpperCase();
  };
  const listDefs = {};
  m.list.forEach((f, idx) => {
    const def = m.fields[f] || {};
    listDefs[f.toUpperCase()] = {
      label: fieldLabel(f), width: f === 'name' ? '30%' : '12%', default: true,
      ...(f === 'name' ? { link: true } : {}),
      ...(def.type === 'relate' ? { id: def.id_name.toUpperCase(), module: def.module, link: def.module !== 'Users', related_fields: [def.id_name] } : {}),
      ...(f === 'assigned_user_name' ? { module: 'Employees', id: 'ASSIGNED_USER_ID' } : {}),
      ...(idx === 0 && f !== 'name' ? {} : {}),
    };
  });
  put(`${dir}/metadata/listviewdefs.php`, `${HEADER}
$module_name = ${q(m.name)};
$listViewDefs[$module_name] = ${php(listDefs)};
`);

  const panel = m.detail.map((row) => row.map((f) => (f === '' ? '' : f === 'description' ? { name: 'description', label: 'LBL_DESCRIPTION' } : f)));
  const viewDef = (form) => ({
    templateMeta: { form, maxColumns: '2', widths: [{ label: '10', field: '30' }, { label: '10', field: '30' }] },
    panels: { default: panel },
  });
  const editPanel = m.detail.map((row) => row.filter((f) => f !== 'task_number').map((f) => (f === '' ? '' : f === 'description' ? { name: 'description', label: 'LBL_DESCRIPTION' } : f)));
  put(`${dir}/metadata/detailviewdefs.php`, `${HEADER}
$module_name = ${q(m.name)};
$viewdefs[$module_name]['DetailView'] = ${php(viewDef({ buttons: ['EDIT', 'DUPLICATE', 'DELETE'] }))};
`);
  put(`${dir}/metadata/editviewdefs.php`, `${HEADER}
$module_name = ${q(m.name)};
$viewdefs[$module_name]['EditView'] = ${php({ ...viewDef({}), panels: { default: editPanel } })};
`);
  put(`${dir}/metadata/searchdefs.php`, `${HEADER}
$module_name = ${q(m.name)};
$searchdefs[$module_name] = ${php({
    templateMeta: { maxColumns: '3', widths: { label: '10', field: '30' } },
    layout: {
      basic_search: ['name', ...(assignable ? [{ name: 'current_user_only', label: 'LBL_CURRENT_USER_FILTER', type: 'bool' }] : [])],
      advanced_search: ['name', ...m.list.filter((f) => m.fields[f] && m.fields[f].type === 'enum'), ...(assignable ? ['assigned_user_id'] : [])],
    },
  })};
`);
  put(`${dir}/metadata/SearchFields.php`, `${HEADER}
$module_name = ${q(m.name)};
$searchFields[$module_name] = ${php({
    name: { query_type: 'default' },
    current_user_only: { query_type: 'default', db_field: ['assigned_user_id'], my_items: true, vname: 'LBL_CURRENT_USER_FILTER', type: 'bool' },
    assigned_user_id: { query_type: 'default' },
    ...Object.fromEntries(m.list.filter((f) => m.fields[f] && m.fields[f].type === 'enum').map((f) => [f, { query_type: 'default' }])),
  })};
`);
  put(`${dir}/metadata/subpanels/default.php`, `${HEADER}
$module_name = ${q(m.name)};
$subpanel_layout = ${php({
    top_buttons: [{ widget_class: 'SubPanelTopCreateButton' }, { widget_class: 'SubPanelTopSelectButton', popup_module: m.name }],
    where: '',
    list_fields: {
      ...Object.fromEntries(
        m.list.filter((f) => !(m.fields[f] && m.fields[f].type === 'relate')).map((f) => [
          f,
          { vname: fieldLabel(f), width: f === 'name' ? '40%' : '15%', ...(f === 'name' ? { widget_class: 'SubPanelDetailViewLink' } : {}) },
        ]),
      ),
      edit_button: { vname: 'LBL_EDIT_BUTTON', widget_class: 'SubPanelEditButton', module: m.name, width: '4%' },
      remove_button: { vname: 'LBL_REMOVE', widget_class: 'SubPanelRemoveButton', module: m.name, width: '5%' },
    },
  })};
`);
  put(`${dir}/metadata/popupdefs.php`, `${HEADER}
$module_name = ${q(m.name)};
$popupMeta = ${php({
    moduleMain: m.name,
    varName: m.object,
    orderBy: `${m.table}.name`,
    whereClauses: { name: `${m.table}.name` },
    searchInputs: ['name'],
  })};
`);
  put(`${dir}/metadata/metafiles.php`, `${HEADER}
$module_name = ${q(m.name)};
$metafiles[$module_name] = ${php(Object.fromEntries(
    ['detailviewdefs', 'editviewdefs', 'listviewdefs', 'searchdefs', 'popupdefs', 'searchfields'].map((k) => [k, `modules/${m.name}/metadata/${k === 'searchfields' ? 'SearchFields' : k}.php`]),
  ))};
`);
  put(`${dir}/metadata/subpaneldefs.php`, `${HEADER}
$layout_defs[${q(m.name)}] = ${php({
    subpanel_setup: Object.fromEntries((m.subpanels || []).map((s, i) => [
      s.link,
      {
        order: 100 + i * 10, module: s.module, subpanel_name: 'default', sort_order: 'desc', sort_by: 'date_entered',
        title_key: s.title, get_subpanel_data: s.link, top_buttons: [{ widget_class: 'SubPanelTopButtonQuickCreate' }, { widget_class: 'SubPanelTopSelectButton', mode: 'MultiSelect' }],
      },
    ])),
  })};
`);
}

// Users extension
put('SugarModules/Ext/Vardefs/Users/taskflow.php', `${HEADER}
foreach (${php(USER_EXT.fields)} as $tfField => $tfDef) {
    $dictionary['User']['fields'][$tfField] = $tfDef;
}
foreach (${php(USER_EXT.relationships)} as $tfRel => $tfDef) {
    $dictionary['User']['relationships'][$tfRel] = $tfDef;
}
$dictionary['User']['indices'][] = array('name' => 'idx_users_tf_dept', 'type' => 'index', 'fields' => array('tf_department_id'));
$dictionary['User']['indices'][] = array('name' => 'idx_users_tf_role', 'type' => 'index', 'fields' => array('tf_role_id'));
`);
put('SugarModules/Ext/Language/Users/en_us.taskflow.php', `${HEADER}
foreach (${php(USER_EXT.labels)} as $k => $v) { $mod_strings[$k] = $v; }
`);

// Application language: module names + dropdowns
const appStrings = Object.fromEntries(MODULES.map((m) => [m.name, m.label]));
const appSingular = Object.fromEntries(MODULES.map((m) => [m.name, m.single]));
put('SugarModules/Ext/Language/application/en_us.taskflow.php', `${HEADER}
foreach (${php(appStrings)} as $k => $v) { $app_list_strings['moduleList'][$k] = $v; }
foreach (${php(appSingular)} as $k => $v) { $app_list_strings['moduleListSingular'][$k] = $v; }
${Object.entries(LISTS).map(([k, v]) => `$app_list_strings[${q(k)}] = ${php(v)};`).join('\n')}
`);

// manifest
const installdefs = {
  id: 'taskflow_task_manager',
  beans: MODULES.map((m) => ({ module: m.name, class: m.object, path: `modules/${m.name}/${m.name}.php`, tab: m.name !== 'tf_Notifications' && m.name !== 'tf_Comments' })),
  copy: [
    ...MODULES.map((m) => ({ from: `<basepath>/SugarModules/modules/${m.name}`, to: `modules/${m.name}` })),
    { from: '<basepath>/SugarModules/custom/modules/tf_Tasks/TaskflowHooks.php', to: 'custom/modules/tf_Tasks/TaskflowHooks.php' },
    { from: '<basepath>/SugarModules/custom/entryPoints/taskflow_auth.php', to: 'custom/outright_products/task_manager/entryPoints/taskflow_auth.php' },
  ],
  language: [
    { from: '<basepath>/SugarModules/Ext/Language/application/en_us.taskflow.php', to_module: 'application', language: 'en_us' },
    { from: '<basepath>/SugarModules/Ext/Language/Users/en_us.taskflow.php', to_module: 'Users', language: 'en_us' },
  ],
  vardefs: [{ from: '<basepath>/SugarModules/Ext/Vardefs/Users/taskflow.php', to_module: 'Users' }],
  logic_hooks: MODULES.filter((m) => m.hooks).flatMap((m) =>
    m.hooks.map((h) => ({ module: m.name, hook: h[0], order: h[1], description: h[2], file: h[3], class: h[4], function: h[5] })),
  ),
  entrypoints: [{ from: '<basepath>/SugarModules/Ext/EntryPointRegistry/taskflow_auth.php', to_module: 'application' }],
};
put('SugarModules/Ext/EntryPointRegistry/taskflow_auth.php', `${HEADER}
$entry_point_registry['taskflow_auth'] = array(
    'file' => 'custom/outright_products/task_manager/entryPoints/taskflow_auth.php',
    'auth' => false,
);
`);
put('manifest.php', `${HEADER}
$manifest = ${php({
  acceptable_sugar_versions: { regex_matches: ['6\\.5\\.*'] },
  acceptable_sugar_flavors: ['CE', 'PRO', 'ENT'],
  readme: '',
  key: 'tf',
  author: 'Outright Systems',
  description: 'Taskflow task manager: departments, roles, tasks, comments and notifications with relationships to Users.',
  icon: '',
  is_uninstallable: true,
  name: 'Taskflow Task Manager',
  published_date: new Date().toISOString().slice(0, 10),
  type: 'module',
  version: VERSION,
  remove_tables: 'prompt',
})};

$installdefs = ${php(installdefs)};
`);

// ---------- write ----------
fs.rmSync(OUT, { recursive: true, force: true });
for (const [p, content] of files) {
  const full = path.join(OUT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
// hand-written sources
const copyDir = (from, to) => {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); }
  }
};
copyDir(SRC, path.join(OUT, 'SugarModules'));

const zip = path.join(HERE, 'dist', 'taskflow_package.zip');
fs.rmSync(zip, { force: true });
try {
  if (process.platform === 'win32') {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${OUT}\\*' -DestinationPath '${zip}'"`, { stdio: 'pipe' });
  } else {
    execSync(`cd "${OUT}" && zip -qr "${zip}" .`, { stdio: 'pipe' });
  }
  console.log('Package zip:', path.relative(process.cwd(), zip));
} catch {
  console.log('Zip step skipped (no zip tool); install from the folder instead.');
}
console.log(`Wrote ${files.size} generated files to ${path.relative(process.cwd(), OUT)}`);
