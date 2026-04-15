<?php

namespace App\Models;

use App\Enums\CashLedgerType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashLedgerEntry extends Model
{
    protected $table = 'cash_ledger';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'shift_id',
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
            'type' => CashLedgerType::class,
            'amount_cents' => 'integer',
            'reference_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Shift, $this>
     */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
