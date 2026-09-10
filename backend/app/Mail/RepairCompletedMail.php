<?php

namespace App\Mail;

use App\Models\Repair;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RepairCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Repair $repair;

    public function __construct(Repair $repair)
    {
        $this->repair = $repair;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Congratulations! Your {$this->repair->device_name} (#{$this->repair->tracking_number}) has been fixed and is ready for collection",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.completed',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
