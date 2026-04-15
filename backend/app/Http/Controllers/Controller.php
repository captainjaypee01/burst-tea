<?php

namespace App\Http\Controllers;

use App\Models\User;

abstract class Controller
{
    protected function authorizePermission(?User $user, string $permission): void
    {
        if (! $user instanceof User) {
            abort(401);
        }

        if (! $user->hasPermission($permission)) {
            abort(403, 'Forbidden');
        }
    }
}
