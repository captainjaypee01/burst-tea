<?php

namespace Database\Factories;

use App\Enums\AccountKind;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'pin_hash' => null,
            'account_kind' => AccountKind::Staff,
            'is_active' => true,
            'is_superadmin' => false,
            'remember_token' => Str::random(10),
        ];
    }
}
