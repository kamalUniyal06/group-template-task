<?php
/**
 * Installs (or re-installs) the Taskflow package into a SugarCRM 6.5 instance from the command line,
 * then runs Quick Repair & Rebuild so tables, columns and relationships are created.
 *
 *   php install_package.php <sugar_root> <unzipped_package_dir>
 *
 * Same result as Admin > Module Loader > Upload taskflow_package.zip > Install.
 */
if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}
list(, $root, $pkg) = $argv + array(null, null, null);
if (!$root || !$pkg || !is_file("$pkg/manifest.php")) {
    exit("usage: php install_package.php <sugar_root> <package_dir>\n");
}
$pkg = realpath($pkg);
chdir($root);

define('sugarEntry', true);
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'include/entryPoint.php';
require_once 'ModuleInstall/ModuleInstaller.php';
require_once 'modules/Administration/QuickRepairAndRebuild.php';

global $current_user, $mod_strings;
$current_user = BeanFactory::getBean('Users', '1');
$GLOBALS['current_user'] = $current_user;
$mod_strings = return_module_language('en_us', 'Administration');

echo "Installing package from $pkg\n";
$mi = new ModuleInstaller();
$mi->silent = true;
$mi->install($pkg);

echo "Running Quick Repair & Rebuild...\n";
$rac = new RepairAndClear();
ob_start();
$rac->repairAndClearAll(array('clearAll'), array($mod_strings['LBL_ALL_MODULES']), true, false);
ob_end_clean();

// Make sure every table/column from the vardefs exists (repairDatabase with execute).
ob_start();
$_REQUEST['execute'] = true;
$rac->show_output = false;
$rac->repairDatabase();
ob_end_clean();

// Second pass in a fresh process: the Users vardef extension only takes effect once caches are rebuilt.
$ini = php_ini_loaded_file();
passthru(escapeshellarg(PHP_BINARY) . ($ini ? ' -c ' . escapeshellarg($ini) : '') . ' '
    . escapeshellarg(__DIR__ . '/repair.php') . ' ' . escapeshellarg(getcwd()));

foreach (array('tf_departments', 'tf_roles', 'tf_tasks', 'tf_comments', 'tf_notifications') as $t) {
    echo str_pad($t, 20) . ($GLOBALS['db']->tableExists($t) ? "ok\n" : "MISSING\n");
}
$cols = $GLOBALS['db']->get_columns('users');
echo str_pad('users.tf_role_id', 20) . (isset($cols['tf_role_id']) ? "ok\n" : "MISSING\n");
echo "Done.\n";
