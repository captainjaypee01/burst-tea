<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\InventoryItems\StoreInventoryItemRequest;
use App\Http\Requests\Api\V1\InventoryItems\UpdateInventoryItemRequest;
use App\Http\Resources\Api\V1\InventoryItemResource;
use App\Models\InventoryItem;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InventoryItemController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::INVENTORY_READ);

        $paginator = InventoryItem::query()->orderBy('name')->paginate($request->integer('per_page', 15));

        return InventoryItemResource::collection($paginator);
    }

    public function store(StoreInventoryItemRequest $request): InventoryItemResource
    {
        $item = InventoryItem::query()->create($request->validated());

        return new InventoryItemResource($item);
    }

    public function show(Request $request, InventoryItem $inventoryItem): InventoryItemResource
    {
        $this->authorizePermission($request->user(), Permissions::INVENTORY_READ);

        return new InventoryItemResource($inventoryItem);
    }

    public function update(UpdateInventoryItemRequest $request, InventoryItem $inventoryItem): InventoryItemResource
    {
        $inventoryItem->fill($request->validated());
        $inventoryItem->save();

        return new InventoryItemResource($inventoryItem->fresh());
    }

    public function destroy(Request $request, InventoryItem $inventoryItem): Response
    {
        $this->authorizePermission($request->user(), Permissions::INVENTORY_WRITE);

        $inventoryItem->delete();

        return response()->noContent();
    }
}
