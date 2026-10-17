<?php
/**
 * Loads the outright helper library (outright_retrieve, outright_find_relationship_name, ...)
 * used by the SmartGateway entry point. Recreated for the local install because the
 * original file was not part of the deployment archive.
 */
if (!defined('sugarEntry') || !sugarEntry) {
    die('Not A Valid Entry Point');
}

if (!function_exists('outright_retrieve')) {
    require_once 'custom/outright_utils/outright_final/outright_includes.php';
}
