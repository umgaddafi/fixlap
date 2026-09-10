<?php

namespace App\Mail;

use App\Models\Repair;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RepairSubmittedMail extends Mailable
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
            subject: "Kendat FixLap Repair Request Confirmation: #{$this->repair->tracking_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.submitted',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
