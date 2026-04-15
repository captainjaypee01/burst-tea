<?php

namespace App\DTOs\Auth;

use App\Http\Requests\Api\V1\Auth\LoginRequest;

readonly class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password,
    ) {}

    public static function fromRequest(LoginRequest $request): self
    {
        /** @var array{email: string, password: string} $data */
        $data = $request->validated();

        return new self(
            email: $data['email'],
            password: $data['password'],
        );
    }
}
