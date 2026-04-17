<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::USER_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->whereNull('deleted_at')],
            'password' => ['required', 'string', 'min:8'],
            'pin_hash' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_superadmin' => ['sometimes', 'boolean'],
            'account_kind' => ['sometimes', 'string', 'in:staff,customer,member'],
            'role_ids' => ['sometimes', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ];
    }
}
