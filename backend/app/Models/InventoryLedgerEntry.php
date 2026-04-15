<?php

namespace App\Models;

use App\Enums\InventoryLedgerType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLedgerEntry extends Model
{
    protected $table = 'inventory_ledger';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'inventory_item_id',
        'type',
        'quantity_delta',
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
            'type' => InventoryLedgerType::class,
            'quantity_delta' => 'decimal:4',
            'reference_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<InventoryItem, $this>
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }
}
