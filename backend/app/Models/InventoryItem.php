<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'unit',
        'quantity_on_hand',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'quantity_on_hand' => 'decimal:4',
        ];
    }

    /**
     * @return HasMany<InventoryLedgerEntry, $this>
     */
    public function ledger(): HasMany
    {
        return $this->hasMany(InventoryLedgerEntry::class, 'inventory_item_id');
    }
}
