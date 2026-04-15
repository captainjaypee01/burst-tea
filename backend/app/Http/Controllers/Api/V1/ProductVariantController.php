<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ProductVariants\StoreProductVariantRequest;
use App\Http\Requests\Api\V1\ProductVariants\UpdateProductVariantRequest;
use App\Http\Resources\Api\V1\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductVariantController extends Controller
{
    public function store(StoreProductVariantRequest $request, Product $product): ProductVariantResource
    {
        /** @var array{name: string, price_cents: int, sku?: string|null, is_active?: bool} $data */
        $data = $request->validated();

        $variant = ProductVariant::query()->create([
            'product_id' => $product->id,
            'name' => $data['name'],
            'price_cents' => $data['price_cents'],
            'sku' => $data['sku'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return new ProductVariantResource($variant);
    }

    public function update(UpdateProductVariantRequest $request, Product $product, ProductVariant $variant): ProductVariantResource
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        $variant->fill($request->validated());
        $variant->save();

        return new ProductVariantResource($variant->fresh());
    }

    public function destroy(Request $request, Product $product, ProductVariant $variant): Response
    {
        $this->authorizePermission($request->user(), Permissions::PRODUCT_UPDATE);

        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        $variant->delete();

        return response()->noContent();
    }
}
