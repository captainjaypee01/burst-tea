<?php

namespace App\Models;

use App\Enums\ShiftStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'status',
        'name',
        'opened_at',
        'closed_at',
        'opening_cash_cents',
        'closing_cash_cents',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ShiftStatus::class,
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_cash_cents' => 'integer',
            'closing_cash_cents' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<CashLedgerEntry, $this>
     */
    public function cashLedger(): HasMany
    {
        return $this->hasMany(CashLedgerEntry::class);
    }
}
