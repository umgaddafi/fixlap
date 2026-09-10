<?php

namespace App\Mail;

use App\Models\Message;
use App\Models\Repair;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientRepairMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public Repair $repair;
    public Message $chatMessage;
    public ?User $sender;

    public function __construct(Repair $repair, Message $chatMessage, ?User $sender = null)
    {
        $this->repair = $repair;
        $this->chatMessage = $chatMessage;
        $this->sender = $sender;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Message regarding your Repair #{$this->repair->tracking_number} ({$this->repair->device_name})",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.client_new_message',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
