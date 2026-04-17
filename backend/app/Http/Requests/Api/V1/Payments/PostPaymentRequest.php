<?php

namespace App\Http\Requests\Api\V1\Payments;

use App\Enums\EWalletProvider;
use App\Enums\ShiftStatus;
use App\Models\Shift;
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
            'reference' => ['nullable', 'string', 'max:255'],
            'e_wallet_provider' => ['nullable', Rule::enum(EWalletProvider::class)],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $method = $this->input('method');
            if ($method === 'e_wallet' && ! $this->filled('e_wallet_provider')) {
                $validator->errors()->add(
                    'e_wallet_provider',
                    'e_wallet_provider is required when method is e_wallet.',
                );
            }
            if ($method !== 'e_wallet' && $this->filled('e_wallet_provider')) {
                $validator->errors()->add(
                    'e_wallet_provider',
                    'e_wallet_provider must be empty unless method is e_wallet.',
                );
            }
            if (! in_array($method, ['cash', 'e_wallet'], true)) {
                return;
            }

            $openCount = Shift::query()->where('status', ShiftStatus::Open)->count();
            if ($openCount > 1 && ! $this->filled('shift_id')) {
                $validator->errors()->add(
                    'shift_id',
                    'shift_id is required when more than one shift is open.',
                );
            }
        });
    }
}
