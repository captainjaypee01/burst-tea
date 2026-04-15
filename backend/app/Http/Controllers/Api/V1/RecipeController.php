<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Recipes\UpsertRecipeRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Recipe;
use App\Models\RecipeLine;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RecipeController extends Controller
{
    public function upsert(UpsertRecipeRequest $request, Product $product, ProductVariant $variant): JsonResponse
    {
        if ($variant->product_id !== $product->id) {
            abort(404);
        }

        /** @var array{lines: array<int, array{inventory_item_id: int, quantity: float|int|string}>} $data */
        $data = $request->validated();

        DB::transaction(function () use ($variant, $data) {
            $recipe = Recipe::query()->firstOrCreate([
                'product_variant_id' => $variant->id,
            ]);

            $recipe->lines()->delete();

            foreach ($data['lines'] as $line) {
                RecipeLine::query()->create([
                    'recipe_id' => $recipe->id,
                    'inventory_item_id' => (int) $line['inventory_item_id'],
                    'quantity' => (float) $line['quantity'],
                ]);
            }
        });

        $recipe = Recipe::query()
            ->where('product_variant_id', $variant->id)
            ->with('lines.inventoryItem')
            ->firstOrFail();

        return response()->json([
            'data' => [
                'product_variant_id' => $variant->id,
                'lines' => $recipe->lines->map(fn (RecipeLine $line) => [
                    'inventory_item_id' => $line->inventory_item_id,
                    'quantity' => $line->quantity,
                ]),
            ],
        ]);
    }
}
