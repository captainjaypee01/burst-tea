<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Orders\AddOrderItemAction;
use App\DTOs\Orders\StoreOrderItemDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\StoreOrderItemRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;

class OrderItemController extends Controller
{
    public function store(StoreOrderItemRequest $request, Order $order, AddOrderItemAction $action): OrderResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $action->execute($user, $order, StoreOrderItemDTO::fromRequest($request));

        return new OrderResource($order->load(['items.variant.product', 'items.modifiers', 'user', 'customer']));
    }
}
