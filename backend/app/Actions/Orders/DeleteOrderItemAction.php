<?php

namespace App\Actions\Orders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\OrderService;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;

class DeleteOrderItemAction
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function execute(User $user, Order $order, OrderItem $item): Order
    {
        if (! $user->hasPermission(Permissions::ORDER_UPDATE)) {
            abort(403);
        }

        if ($item->order_id !== $order->id) {
            abort(404);
        }

        return DB::transaction(function () use ($item) {
            return $this->orderService->removeOrderItem($item);
        });
    }
}
