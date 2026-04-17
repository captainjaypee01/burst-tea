<?php

use App\Enums\CashLedgerType;
use App\Enums\ShiftStatus;
use App\Models\CashRegister;
use App\Models\CashLedgerEntry;
use App\Models\Shift;
use App\Models\User;
use App\Support\Permissions;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

function makeCashRegister(string $name = 'Register A'): CashRegister
{
    return CashRegister::query()->create([
        'name' => $name,
        'is_active' => true,
    ]);
}

function authenticateWithPermissions(array $permissions = []): User
{
    $user = User::factory()->create();
    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
        $user->givePermissionTo($permission);
    }

    Sanctum::actingAs($user);

    return $user;
}

it('requires authentication for shift session endpoints', function (): void {
    $register = makeCashRegister();
    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1200,
    ]);

    $this->getJson("/api/v1/shifts/current?cash_register_id={$register->id}")->assertUnauthorized();
    $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $register->id,
        'opening_cash_cents' => 1200,
    ])->assertUnauthorized();
    $this->postJson("/api/v1/shifts/{$shift->id}/close", ['closing_cash_cents' => 1300])->assertUnauthorized();
    $this->getJson("/api/v1/shifts/{$shift->id}/cash-ledger")->assertUnauthorized();
    $this->postJson("/api/v1/shifts/{$shift->id}/cash-adjustment", [
        'delta_cents' => 100,
    ])->assertUnauthorized();
});

it('returns current shift payload or null for a register', function (): void {
    $register = makeCashRegister();

    authenticateWithPermissions([Permissions::CASH_READ, Permissions::REGISTER_READ]);

    $this->getJson("/api/v1/shifts/current?cash_register_id={$register->id}")
        ->assertOk()
        ->assertExactJson(['data' => null]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 3200,
    ]);

    $this->getJson("/api/v1/shifts/current?cash_register_id={$register->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $shift->id)
        ->assertJsonPath('data.status', ShiftStatus::Open->value)
        ->assertJsonPath('data.cash_register_id', $register->id);
});

it('denies shift and ledger actions without permissions', function (): void {
    $register = makeCashRegister();

    authenticateWithPermissions();

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1500,
    ]);

    $this->getJson("/api/v1/shifts/current?cash_register_id={$register->id}")->assertForbidden();
    $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $register->id,
        'opening_cash_cents' => 1200,
    ])->assertForbidden();
    $this->postJson("/api/v1/shifts/{$shift->id}/close", ['closing_cash_cents' => 1400])->assertForbidden();
    $this->getJson("/api/v1/shifts/{$shift->id}/cash-ledger")->assertForbidden();
});

it('opens a shift and writes opening ledger entry', function (): void {
    $register = makeCashRegister();
    $user = authenticateWithPermissions([Permissions::SHIFT_OPEN, Permissions::REGISTER_READ]);

    $response = $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $register->id,
        'opening_cash_cents' => 5000,
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.status', ShiftStatus::Open->value)
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.cash_register_id', $register->id)
        ->assertJsonPath('data.opening_cash_cents', 5000);

    $shiftId = (int) $response->json('data.id');

    expect(
        CashLedgerEntry::query()
            ->where('shift_id', $shiftId)
            ->where('type', CashLedgerType::Opening)
            ->where('amount_cents', 5000)
            ->exists()
    )->toBeTrue();
});

it('validates open shift payload', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::SHIFT_OPEN, Permissions::REGISTER_READ]);

    $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $register->id,
        'opening_cash_cents' => -1,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['opening_cash_cents']);
});

it('rejects opening when another shift is already open on the same register', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::SHIFT_OPEN, Permissions::REGISTER_READ]);

    Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 900,
    ]);

    $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $register->id,
        'opening_cash_cents' => 1000,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['shift']);
});

it('rejects opening a second register while the same user has an open shift elsewhere', function (): void {
    $r1 = makeCashRegister('R1');
    $r2 = makeCashRegister('R2');
    $user = authenticateWithPermissions([Permissions::SHIFT_OPEN, Permissions::REGISTER_READ]);

    $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $r1->id,
        'opening_cash_cents' => 100,
    ])->assertOk();

    $this->postJson('/api/v1/shifts/open', [
        'cash_register_id' => $r2->id,
        'opening_cash_cents' => 200,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['cash_register_id']);

    expect(Shift::query()->where('user_id', $user->id)->where('status', ShiftStatus::Open)->count())->toBe(1);
});

it('closes an open shift and records closed by user', function (): void {
    $register = makeCashRegister();
    $user = authenticateWithPermissions([Permissions::SHIFT_CLOSE]);

    $shift = Shift::query()->create([
        'user_id' => $user->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now()->subHour(),
        'opening_cash_cents' => 1000,
    ]);

    $response = $this->postJson("/api/v1/shifts/{$shift->id}/close", [
        'closing_cash_cents' => 2800,
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $shift->id)
        ->assertJsonPath('data.status', ShiftStatus::Closed->value)
        ->assertJsonPath('data.closing_cash_cents', 2800)
        ->assertJsonPath('data.closed_by_user_id', $user->id);

    expect(
        CashLedgerEntry::query()
            ->where('shift_id', $shift->id)
            ->where('type', CashLedgerType::Closing)
            ->where('amount_cents', 2800)
            ->exists()
    )->toBeTrue();
});

it('validates close shift payload', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::SHIFT_CLOSE]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1200,
    ]);

    $this->postJson("/api/v1/shifts/{$shift->id}/close", [
        'closing_cash_cents' => -10,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['closing_cash_cents']);
});

it('rejects closing an already closed shift', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::SHIFT_CLOSE]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Closed,
        'opened_at' => now()->subHours(2),
        'closed_at' => now()->subHour(),
        'opening_cash_cents' => 1200,
        'closing_cash_cents' => 1300,
    ]);

    $this->postJson("/api/v1/shifts/{$shift->id}/close", [
        'closing_cash_cents' => 1400,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['shift']);
});

it('returns cash ledger in paginated resource format', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::CASH_READ]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 3000,
    ]);

    CashLedgerEntry::query()->create([
        'shift_id' => $shift->id,
        'type' => CashLedgerType::Opening,
        'amount_cents' => 3000,
        'notes' => 'Opening float',
    ]);
    CashLedgerEntry::query()->create([
        'shift_id' => $shift->id,
        'type' => CashLedgerType::Sale,
        'amount_cents' => 4500,
        'notes' => 'Sale',
    ]);

    $this->getJson("/api/v1/shifts/{$shift->id}/cash-ledger?per_page=1")
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'shift_id',
                    'type',
                    'amount_cents',
                    'reference_type',
                    'reference_id',
                    'notes',
                    'created_at',
                ],
            ],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            'links' => ['first', 'last', 'prev', 'next'],
        ])
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 2);
});

it('records a cash count adjustment on an open shift', function (): void {
    $register = makeCashRegister();
    $user = authenticateWithPermissions([Permissions::CASH_ADJUST]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1000,
    ]);

    $this->postJson("/api/v1/shifts/{$shift->id}/cash-adjustment", [
        'delta_cents' => -250,
        'reason' => 'Till correction',
    ])
        ->assertNoContent();

    $entry = CashLedgerEntry::query()
        ->where('shift_id', $shift->id)
        ->where('type', CashLedgerType::Adjustment)
        ->where('amount_cents', -250)
        ->where('reference_type', User::class)
        ->where('reference_id', $user->id)
        ->first();

    expect($entry)->not->toBeNull();
    expect($entry->notes)->toContain('Till correction');
});

it('validates cash adjustment requires a reason', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::CASH_ADJUST]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1000,
    ]);

    $this->postJson("/api/v1/shifts/{$shift->id}/cash-adjustment", [
        'delta_cents' => 100,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['reason']);
});

it('allows managers to manage cash registers', function (): void {
    authenticateWithPermissions([Permissions::REGISTER_MANAGE, Permissions::REGISTER_READ]);

    $this->postJson('/api/v1/cash-registers', ['name' => 'Custom lane'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Custom lane');

    $this->getJson('/api/v1/cash-registers/options')->assertOk();
});

it('denies cash adjustment without permission', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::SHIFT_OPEN, Permissions::REGISTER_READ]);

    $shift = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 1000,
    ]);

    $this->postJson("/api/v1/shifts/{$shift->id}/cash-adjustment", [
        'delta_cents' => 50,
    ])->assertForbidden();
});

it('requires authentication for cash register shift history', function (): void {
    $register = makeCashRegister();

    $this->getJson("/api/v1/cash-registers/{$register->id}/shifts")->assertUnauthorized();
});

it('lists shifts for a cash register newest first', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::REGISTER_READ, Permissions::CASH_READ]);

    $older = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Closed,
        'opened_at' => now()->subDay(),
        'closed_at' => now()->subDay()->addHour(),
        'opening_cash_cents' => 1000,
        'closing_cash_cents' => 1000,
    ]);

    $newer = Shift::query()->create([
        'user_id' => User::factory()->create()->id,
        'cash_register_id' => $register->id,
        'status' => ShiftStatus::Open,
        'opened_at' => now(),
        'opening_cash_cents' => 2000,
    ]);

    $response = $this->getJson("/api/v1/cash-registers/{$register->id}/shifts?per_page=10")
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    $data = $response->json('data');
    expect($data[0]['id'])->toBe($newer->id)
        ->and($data[1]['id'])->toBe($older->id);
});

it('denies cash register shift history without cash read', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::REGISTER_READ]);

    $this->getJson("/api/v1/cash-registers/{$register->id}/shifts")->assertForbidden();
});

it('denies cash register shift history without register read', function (): void {
    $register = makeCashRegister();
    authenticateWithPermissions([Permissions::CASH_READ]);

    $this->getJson("/api/v1/cash-registers/{$register->id}/shifts")->assertForbidden();
});
