<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'email',
        'phone',
        'currency',
        'currency_symbol',
        'address',
        'is_active',
    ];

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }
}
