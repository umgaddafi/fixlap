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

class TechnicianRepairMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public Repair $repair;
    public Message $chatMessage;
    public User $technician;

    public function __construct(Repair $repair, Message $chatMessage, User $technician)
    {
        $this->repair = $repair;
        $this->chatMessage = $chatMessage;
        $this->technician = $technician;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Client Reply on Repair #{$this->repair->tracking_number} from {$this->chatMessage->author_name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.repairs.technician_new_message',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
