<?php

namespace App\Actions\Orders;

use App\DTOs\Orders\StoreOrderItemDTO;
use App\Models\User;
use App\Models\Order;
use App\Services\OrderService;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;

class AddOrderItemAction
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function execute(User $user, Order $order, StoreOrderItemDTO $dto): Order
    {
        if (! $user->hasPermission(Permissions::ORDER_UPDATE)) {
            abort(403);
        }

        return DB::transaction(function () use ($order, $dto) {
            return $this->orderService->addLineItemToOrder($order, $dto->toLineArray());
        });
    }
}
