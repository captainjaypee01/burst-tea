<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Orders\StoreOrderAction;
use App\DTOs\Orders\StoreOrderDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\StoreOrderRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Support\Permissions;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::ORDER_READ);

        $paginator = Order::query()
            ->with(['user', 'customer'])
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return OrderResource::collection($paginator);
    }

    public function store(StoreOrderRequest $request, StoreOrderAction $action): OrderResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $action->execute($user, StoreOrderDTO::fromRequest($request));

        return new OrderResource($order->load(['items.variant.product', 'items.modifiers', 'user', 'customer']));
    }

    public function show(Request $request, Order $order): OrderResource
    {
        $this->authorizePermission($request->user(), Permissions::ORDER_READ);

        return new OrderResource($order->load(['items.variant.product', 'items.modifiers', 'user', 'customer']));
    }
}
