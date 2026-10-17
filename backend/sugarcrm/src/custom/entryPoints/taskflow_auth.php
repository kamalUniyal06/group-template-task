<?php
/**
 * Taskflow login endpoint.
 *   POST index.php?entryPoint=taskflow_auth   {"user_name": "...", "password": "..."}
 * Verifies the SugarCRM user's password and returns the user with their Taskflow role
 * (permission flags) and department, which the React app uses for role-based views.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Api-Token');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
if (!defined('sugarEntry') || !sugarEntry) {
    die('Not A Valid Entry Point');
}

function taskflow_auth_reply($code, array $body)
{
    http_response_code($code);
    echo json_encode($body);
    sugar_cleanup(true);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}
$userName = isset($input['user_name']) ? trim((string) $input['user_name']) : '';
$password = isset($input['password']) ? (string) $input['password'] : '';

if ($userName === '' || $password === '') {
    taskflow_auth_reply(422, array('success' => false, 'error' => 'Username and password are required.'));
}

global $db;
$safe = $db->quote($userName);
$row = $db->fetchByAssoc($db->query(
    "SELECT id, user_hash, status FROM users WHERE user_name = '{$safe}' AND deleted = 0 LIMIT 1"
));

// Same message for unknown user and wrong password so usernames can't be probed.
if (empty($row) || !User::checkPassword($password, $row['user_hash'])) {
    taskflow_auth_reply(401, array('success' => false, 'error' => 'Wrong username or password.'));
}
if ($row['status'] !== 'Active') {
    taskflow_auth_reply(403, array('success' => false, 'error' => 'This account is inactive.'));
}

$user = BeanFactory::getBean('Users', $row['id']);
$role = !empty($user->tf_role_id) ? BeanFactory::getBean('tf_Roles', $user->tf_role_id) : null;
$dept = !empty($user->tf_department_id) ? BeanFactory::getBean('tf_Departments', $user->tf_department_id) : null;

$flags = array('can_view_all', 'can_view_team', 'can_assign_any', 'can_assign_team', 'can_review', 'can_delete_any');
$roleOut = null;
if ($role && !empty($role->id)) {
    $roleOut = array('id' => $role->id, 'name' => $role->name, 'level' => (int) $role->level);
    foreach ($flags as $f) {
        $roleOut[$f] = (bool) $role->$f;
    }
}

taskflow_auth_reply(200, array(
    'success' => true,
    'user' => array(
        'id' => $user->id,
        'user_name' => $user->user_name,
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
        'email' => $user->email1,
        'is_admin' => (bool) $user->is_admin,
        'tf_role_id' => $user->tf_role_id,
        'tf_department_id' => $user->tf_department_id,
    ),
    'role' => $roleOut,
    'department' => $dept && !empty($dept->id) ? array('id' => $dept->id, 'name' => $dept->name) : null,
));
