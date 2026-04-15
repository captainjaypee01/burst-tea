<?php

namespace App\Actions\Orders;

use App\DTOs\Orders\StoreOrderDTO;
use App\Models\User;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Support\Facades\DB;

class StoreOrderAction
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function execute(User $user, StoreOrderDTO $dto): Order
    {
        return DB::transaction(function () use ($user, $dto) {
            return $this->orderService->createDraftOrder($user, $dto->customerId, $dto->items);
        });
    }
}
