<?php

namespace App\Http\Requests\Api\V1\Shifts;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OpenShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::SHIFT_OPEN)
            && $user->hasPermission(Permissions::REGISTER_READ);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cash_register_id' => [
                'required',
                'integer',
                Rule::exists('cash_registers', 'id')->where('is_active', true)->whereNull('deleted_at'),
            ],
            'opening_cash_cents' => ['required', 'integer', 'min:0'],
        ];
    }
}
