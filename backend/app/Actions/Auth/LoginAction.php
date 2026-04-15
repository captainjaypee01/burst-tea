<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\LoginDTO;
use App\Enums\AccountKind;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class LoginAction
{
    public function execute(LoginDTO $dto): string
    {
        /** @var User|null $user */
        $user = User::query()->where('email', $dto->email)->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            abort(422, 'Invalid credentials.');
        }

        if (! $user->is_active) {
            abort(403, 'Account inactive.');
        }

        if (! $user->account_kind->isStaff()) {
            abort(403, 'This login is for staff only.');
        }

        return $user->createToken('api')->plainTextToken;
    }
}
