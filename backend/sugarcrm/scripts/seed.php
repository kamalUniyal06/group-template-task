<?php
/**
 * Seeds Taskflow demo data: departments, roles, users (password demo1234), tasks and comments.
 * Safe to re-run: existing records (matched by name / user_name) are reused, not duplicated.
 *
 *   php seed.php <sugar_root>
 */
if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}
$root = isset($argv[1]) ? $argv[1] : null;
if (!$root || !is_file("$root/config.php")) {
    exit("usage: php seed.php <sugar_root>\n");
}
chdir($root);
define('sugarEntry', true);
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'include/entryPoint.php';

global $current_user, $db;
$current_user = BeanFactory::getBean('Users', '1');

const DEMO_PASSWORD = 'demo1234';

function find_id($table, $field, $value)
{
    global $db;
    $v = $db->quote($value);
    $row = $db->fetchByAssoc($db->query("SELECT id FROM {$table} WHERE {$field} = '{$v}' AND deleted = 0 LIMIT 1"));
    return $row ? $row['id'] : null;
}

function upsert($module, $table, $key, array $data)
{
    $id = find_id($table, $key, $data[$key]);
    $bean = $id ? BeanFactory::getBean($module, $id) : BeanFactory::newBean($module);
    foreach ($data as $k => $v) {
        $bean->$k = $v;
    }
    $bean->save(false);
    return $bean;
}

// Skip the first-login wizard for the admin account too.
if (!$current_user->getPreference('ut')) {
    $current_user->setPreference('ut', 1);
    $current_user->setPreference('timezone', 'Asia/Kolkata');
    $current_user->savePreferencesToDB();
}

// ---- Departments ----
$depts = array();
foreach (array(
    array('Leadership', '#14130f', 'Company head and cross-team leadership'),
    array('Operations', '#2f9bff', 'Vendors, onboarding, contracts'),
    array('Development', '#3ecf6e', 'Product engineering'),
    array('Design', '#ff4f7b', 'Brand, product and marketing design'),
    array('Marketing', '#ffc61a', 'Campaigns, content and newsletters'),
) as $d) {
    $depts[$d[0]] = upsert('tf_Departments', 'tf_departments', 'name', array('name' => $d[0], 'color' => $d[1], 'description' => $d[2]))->id;
}
echo 'Departments: ' . count($depts) . "\n";

// ---- Roles (name, level, view_all, view_team, assign_any, assign_team, review, delete_any) ----
$roles = array();
foreach (array(
    array('Company Head', 10, 1, 1, 1, 1, 1, 1),
    array('Manager', 20, 1, 1, 1, 1, 1, 0),
    array('Team Leader', 30, 0, 1, 0, 1, 1, 0),
    array('Senior', 40, 0, 0, 0, 0, 0, 0),
    array('Junior', 50, 0, 0, 0, 0, 0, 0),
    array('Intern', 60, 0, 0, 0, 0, 0, 0),
) as $r) {
    $roles[$r[0]] = upsert('tf_Roles', 'tf_roles', 'name', array(
        'name' => $r[0], 'level' => $r[1], 'can_view_all' => $r[2], 'can_view_team' => $r[3],
        'can_assign_any' => $r[4], 'can_assign_team' => $r[5], 'can_review' => $r[6], 'can_delete_any' => $r[7],
    ))->id;
}
echo 'Roles: ' . count($roles) . "\n";

// ---- Users ----
$users = array();
foreach (array(
    array('aarav', 'Aarav', 'Mehta', 'Company Head', 'Leadership'),
    array('neha', 'Neha', 'Kapoor', 'Manager', 'Operations'),
    array('rohan', 'Rohan', 'Verma', 'Team Leader', 'Development'),
    array('sana', 'Sana', 'Iqbal', 'Senior', 'Development'),
    array('kabir', 'Kabir', 'Singh', 'Junior', 'Development'),
    array('mira', 'Mira', 'Das', 'Intern', 'Design'),
    array('dev', 'Dev', 'Patel', 'Team Leader', 'Design'),
    array('isha', 'Isha', 'Rao', 'Senior', 'Design'),
    array('zoya', 'Zoya', 'Khan', 'Junior', 'Marketing'),
) as $u) {
    $id = find_id('users', 'user_name', $u[0]);
    $bean = $id ? BeanFactory::getBean('Users', $id) : BeanFactory::newBean('Users');
    $bean->user_name = $u[0];
    $bean->first_name = $u[1];
    $bean->last_name = $u[2];
    $bean->status = 'Active';
    $bean->employee_status = 'Active';
    $bean->is_admin = 0;
    $bean->title = $u[3];
    $bean->department = $u[4];
    $bean->tf_role_id = $roles[$u[3]];
    $bean->tf_department_id = $depts[$u[4]];
    $bean->email1 = $u[0] . '@taskflow.dev';
    if (!$id) {
        $bean->user_hash = User::getPasswordHash(DEMO_PASSWORD);
    }
    $bean->save(false);
    if (!$id) {
        $bean->setPreference('timezone', 'Asia/Kolkata');
        $bean->setPreference('ut', 1); // skip the first-login wizard
        $bean->savePreferencesToDB();
    }
    $users[$u[0]] = $bean->id;
}
echo 'Users: ' . count($users) . " (password: " . DEMO_PASSWORD . ")\n";

// ---- Tasks: title, dept, assignee, priority, status, due offset (days), hours, creator ----
$day = function ($n) {
    return date('Y-m-d', strtotime(($n >= 0 ? '+' : '') . $n . ' days'));
};
$tasks = array(
    array('Redesign checkout flow', 'Development', 'sana', 'urgent', 'prog', 1, 16, 'rohan', 'Simplify the checkout to two steps and add address autocomplete.'),
    array('API rate limiting', 'Development', 'kabir', 'high', 'review', 2, 10, 'rohan', 'Add per-key rate limits to the public API.'),
    array('Write release notes', 'Development', 'sana', 'low', 'done', -1, 3, 'rohan', ''),
    array('Fix login redirect bug', 'Development', 'kabir', 'high', 'blocked', -2, 5, 'rohan', 'Users land on a blank page after SSO login.'),
    array('Brand refresh moodboard', 'Design', 'mira', 'medium', 'prog', 3, 8, 'dev', ''),
    array('Icon set v2', 'Design', 'isha', 'medium', 'review', 1, 12, 'dev', 'Redraw the 40 core icons on the new grid.'),
    array('Landing page hero', 'Design', 'isha', 'high', 'todo', 5, 14, 'dev', ''),
    array('Q4 campaign brief', 'Marketing', 'zoya', 'high', 'todo', 2, 6, 'neha', ''),
    array('Newsletter draft', 'Marketing', 'zoya', 'low', 'done', -3, 2, 'neha', ''),
    array('Sprint planning deck', 'Development', 'rohan', 'medium', 'todo', 0, 4, 'neha', ''),
    array('Onboarding checklist', 'Operations', 'neha', 'medium', 'prog', 6, 5, 'aarav', ''),
    array('Vendor contract review', 'Operations', 'neha', 'urgent', 'review', -1, 7, 'aarav', 'Review the renewal terms before signing.'),
    array('Intern shadowing plan', 'Design', 'dev', 'low', 'todo', 7, 3, 'neha', ''),
    array('Performance audit', 'Development', 'sana', 'high', 'todo', 0, 9, 'rohan', 'Profile the dashboard and fix the slowest queries.'),
);
$taskIds = array();
foreach ($tasks as $t) {
    $id = find_id('tf_tasks', 'name', $t[0]);
    if ($id) {
        $taskIds[$t[0]] = $id;
        continue;
    }
    $bean = BeanFactory::newBean('tf_Tasks');
    $bean->name = $t[0];
    $bean->description = $t[8];
    $bean->tf_department_id = $depts[$t[1]];
    $bean->assigned_user_id = $users[$t[2]];
    $bean->priority = $t[3];
    $bean->status = $t[4];
    $bean->date_due = $day($t[5]);
    $bean->estimate_hours = $t[6];
    $bean->owner_id = $users[$t[7]];
    $bean->last_actor_id = $users[$t[7]];
    $bean->save(false);
    $taskIds[$t[0]] = $bean->id;
}
echo 'Tasks: ' . count($taskIds) . "\n";

// ---- Comments ----
$comments = array(
    array('API rate limiting', 'kabir', 'Limits are configurable per plan now. Ready for review.'),
    array('Fix login redirect bug', 'kabir', 'Blocked until the SSO provider fixes the callback URL.'),
    array('Fix login redirect bug', 'rohan', 'I have raised it with their support, will update here.'),
    array('Icon set v2', 'dev', 'Looks great, just check the stroke width on the small sizes.'),
);
$added = 0;
foreach ($comments as $c) {
    $taskId = $taskIds[$c[0]];
    $exists = $db->getOne("SELECT id FROM tf_comments WHERE tf_task_id = '" . $db->quote($taskId) . "' AND description = '" . $db->quote($c[2]) . "' AND deleted = 0");
    if ($exists) {
        continue;
    }
    $bean = BeanFactory::newBean('tf_Comments');
    $bean->name = substr($c[2], 0, 50);
    $bean->description = $c[2];
    $bean->tf_task_id = $taskId;
    $bean->author_id = $users[$c[1]];
    $bean->save(false);
    $added++;
}
echo "Comments added: {$added}\n";

$n = $db->getOne('SELECT COUNT(*) FROM tf_notifications WHERE deleted = 0');
echo "Notifications in system: {$n}\n";
