<?php

namespace App\Http\Requests\Api\V1\Expenses;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::EXPENSE_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'shift_id' => ['sometimes', 'nullable', 'integer', 'exists:shifts,id'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'max:255'],
            'amount_cents' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
