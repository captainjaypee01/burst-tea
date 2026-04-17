<?php

use App\Enums\CashLedgerType;
use App\Enums\OrderStatus;
use App\Enums\ShiftStatus;
use App\Models\CashLedgerEntry;
use App\Models\CashRegister;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shift;
use App\Models\User;
use App\Support\Permissions;
use Laravel\Sanctum\Sanctum;

function orderingAuthUser(array $permissions = []): User
{
    $user = User::factory()->create();
    foreach ($permissions as $permission) {
        $user->givePermissionTo($permission);
    }
    Sanctum::actingAs($user);

    return $user;
}

function makeCatalogLine(): array
{
    $cat = Category::query()->create([
        'name' => 'Drinks',
        'sort_order' => 0,
        'is_active' => true,
    ]);
    $product = Product::query()->create([
        'category_id' => $cat->id,
        'name' => 'Milk Tea',
        'is_active' => true,
    ]);
    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'name' => 'Regular',
        'price_cents' => 8500,
        'is_active' => true,
    ]);

    return [$product, $variant];
}

it('creates an order with line notes and updates an item', function (): void {
    orderingAuthUser([
        Permissions::ORDER_CREATE,
        Permissions::ORDER_READ,
        Permissions::ORDER_UPDATE,
    ]);
    [, $variant] = makeCatalogLine();

    $create = $this->postJson('/api/v1/orders', [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
                'notes' => 'Less sugar',
            ],
        ],
    ]);

    $create->assertOk()->assertJsonPath('data.items.0.notes', 'Less sugar');
    $orderId = (int) $create->json('data.id');
    $itemId = (int) $create->json('data.items.0.id');

    $patch = $this->patchJson("/api/v1/orders/{$orderId}/items/{$itemId}", [
        'quantity' => 2,
        'notes' => '50% sugar',
    ]);

    $patch->assertOk()
        ->assertJsonPath('data.items.0.quantity', 2)
        ->assertJsonPath('data.items.0.notes', '50% sugar');
});

it('deletes an order line', function (): void {
    orderingAuthUser([
        Permissions::ORDER_CREATE,
        Permissions::ORDER_UPDATE,
    ]);
    [, $variant] = makeCatalogLine();

    $create = $this->postJson('/api/v1/orders', [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
    ]);
    $orderId = (int) $create->json('data.id');
    $itemId = (int) $create->json('data.items.0.id');

    $this->deleteJson("/api/v1/orders/{$orderId}/items/{$itemId}")
        ->assertOk()
        ->assertJsonPath('data.items', []);
});

it('posts cash payment and records a cash ledger sale', function (): void {
    $user = orderingAuthUser([
        Permissions::ORDER_CREATE,
        Permissions::ORDER_READ,
        Permissions::PAYMENT_CREATE,
        Permissions::REGISTER_READ,
        Permissions::CASH_READ,
    ]);
    [, $variant] = makeCatalogLine();

    $register = CashRegister::query()->create([
        'name' => 'Front',
        'is_active' => true,
    ]);

    $shift = Shift::query()->create([
        'user_id' => $user->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1000,
    ]);

    $orderId = (int) $this->postJson('/api/v1/orders', [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
    ])->json('data.id');

    $pay = $this->postJson('/api/v1/payments', [
        'order_id' => $orderId,
        'method' => 'cash',
        'amount_cents' => 8500,
        'shift_id' => $shift->id,
    ]);

    $pay->assertOk()
        ->assertJsonPath('data.method', 'cash')
        ->assertJsonPath('data.shift_id', $shift->id);

    $entry = CashLedgerEntry::query()
        ->where('shift_id', $shift->id)
        ->where('type', CashLedgerType::Sale)
        ->first();
    expect($entry)->not->toBeNull();
    expect($entry->notes)->toContain('Cash');
});

it('cancels an open order with no payments', function (): void {
    orderingAuthUser([
        Permissions::ORDER_CREATE,
        Permissions::ORDER_READ,
        Permissions::ORDER_DELETE,
    ]);
    [, $variant] = makeCatalogLine();

    $orderId = (int) $this->postJson('/api/v1/orders', [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
    ])->json('data.id');

    $this->postJson("/api/v1/orders/{$orderId}/cancel")
        ->assertOk()
        ->assertJsonPath('data.status', OrderStatus::Cancelled->value);
});

it('requires e_wallet_provider for e_wallet payments', function (): void {
    orderingAuthUser([
        Permissions::ORDER_CREATE,
        Permissions::PAYMENT_CREATE,
        Permissions::REGISTER_READ,
        Permissions::CASH_READ,
    ]);
    [, $variant] = makeCatalogLine();

    $register = CashRegister::query()->create([
        'name' => 'Front',
        'is_active' => true,
    ]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1000,
    ]);

    $orderId = (int) $this->postJson('/api/v1/orders', [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
    ])->json('data.id');

    $this->postJson('/api/v1/payments', [
        'order_id' => $orderId,
        'method' => 'e_wallet',
        'amount_cents' => 8500,
        'shift_id' => $shift->id,
    ])->assertUnprocessable();

    $this->postJson('/api/v1/payments', [
        'order_id' => $orderId,
        'method' => 'e_wallet',
        'amount_cents' => 8500,
        'shift_id' => $shift->id,
        'e_wallet_provider' => 'maya',
    ])->assertOk()->assertJsonPath('data.e_wallet_provider', 'maya');
});

it('denies order item update without order update permission', function (): void {
    orderingAuthUser([Permissions::ORDER_CREATE]);
    [, $variant] = makeCatalogLine();

    $create = $this->postJson('/api/v1/orders', [
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
    ]);
    $orderId = (int) $create->json('data.id');
    $itemId = (int) $create->json('data.items.0.id');

    $this->patchJson("/api/v1/orders/{$orderId}/items/{$itemId}", [
        'quantity' => 2,
    ])->assertForbidden();
});
