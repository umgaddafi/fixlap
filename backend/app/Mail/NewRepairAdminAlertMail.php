<?php

namespace App\Mail;

use App\Models\Repair;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewRepairAdminAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public Repair $repair;
    public ?User $admin;

    public function __construct(Repair $repair, ?User $admin = null)
    {
        $this->repair = $repair;
        $this->admin = $admin;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Action Required] New Repair Request: #{$this->repair->tracking_number} - {$this->repair->device_name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.admin_new_repair',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
