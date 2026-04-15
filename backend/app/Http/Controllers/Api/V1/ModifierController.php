<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Modifiers\StoreModifierRequest;
use App\Http\Requests\Api\V1\Modifiers\UpdateModifierRequest;
use App\Http\Resources\Api\V1\ModifierResource;
use App\Models\Modifier;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ModifierController extends Controller
{
    public function options(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_READ);

        $rows = Modifier::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'extra_price_cents']);

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_READ);

        $paginator = Modifier::query()->orderBy('name')->paginate($request->integer('per_page', 15));

        return ModifierResource::collection($paginator);
    }

    public function store(StoreModifierRequest $request): ModifierResource
    {
        $modifier = Modifier::query()->create($request->validated());

        return new ModifierResource($modifier);
    }

    public function show(Request $request, Modifier $modifier): ModifierResource
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_READ);

        return new ModifierResource($modifier);
    }

    public function update(UpdateModifierRequest $request, Modifier $modifier): ModifierResource
    {
        $modifier->fill($request->validated());
        $modifier->save();

        return new ModifierResource($modifier->fresh());
    }

    public function destroy(Request $request, Modifier $modifier): Response
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_DELETE);

        $modifier->delete();

        return response()->noContent();
    }
}
