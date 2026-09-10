<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Repair extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tracking_number',
        'branch_id',
        'client_id',
        'technician_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'device_category',
        'device_name',
        'serial_or_imei',
        'reported_issue',
        'diagnostic_notes',
        'status',
        'priority',
        'stage_index',
        'due_date',
        'appointment_time',
        'estimate_amount',
        'final_amount',
        'is_paid',
        'dropoff_date',
        'completed_at',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'dropoff_date' => 'datetime',
        'completed_at' => 'datetime',
        'estimate_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'is_paid' => 'boolean',
        'stage_index' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function timelineEvents(): HasMany
    {
        return $this->hasMany(RepairTimelineEvent::class)->orderBy('created_at', 'asc');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(RepairNote::class)->orderBy('created_at', 'desc');
    }

    public function partsUsed(): HasMany
    {
        return $this->hasMany(RepairPartUsed::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Scopes for fast dashboard queries
    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['Completed', 'Cancelled']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'Completed');
    }
}
