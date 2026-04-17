<?php

namespace App\Http\Requests\Api\V1\Recipes;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertRecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user instanceof User) {
            return false;
        }

        return $user->hasPermission(Permissions::PRODUCT_UPDATE);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lines' => ['required', 'array'],
            'lines.*.inventory_item_id' => ['required', 'integer', Rule::exists('inventory_items', 'id')->whereNull('deleted_at')],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.0001'],
        ];
    }
}
