<?php

namespace App\Http\Requests\Api\V1\Shifts;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CurrentShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::CASH_READ)
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
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validationData(): array
    {
        return array_merge($this->all(), [
            'cash_register_id' => $this->query('cash_register_id'),
        ]);
    }
}
