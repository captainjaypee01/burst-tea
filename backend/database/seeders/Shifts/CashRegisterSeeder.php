<?php

namespace Database\Seeders\Shifts;

use App\Models\CashRegister;
use Illuminate\Database\Seeder;

/**
 * Sample cash registers for shift session / POS (see shifts & cash module).
 */
class CashRegisterSeeder extends Seeder
{
    public function run(): void
    {
        CashRegister::query()->updateOrCreate(
            ['name' => 'Front register'],
            ['name' => 'Front register', 'is_active' => true],
        );

        CashRegister::query()->updateOrCreate(
            ['name' => 'Second register'],
            ['name' => 'Second register', 'is_active' => true],
        );
    }
}
