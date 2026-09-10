<?php

namespace App\Mail;

use App\Models\Repair;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TechnicianStandbyMail extends Mailable
{
    use Queueable, SerializesModels;

    public Repair $repair;
    public User $technician;

    public function __construct(Repair $repair, User $technician)
    {
        $this->repair = $repair;
        $this->technician = $technician;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Standby Alert] New Repair In Queue: #{$this->repair->tracking_number} - {$this->repair->device_name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.technician_standby',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
