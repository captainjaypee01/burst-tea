<?php

namespace Database\Seeders;

use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Permissions::all() as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $manager = Role::firstOrCreate(
            ['name' => 'manager', 'guard_name' => 'web'],
        );

        $manager->syncPermissions(Permission::query()->get());
    }
}
