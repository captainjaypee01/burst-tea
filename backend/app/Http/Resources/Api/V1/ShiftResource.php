<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Shift
 */
class ShiftResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'closed_by_user_id' => $this->closed_by_user_id,
            'cash_register_id' => $this->cash_register_id,
            'status' => $this->status->value,
            'name' => $this->name,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'opening_cash_cents' => $this->opening_cash_cents,
            'closing_cash_cents' => $this->closing_cash_cents,
            'user' => new UserResource($this->whenLoaded('user')),
            'closed_by' => new UserResource($this->whenLoaded('closedBy')),
            'cash_register' => new CashRegisterResource($this->whenLoaded('cashRegister')),
        ];
    }
}
