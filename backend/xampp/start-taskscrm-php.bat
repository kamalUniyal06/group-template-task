@echo off
REM PHP 7.4 FastCGI worker for http://localhost/taskscrm (SugarCRM)
set PHP_FCGI_MAX_REQUESTS=0
set PHP_FCGI_CHILDREN=0
start "taskscrm-php74" /min "C:\xampp\php74\php-cgi.exe" -b 127.0.0.1:9074 -c "C:\xampp\php74\php.ini"
