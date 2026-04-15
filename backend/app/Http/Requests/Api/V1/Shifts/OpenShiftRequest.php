<?php

namespace App\Http\Requests\Api\V1\Shifts;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;

class OpenShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::SHIFT_OPEN);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'opening_cash_cents' => ['required', 'integer', 'min:0'],
        ];
    }
}
