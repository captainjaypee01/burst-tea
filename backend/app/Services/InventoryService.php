<?php

namespace App\Services;

use App\Enums\InventoryLedgerType;
use App\Models\InventoryItem;
use App\Models\InventoryLedgerEntry;
use App\Models\Order;
use App\Models\Recipe;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Deduct inventory for a paid order based on recipe lines.
     */
    public function deductForOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $already = InventoryLedgerEntry::query()
                ->where('reference_type', Order::class)
                ->where('reference_id', $order->id)
                ->exists();

            if ($already) {
                return;
            }

            $order->load('items.variant.recipe.lines');

            foreach ($order->items as $item) {
                $variant = $item->variant;
                $recipe = $variant->recipe;

                if (! $recipe instanceof Recipe) {
                    continue;
                }

                foreach ($recipe->lines as $line) {
                    $qty = (float) $line->quantity * (float) $item->quantity;
                    $delta = -1 * abs($qty);

                    $inventoryItem = InventoryItem::query()->lockForUpdate()->findOrFail($line->inventory_item_id);

                    $ledger = new InventoryLedgerEntry([
                        'inventory_item_id' => $inventoryItem->id,
                        'type' => InventoryLedgerType::Out,
                        'quantity_delta' => $delta,
                        'reference_type' => Order::class,
                        'reference_id' => $order->id,
                        'notes' => 'Order '.$order->order_number,
                    ]);
                    $ledger->save();

                    $inventoryItem->quantity_on_hand = (float) $inventoryItem->quantity_on_hand + $delta;
                    $inventoryItem->save();
                }
            }
        });
    }
}
