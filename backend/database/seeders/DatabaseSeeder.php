<?php

namespace Database\Seeders;

use App\Enums\AccountKind;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(PermissionSeeder::class);

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
    }
}
