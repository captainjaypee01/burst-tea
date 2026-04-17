<?php

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\CashAdvanceController;
use App\Http\Controllers\Api\V1\CashRegisterController;
use App\Http\Controllers\Api\V1\CashLedgerController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CreditLedgerController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\InventoryItemController;
use App\Http\Controllers\Api\V1\InventoryLedgerController;
use App\Http\Controllers\Api\V1\ModifierController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\OrderItemController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductVariantController;
use App\Http\Controllers\Api\V1\RecipeController;
use App\Http\Controllers\Api\V1\ShiftController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', LoginController::class);

Route::middleware(['auth:sanctum', 'staff.active'])->group(function () {
    Route::post('auth/logout', LogoutController::class);
    Route::get('auth/me', MeController::class);

    Route::get('categories/options', [CategoryController::class, 'options']);
    Route::apiResource('categories', CategoryController::class)->whereNumber('category');

    Route::get('products/options', [ProductController::class, 'options']);
    Route::apiResource('products', ProductController::class)->whereNumber('product');
    Route::post('products/{product}/variants', [ProductVariantController::class, 'store'])->whereNumber('product');
    Route::put('products/{product}/variants/{variant}', [ProductVariantController::class, 'update'])->whereNumber(['product', 'variant']);
    Route::delete('products/{product}/variants/{variant}', [ProductVariantController::class, 'destroy'])->whereNumber(['product', 'variant']);
    Route::put('products/{product}/variants/{variant}/recipe', [RecipeController::class, 'upsert'])->whereNumber(['product', 'variant']);

    Route::get('modifiers/options', [ModifierController::class, 'options']);
    Route::apiResource('modifiers', ModifierController::class)->whereNumber('modifier');

    Route::get('users/options', [UserController::class, 'options']);
    Route::apiResource('users', UserController::class)->whereNumber('user');

    Route::get('customers/options', [CustomerController::class, 'options']);
    Route::apiResource('customers', CustomerController::class)->whereNumber('customer');

    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show'])->whereNumber('order');
    Route::post('orders/{order}/cancel', [OrderController::class, 'cancel'])->whereNumber('order');
    Route::post('orders/{order}/items', [OrderItemController::class, 'store'])->whereNumber('order');
    Route::patch('orders/{order}/items/{order_item}', [OrderItemController::class, 'update'])->whereNumber(['order', 'order_item']);
    Route::delete('orders/{order}/items/{order_item}', [OrderItemController::class, 'destroy'])->whereNumber(['order', 'order_item']);

    Route::post('payments', [PaymentController::class, 'store']);

    Route::get('credit-ledger', [CreditLedgerController::class, 'index']);

    Route::apiResource('inventory-items', InventoryItemController::class)->whereNumber('inventory_item');
    Route::get('inventory-ledger', [InventoryLedgerController::class, 'index']);

    Route::get('cash-registers/options', [CashRegisterController::class, 'options']);
    Route::get('cash-registers/{cash_register}/shifts', [CashRegisterController::class, 'shifts'])->whereNumber('cash_register');
    Route::apiResource('cash-registers', CashRegisterController::class)->whereNumber('cash_register');

    Route::post('shifts/open', [ShiftController::class, 'open']);
    Route::get('shifts/current', [ShiftController::class, 'current']);
    Route::post('shifts/{shift}/close', [ShiftController::class, 'close'])->whereNumber('shift');
    Route::post('shifts/{shift}/cash-adjustment', [ShiftController::class, 'recordCashAdjustment'])->whereNumber('shift');

    Route::get('shifts/{shift}/cash-ledger', [CashLedgerController::class, 'index'])->whereNumber('shift');

    Route::apiResource('expenses', ExpenseController::class)->whereNumber('expense');
    Route::apiResource('cash-advances', CashAdvanceController::class)->whereNumber('cash_advance');
});
