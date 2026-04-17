<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Support\Permissions;
use Laravel\Sanctum\Sanctum;

function catalogAuthUser(array $permissions = []): User
{
    $user = User::factory()->create();
    foreach ($permissions as $permission) {
        $user->givePermissionTo($permission);
    }
    Sanctum::actingAs($user);

    return $user;
}

it('requires authentication for catalog endpoints', function (): void {
    $this->getJson('/api/v1/categories')->assertUnauthorized();
    $this->getJson('/api/v1/products')->assertUnauthorized();
});

it('denies category index without category read', function (): void {
    catalogAuthUser([]);
    $this->getJson('/api/v1/categories')->assertForbidden();
});

it('lists categories when permitted', function (): void {
    catalogAuthUser([Permissions::CATEGORY_READ]);
    Category::query()->create([
        'name' => 'Drinks',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/categories')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Drinks');
});

it('creates a category when permitted', function (): void {
    catalogAuthUser([Permissions::CATEGORY_CREATE]);

    $this->postJson('/api/v1/categories', [
        'name' => 'Snacks',
        'sort_order' => 1,
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Snacks');

    expect(Category::query()->where('name', 'Snacks')->exists())->toBeTrue();
});

it('denies product index without product read', function (): void {
    catalogAuthUser([]);
    $this->getJson('/api/v1/products')->assertForbidden();
});

it('filters products by category_id when permitted', function (): void {
    catalogAuthUser([Permissions::PRODUCT_READ]);
    $a = Category::query()->create(['name' => 'Cat A', 'sort_order' => 0, 'is_active' => true]);
    $b = Category::query()->create(['name' => 'Cat B', 'sort_order' => 1, 'is_active' => true]);
    $p1 = Product::query()->create(['category_id' => $a->id, 'name' => 'In A', 'is_active' => true]);
    Product::query()->create(['category_id' => $b->id, 'name' => 'In B', 'is_active' => true]);
    ProductVariant::query()->create([
        'product_id' => $p1->id,
        'name' => 'Std',
        'price_cents' => 100,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/products?category_id='.$a->id)
        ->assertOk()
        ->assertJsonPath('data.0.name', 'In A')
        ->assertJsonCount(1, 'data');
});

it('creates a product with embedded variants when permitted', function (): void {
    catalogAuthUser([Permissions::PRODUCT_CREATE]);
    $cat = Category::query()->create([
        'name' => 'Food',
        'sort_order' => 0,
        'is_active' => true,
    ]);

    $this->postJson('/api/v1/products', [
        'category_id' => $cat->id,
        'name' => 'Burger',
        'description' => 'Test',
        'is_active' => true,
        'variants' => [
            ['name' => 'Regular', 'price_cents' => 899, 'sku' => 'BRG-R', 'is_active' => true],
        ],
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Burger')
        ->assertJsonPath('data.variants.0.price_cents', 899);

    $product = Product::query()->where('name', 'Burger')->first();
    expect($product)->not->toBeNull();
    expect($product->variants()->count())->toBe(1);
});

it('soft deletes a product and cascades variants', function (): void {
    catalogAuthUser([Permissions::PRODUCT_CREATE, Permissions::PRODUCT_DELETE]);
    $product = Product::query()->create([
        'name' => 'To remove',
        'is_active' => true,
    ]);
    ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Only',
        'price_cents' => 100,
        'is_active' => true,
    ]);

    $this->deleteJson("/api/v1/products/{$product->id}")->assertNoContent();

    expect(Product::query()->whereKey($product->id)->exists())->toBeFalse();
    expect(Product::withTrashed()->whereKey($product->id)->exists())->toBeTrue();

    $variant = ProductVariant::withTrashed()->where('product_id', $product->id)->first();
    expect($variant)->not->toBeNull();
    expect($variant->trashed())->toBeTrue();
});

it('rejects product create with category id that is soft deleted', function (): void {
    catalogAuthUser([Permissions::PRODUCT_CREATE]);
    $cat = Category::query()->create([
        'name' => 'Gone',
        'sort_order' => 0,
        'is_active' => true,
    ]);
    $cat->delete();

    $this->postJson('/api/v1/products', [
        'category_id' => $cat->id,
        'name' => 'X',
        'variants' => [
            ['name' => 'V', 'price_cents' => 100],
        ],
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category_id']);
});
