<?php
/**
 * Quick Repair & Rebuild + execute pending database changes, from the command line.
 *   php repair.php <sugar_root>
 */
if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}
$root = isset($argv[1]) ? $argv[1] : null;
if (!$root || !is_file("$root/config.php")) {
    exit("usage: php repair.php <sugar_root>\n");
}
chdir($root);
define('sugarEntry', true);
$_SERVER['REQUEST_METHOD'] = 'GET';
require_once 'include/entryPoint.php';
require_once 'modules/Administration/QuickRepairAndRebuild.php';

global $current_user, $mod_strings;
$current_user = BeanFactory::getBean('Users', '1');
$mod_strings = return_module_language('en_us', 'Administration');

$_REQUEST['execute'] = true;
$rac = new RepairAndClear();
ob_start();
$rac->repairAndClearAll(array('clearAll', 'repairDatabase'), array($mod_strings['LBL_ALL_MODULES']), true, false);
$out = ob_get_clean();

if (preg_match_all('/(ALTER TABLE|CREATE TABLE)[^;]*;/i', strip_tags($out), $m)) {
    echo "Applied:\n  " . implode("\n  ", array_map('trim', $m[0])) . "\n";
} else {
    echo "Database already in sync.\n";
}
echo "Repair complete.\n";
