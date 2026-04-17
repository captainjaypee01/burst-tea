<?php

namespace App\Http\Requests\Api\V1\Users;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::USER_UPDATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');
        if (! $target instanceof User) {
            abort(404);
        }

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($target->id)->whereNull('deleted_at')],
            'password' => ['sometimes', 'string', 'min:8'],
            'pin_hash' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_superadmin' => ['sometimes', 'boolean'],
            'account_kind' => ['sometimes', 'string', 'in:staff,customer,member'],
            'role_ids' => ['sometimes', 'array'],
            'role_ids.*' => ['integer', 'exists:roles,id'],
        ];
    }
}
