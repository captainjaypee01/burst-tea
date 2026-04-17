<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

pest()->extend(TestCase::class)->use(RefreshDatabase::class)->in('Feature');

pest()->beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    foreach (\App\Support\Permissions::all() as $name) {
        Permission::findOrCreate($name, 'web');
    }
})->in('Feature');
