<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\InventoryLedgerEntryResource;
use App\Models\InventoryLedgerEntry;
use App\Support\Permissions;
use Illuminate\Http\Request;

class InventoryLedgerController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::INVENTORY_READ);

        $query = InventoryLedgerEntry::query()->with('inventoryItem')->orderByDesc('id');

        if ($request->filled('inventory_item_id')) {
            $query->where('inventory_item_id', $request->integer('inventory_item_id'));
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        return InventoryLedgerEntryResource::collection($paginator);
    }
}
