<?php

namespace App\Console\Commands;

use App\Mail\TechnicianDailyUnfinishedRepairsMail;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDailyTechnicianRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'repairs:send-daily-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily 8:00 AM email reminders to technicians for all their assigned unfinished repair jobs';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Finding all active unfinished repairs assigned to technicians...');

        // Unfinished repairs (not Completed and not Cancelled)
        $unfinishedRepairs = Repair::active()
            ->whereNotNull('technician_id')
            ->with(['technician', 'client'])
            ->orderBy('due_date', 'asc')
            ->get();

        if ($unfinishedRepairs->isEmpty()) {
            $this->info('No unfinished repairs currently assigned. Daily reminder skipped.');
            return self::SUCCESS;
        }

        $groupedByTech = $unfinishedRepairs->groupBy('technician_id');
        $emailsSent = 0;
        $totalJobsReminded = 0;

        foreach ($groupedByTech as $techId => $repairs) {
            /** @var User|null $technician */
            $technician = User::find($techId);

            if (!$technician || empty($technician->email)) {
                $this->warn("Skipping technician ID {$techId}: User record or email not found.");
                continue;
            }

            try {
                Mail::to($technician->email)->send(
                    new TechnicianDailyUnfinishedRepairsMail($technician, $repairs)
                );

                $emailsSent++;
                $totalJobsReminded += $repairs->count();

                $this->info("Sent daily reminder to {$technician->name} ({$technician->email}) for {$repairs->count()} unfinished repairs.");
            } catch (\Throwable $e) {
                $this->error("Failed to send reminder to {$technician->email}: " . $e->getMessage());
                Log::error("Failed to send daily technician reminder: {$e->getMessage()}", [
                    'technician_id' => $techId,
                    'error' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->info("Completed daily reminders: {$emailsSent} technician(s) notified across {$totalJobsReminded} unfinished repair(s).");

        return self::SUCCESS;
    }
}
