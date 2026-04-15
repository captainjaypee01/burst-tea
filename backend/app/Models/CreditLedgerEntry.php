<?php

namespace App\Models;

use App\Enums\CreditLedgerType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditLedgerEntry extends Model
{
    protected $table = 'credit_ledger';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'customer_id',
        'type',
        'amount_cents',
        'reference_type',
        'reference_id',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => CreditLedgerType::class,
            'amount_cents' => 'integer',
            'reference_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
