<?php

namespace Database\Seeders\Auth;

use App\Enums\AccountKind;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Local/demo staff accounts. Not for production.
 * Requires {@see PermissionSeeder} (manager role) and {@see StaffRoleSeeder} (staff role).
 */
class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
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

        $staffRole = Role::query()->where('name', 'staff')->where('guard_name', 'web')->firstOrFail();

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
