<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairTimelineEvent extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'repair_id',
        'user_id',
        'from_status',
        'to_status',
        'event_description',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function repair(): BelongsTo
    {
        return $this->belongsTo(Repair::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
