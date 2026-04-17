<?php

namespace Database\Seeders\Auth;

use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Defines the default "staff" role and its permissions (register, shifts, orders).
 * Requires {@see PermissionSeeder} to have created permission rows.
 */
class StaffRoleSeeder extends Seeder
{
    public function run(): void
    {
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
    }
}
