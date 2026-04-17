<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('line_total_cents');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('e_wallet_provider', 32)->nullable()->after('reference');
            $table->foreignId('shift_id')->nullable()->after('user_id')->constrained('shifts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn(['e_wallet_provider', 'shift_id']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
