<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Products\StoreProductRequest;
use App\Http\Requests\Api\V1\Products\UpdateProductRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function options(Request $request): AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_READ);

        $products = Product::query()
            ->with(['variants', 'category'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return ProductResource::collection($products);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_READ);

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
        ]);

        $query = Product::query()
            ->with(['variants', 'modifiers', 'category'])
            ->orderBy('name');

        if (isset($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        $perPage = $validated['per_page'] ?? $request->integer('per_page', 15);
        $paginator = $query->paginate($perPage);

        return ProductResource::collection($paginator);
    }

    public function store(StoreProductRequest $request): ProductResource
    {
        /** @var array{category_id?: int|null, name: string, description?: string|null, is_active?: bool, modifier_ids?: list<int>, variants: array<int, array{name: string, price_cents: int, sku?: string|null, is_active?: bool}>} $data */
        $data = $request->validated();

        $product = DB::transaction(function () use ($data) {
            $product = Product::query()->create([
                'category_id' => $data['category_id'] ?? null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (isset($data['modifier_ids'])) {
                $product->modifiers()->sync($data['modifier_ids']);
            }

            foreach ($data['variants'] as $variant) {
                ProductVariant::query()->create([
                    'product_id' => $product->id,
                    'name' => $variant['name'],
                    'price_cents' => $variant['price_cents'],
                    'sku' => $variant['sku'] ?? null,
                    'is_active' => $variant['is_active'] ?? true,
                ]);
            }

            return $product->fresh(['variants', 'modifiers', 'category']);
        });

        return new ProductResource($product);
    }

    public function show(Request $request, Product $product): ProductResource
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_READ);

        return new ProductResource($product->load(['variants', 'modifiers', 'category']));
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->fill($request->validated());
        $product->save();

        if ($request->has('modifier_ids')) {
            /** @var list<int> $ids */
            $ids = $request->input('modifier_ids', []);
            $product->modifiers()->sync($ids);
        }

        return new ProductResource($product->fresh(['variants', 'modifiers', 'category']));
    }

    public function destroy(Request $request, Product $product): Response
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_DELETE);

        $product->delete();

        return response()->noContent();
    }
}
