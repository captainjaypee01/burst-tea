<?php

namespace App\Services;

use App\Enums\CreditLedgerType;
use App\Models\CreditLedgerEntry;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class CreditLedgerService
{
    public function chargeForOrder(Order $order): void
    {
        if (! $order->customer_id) {
            return;
        }

        DB::transaction(function () use ($order) {
            $exists = CreditLedgerEntry::query()
                ->where('reference_type', Order::class)
                ->where('reference_id', $order->id)
                ->where('type', CreditLedgerType::Charge)
                ->exists();

            if ($exists) {
                return;
            }

            $customer = Customer::query()->lockForUpdate()->findOrFail($order->customer_id);

            $entry = new CreditLedgerEntry([
                'customer_id' => $customer->id,
                'type' => CreditLedgerType::Charge,
                'amount_cents' => $order->total_cents,
                'reference_type' => Order::class,
                'reference_id' => $order->id,
                'notes' => 'Order '.$order->order_number,
            ]);
            $entry->save();

            $customer->outstanding_balance_cents = (int) $customer->outstanding_balance_cents + (int) $order->total_cents;
            $customer->save();
        });
    }

    public function recordPayment(Customer $customer, int $amountCents, ?string $referenceType = null, ?int $referenceId = null): void
    {
        DB::transaction(function () use ($customer, $amountCents, $referenceType, $referenceId) {
            $locked = Customer::query()->lockForUpdate()->findOrFail($customer->id);

            $entry = new CreditLedgerEntry([
                'customer_id' => $locked->id,
                'type' => CreditLedgerType::Payment,
                'amount_cents' => $amountCents,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => 'Payment',
            ]);
            $entry->save();

            $locked->outstanding_balance_cents = max(0, (int) $locked->outstanding_balance_cents - $amountCents);
            $locked->save();
        });
    }
}
