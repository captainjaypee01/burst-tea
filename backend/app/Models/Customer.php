<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'outstanding_balance_cents',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'outstanding_balance_cents' => 'integer',
        ];
    }

    /**
     * @return HasMany<CreditLedgerEntry, $this>
     */
    public function creditLedger(): HasMany
    {
        return $this->hasMany(CreditLedgerEntry::class, 'customer_id');
    }
}
