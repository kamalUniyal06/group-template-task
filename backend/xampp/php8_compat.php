<?php
/**
 * PHP 8 compatibility shims for SugarCRM CE 6.5.
 * Re-creates functions that were removed from PHP so legacy code keeps working.
 * Every shim is guarded, so this file is harmless on PHP 7.
 */

if (!function_exists('create_function')) {
    function create_function($args, $code)
    {
        return eval('return function(' . $args . ') {' . $code . '};');
    }
}

if (!function_exists('get_magic_quotes_gpc')) {
    function get_magic_quotes_gpc()
    {
        return false;
    }
}

if (!function_exists('get_magic_quotes_runtime')) {
    function get_magic_quotes_runtime()
    {
        return false;
    }
}

if (!function_exists('set_magic_quotes_runtime')) {
    function set_magic_quotes_runtime($value)
    {
        return true;
    }
}

if (!function_exists('each')) {
    function each(&$array)
    {
        $key = key($array);
        if ($key === null) {
            return false;
        }
        $value = current($array);
        next($array);
        return array(1 => $value, 'value' => $value, 0 => $key, 'key' => $key);
    }
}

if (!function_exists('split')) {
    function split($pattern, $string, $limit = -1)
    {
        return preg_split('/' . str_replace('/', '\/', $pattern) . '/', $string, $limit);
    }
}

if (!function_exists('eregi')) {
    function eregi($pattern, $string, &$regs = null)
    {
        return preg_match('/' . str_replace('/', '\/', $pattern) . '/i', $string, $regs);
    }
}
