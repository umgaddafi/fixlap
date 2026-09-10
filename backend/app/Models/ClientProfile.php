<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'address',
        'city',
        'state',
        'preferred_contact_method',
        'notify_sms',
        'notify_email',
        'notify_whatsapp',
    ];

    protected $casts = [
        'notify_sms' => 'boolean',
        'notify_email' => 'boolean',
        'notify_whatsapp' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
