<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'users',
            'categories',
            'products',
            'product_variants',
            'modifiers',
            'customers',
            'inventory_items',
            'cash_registers',
            'expenses',
            'cash_advances',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->softDeletes();
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'cash_advances',
            'expenses',
            'cash_registers',
            'inventory_items',
            'customers',
            'modifiers',
            'product_variants',
            'products',
            'categories',
            'users',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->dropSoftDeletes();
            });
        }
    }
};
