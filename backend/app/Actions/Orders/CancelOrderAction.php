<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Validation\ValidationException;

class CancelOrderAction
{
    public function execute(User $user, Order $order): Order
    {
        if (! $user->hasPermission(Permissions::ORDER_DELETE)) {
            abort(403);
        }

        if ($order->status !== OrderStatus::Open) {
            throw ValidationException::withMessages([
                'order' => ['Only open orders can be cancelled.'],
            ]);
        }

        if ($order->amount_paid_cents > 0) {
            throw ValidationException::withMessages([
                'order' => ['Cannot cancel an order that has recorded payments.'],
            ]);
        }

        $order->status = OrderStatus::Cancelled;
        $order->save();

        return $order->fresh(['items.variant.product', 'items.modifiers', 'user', 'customer']);
    }
}
