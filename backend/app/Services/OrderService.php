<?php

namespace App\Services;

use App\Enums\OrderPaymentStatus;
use App\Enums\OrderStatus;
use App\Models\User;
use App\Models\Modifier;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function generateOrderNumber(): string
    {
        do {
            $number = 'ORD-'.Str::upper(Str::random(12));
        } while (Order::query()->where('order_number', $number)->exists());

        return $number;
    }

    /**
     * @param  array<int, array{product_variant_id: int, quantity: int, modifier_ids?: list<int>}>  $lines
     * @return array{subtotal_cents: int, tax_cents: int, total_cents: int, lines: list<array<string, mixed>>}
     */
    public function buildLines(array $lines): array
    {
        $subtotal = 0;
        $built = [];

        foreach ($lines as $line) {
            $variant = ProductVariant::query()->with('product.modifiers')->findOrFail($line['product_variant_id']);
            $quantity = (int) $line['quantity'];
            $modifierIds = $line['modifier_ids'] ?? [];

            $allowedModifierIds = $variant->product->modifiers()->pluck('modifiers.id')->all();
            foreach ($modifierIds as $mid) {
                if (! in_array((int) $mid, array_map('intval', $allowedModifierIds), true)) {
                    throw ValidationException::withMessages([
                        'items' => ['One or more modifiers are not allowed for the selected product.'],
                    ]);
                }
            }

            $modifiers = Modifier::query()->whereIn('id', $modifierIds)->get();
            $extraPerUnit = (int) $modifiers->sum('extra_price_cents');
            $unitPrice = (int) $variant->price_cents + $extraPerUnit;
            $lineTotal = $unitPrice * $quantity;
            $subtotal += $lineTotal;

            $built[] = [
                'variant' => $variant,
                'quantity' => $quantity,
                'unit_price_cents' => $unitPrice,
                'line_total_cents' => $lineTotal,
                'modifiers' => $modifiers,
            ];
        }

        $tax = 0;
        $total = $subtotal + $tax;

        return [
            'subtotal_cents' => $subtotal,
            'tax_cents' => $tax,
            'total_cents' => $total,
            'lines' => $built,
        ];
    }

    /**
     * @param  array<int, array{product_variant_id: int, quantity: int, modifier_ids?: list<int>}>  $lines
     */
    public function createDraftOrder(User $user, ?int $customerId, array $lines): Order
    {
        $built = $this->buildLines($lines);

        $order = new Order;
        $order->order_number = $this->generateOrderNumber();
        $order->user_id = $user->id;
        $order->customer_id = $customerId;
        $order->status = OrderStatus::Open;
        $order->payment_status = OrderPaymentStatus::Pending;
        $order->subtotal_cents = $built['subtotal_cents'];
        $order->tax_cents = $built['tax_cents'];
        $order->total_cents = $built['total_cents'];
        $order->amount_paid_cents = 0;
        $order->is_credit = false;
        $order->save();

        foreach ($built['lines'] as $row) {
            /** @var ProductVariant $variant */
            $variant = $row['variant'];
            $item = new OrderItem([
                'order_id' => $order->id,
                'product_variant_id' => $variant->id,
                'quantity' => $row['quantity'],
                'unit_price_cents' => $row['unit_price_cents'],
                'line_total_cents' => $row['line_total_cents'],
            ]);
            $item->save();

            /** @var \Illuminate\Support\Collection<int, Modifier> $mods */
            $mods = $row['modifiers'];
            foreach ($mods as $mod) {
                $item->modifiers()->attach($mod->id, [
                    'extra_price_cents' => $mod->extra_price_cents,
                ]);
            }
        }

        return $order->fresh(['items.variant.product', 'items.modifiers']);
    }

    /**
     * @param  array{product_variant_id: int, quantity: int, modifier_ids?: list<int>}  $line
     */
    public function addLineItemToOrder(Order $order, array $line): Order
    {
        if ($order->status !== OrderStatus::Open) {
            throw ValidationException::withMessages([
                'order' => ['Only open orders can be modified.'],
            ]);
        }

        $built = $this->buildLines([$line]);
        $row = $built['lines'][0];

        /** @var ProductVariant $variant */
        $variant = $row['variant'];
        $item = new OrderItem([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => $row['quantity'],
            'unit_price_cents' => $row['unit_price_cents'],
            'line_total_cents' => $row['line_total_cents'],
        ]);
        $item->save();

        /** @var \Illuminate\Support\Collection<int, Modifier> $mods */
        $mods = $row['modifiers'];
        foreach ($mods as $mod) {
            $item->modifiers()->attach($mod->id, [
                'extra_price_cents' => $mod->extra_price_cents,
            ]);
        }

        $this->recalculateOrderTotals($order);

        return $order->fresh(['items.variant.product', 'items.modifiers']);
    }

    public function recalculateOrderTotals(Order $order): void
    {
        $subtotal = (int) $order->items()->sum('line_total_cents');
        $order->subtotal_cents = $subtotal;
        $order->total_cents = $subtotal + $order->tax_cents;
        $order->save();
    }
}
