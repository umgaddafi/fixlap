<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class TechnicianDailyUnfinishedRepairsMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $technician;
    public Collection $repairs;

    public function __construct(User $technician, Collection $repairs)
    {
        $this->technician = $technician;
        $this->repairs = $repairs;
    }

    public function envelope(): Envelope
    {
        $count = $this->repairs->count();
        $date = now()->format('D, j M Y');

        return new Envelope(
            subject: "FixLap Morning Digest: {$count} Unfinished Repair" . ($count === 1 ? '' : 's') . " Assigned to You ({$date})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.technician_daily_unfinished',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
