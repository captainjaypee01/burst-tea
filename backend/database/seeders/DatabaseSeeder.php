<?php

namespace Database\Seeders;

use Database\Seeders\Auth\DemoUserSeeder;
use Database\Seeders\Auth\StaffRoleSeeder;
use Database\Seeders\Catalog\TambayanMenuSeeder;
use Database\Seeders\Shifts\CashRegisterSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            StaffRoleSeeder::class,
            CashRegisterSeeder::class,
            DemoUserSeeder::class,
            TambayanMenuSeeder::class,
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
