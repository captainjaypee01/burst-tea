<?php

namespace App\Http\Requests\Api\V1\Orders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::ORDER_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => ['required', 'integer', Rule::exists('product_variants', 'id')->whereNull('deleted_at')],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.modifier_ids' => ['sometimes', 'array'],
            'items.*.modifier_ids.*' => ['integer', Rule::exists('modifiers', 'id')->whereNull('deleted_at')],
        ];
    }
}
