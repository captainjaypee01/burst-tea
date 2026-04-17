<?php

namespace App\Http\Requests\Api\V1\CashAdvances;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashAdvanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::ADVANCE_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'shift_id' => ['nullable', 'integer', 'exists:shifts,id'],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
