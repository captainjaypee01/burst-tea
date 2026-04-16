<?php

namespace Database\Seeders;

use App\Enums\AccountKind;
use App\Models\CashRegister;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(PermissionSeeder::class);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        CashRegister::query()->updateOrCreate(
            ['name' => 'Front register'],
            ['name' => 'Front register', 'is_active' => true],
        );
        CashRegister::query()->updateOrCreate(
            ['name' => 'Second register'],
            ['name' => 'Second register', 'is_active' => true],
        );

        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'pin_hash' => null,
                'account_kind' => AccountKind::Staff,
                'is_active' => true,
                'is_superadmin' => true,
            ],
        );

        $managerRole = Role::query()->where('name', 'manager')->where('guard_name', 'web')->firstOrFail();

        $manager = User::query()->updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Floor Manager',
                'password' => Hash::make('password'),
                'pin_hash' => null,
                'account_kind' => AccountKind::Staff,
                'is_active' => true,
                'is_superadmin' => false,
            ],
        );

        $manager->syncRoles([$managerRole]);

        $staffRole = Role::query()->firstOrCreate(
            ['name' => 'staff', 'guard_name' => 'web'],
        );

        $staffPermissionNames = [
            Permissions::AUTH_LOGIN,
            Permissions::REGISTER_READ,
            Permissions::SHIFT_OPEN,
            Permissions::SHIFT_CLOSE,
            Permissions::CASH_READ,
            Permissions::CASH_ADJUST,
            Permissions::ORDER_CREATE,
            Permissions::ORDER_READ,
            Permissions::ORDER_UPDATE,
            Permissions::PAYMENT_CREATE,
            Permissions::PRODUCT_READ,
            Permissions::CUSTOMER_READ,
        ];

        $staffPermissions = collect($staffPermissionNames)
            ->map(fn (string $name) => Permission::query()->where('name', $name)->where('guard_name', 'web')->firstOrFail())
            ->all();

        $staffRole->syncPermissions($staffPermissions);

        $staff = User::query()->updateOrCreate(
            ['email' => 'staff@example.com'],
            [
                'name' => 'Counter Staff',
                'password' => Hash::make('password'),
                'pin_hash' => null,
                'account_kind' => AccountKind::Staff,
                'is_active' => true,
                'is_superadmin' => false,
            ],
        );

        $staff->syncRoles([$staffRole]);
    }
}
