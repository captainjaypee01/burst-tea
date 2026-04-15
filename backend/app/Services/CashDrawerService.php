<?php

namespace App\Services;

use App\Enums\CashLedgerType;
use App\Models\CashLedgerEntry;
use App\Models\Order;
use App\Models\Shift;
use Illuminate\Support\Facades\DB;

class CashDrawerService
{
    public function recordSale(Shift $shift, Order $order, int $amountCents): void
    {
        DB::transaction(function () use ($shift, $order, $amountCents) {
            $entry = new CashLedgerEntry([
                'shift_id' => $shift->id,
                'type' => CashLedgerType::Sale,
                'amount_cents' => $amountCents,
                'reference_type' => Order::class,
                'reference_id' => $order->id,
                'notes' => 'Order '.$order->order_number,
            ]);
            $entry->save();
        });
    }

    public function recordExpense(Shift $shift, int $amountCents, ?string $referenceType = null, ?int $referenceId = null): void
    {
        DB::transaction(function () use ($shift, $amountCents, $referenceType, $referenceId) {
            $entry = new CashLedgerEntry([
                'shift_id' => $shift->id,
                'type' => CashLedgerType::Expense,
                'amount_cents' => -1 * abs($amountCents),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => 'Expense',
            ]);
            $entry->save();
        });
    }

    public function recordAdvance(Shift $shift, int $amountCents, ?string $referenceType = null, ?int $referenceId = null): void
    {
        DB::transaction(function () use ($shift, $amountCents, $referenceType, $referenceId) {
            $entry = new CashLedgerEntry([
                'shift_id' => $shift->id,
                'type' => CashLedgerType::Advance,
                'amount_cents' => -1 * abs($amountCents),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => 'Cash advance',
            ]);
            $entry->save();
        });
    }
}
