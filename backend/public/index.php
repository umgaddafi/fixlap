<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// Support subfolder deployments (e.g. /fixlap/api in XAMPP/LAMPP)
if (isset($_SERVER['REQUEST_URI']) && str_starts_with($_SERVER['REQUEST_URI'], '/fixlap/api')) {
    $_SERVER['REQUEST_URI'] = substr($_SERVER['REQUEST_URI'], 7);
    $_SERVER['SCRIPT_NAME'] = '/index.php';
}

$app->handleRequest(Request::capture());
