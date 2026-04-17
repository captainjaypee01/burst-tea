<?php

namespace App\Http\Requests\Api\V1\Products;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::PRODUCT_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'modifier_ids' => ['sometimes', 'array'],
            'modifier_ids.*' => ['integer', Rule::exists('modifiers', 'id')->whereNull('deleted_at')],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.name' => ['required', 'string', 'max:255'],
            'variants.*.price_cents' => ['required', 'integer', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:255'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
        ];
    }
}
