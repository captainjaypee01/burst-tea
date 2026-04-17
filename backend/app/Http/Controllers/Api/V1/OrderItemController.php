<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Orders\AddOrderItemAction;
use App\Actions\Orders\DeleteOrderItemAction;
use App\Actions\Orders\UpdateOrderItemAction;
use App\DTOs\Orders\StoreOrderItemDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\StoreOrderItemRequest;
use App\Http\Requests\Api\V1\Orders\UpdateOrderItemRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;

class OrderItemController extends Controller
{
    public function store(StoreOrderItemRequest $request, Order $order, AddOrderItemAction $action): OrderResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $action->execute($user, $order, StoreOrderItemDTO::fromRequest($request));

        return new OrderResource($order->load(['items.variant.product', 'items.modifiers', 'user', 'customer']));
    }

    public function update(
        UpdateOrderItemRequest $request,
        Order $order,
        OrderItem $orderItem,
        UpdateOrderItemAction $action,
    ): OrderResource {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var array{quantity: int, notes?: string|null} $data */
        $data = $request->validated();

        $order = $action->execute(
            $user,
            $order,
            $orderItem,
            (int) $data['quantity'],
            $data['notes'] ?? null,
        );

        return new OrderResource($order->load(['items.variant.product', 'items.modifiers', 'user', 'customer']));
    }

    public function destroy(Request $request, Order $order, OrderItem $orderItem, DeleteOrderItemAction $action): OrderResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $action->execute($user, $order, $orderItem);

        return new OrderResource($order->load(['items.variant.product', 'items.modifiers', 'user', 'customer']));
    }
}
