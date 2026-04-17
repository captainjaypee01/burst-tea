<?php

namespace App\Http\Requests\Api\V1\Categories;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::CATEGORY_CREATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->whereNull('deleted_at')],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
