<?php

namespace App\Http\Requests\Api\V1\Payments;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PostPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::PAYMENT_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'method' => ['required', Rule::in(['cash', 'e_wallet', 'credit'])],
            'amount_cents' => ['required', 'integer', 'min:1'],
            'shift_id' => ['nullable', 'integer', 'exists:shifts,id'],
        ];
    }
}
