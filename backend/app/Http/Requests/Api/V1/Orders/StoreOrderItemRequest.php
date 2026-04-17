<?php

namespace App\Http\Requests\Api\V1\Orders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::ORDER_UPDATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'integer', Rule::exists('product_variants', 'id')->whereNull('deleted_at')],
            'quantity' => ['required', 'integer', 'min:1'],
            'modifier_ids' => ['sometimes', 'array'],
            'modifier_ids.*' => ['integer', Rule::exists('modifiers', 'id')->whereNull('deleted_at')],
        ];
    }
}
