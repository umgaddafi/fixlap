<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily 8:00 AM morning reminder for unfinished repairs assigned to technicians
Schedule::command('repairs:send-daily-reminders')->dailyAt('08:00');

