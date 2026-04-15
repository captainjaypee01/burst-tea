<?php

namespace App\Http\Middleware;

use App\Enums\AccountKind;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffUserIsActive
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return $next($request);
        }

        if ($user->account_kind !== AccountKind::Staff) {
            return response()->json([
                'message' => 'This API is for staff accounts only.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Staff account is inactive.',
            ], 403);
        }

        return $next($request);
    }
}
