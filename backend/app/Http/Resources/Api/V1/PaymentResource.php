<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Payment
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'user_id' => $this->user_id,
            'shift_id' => $this->shift_id,
            'method' => $this->method->value,
            'amount_cents' => $this->amount_cents,
            'reference' => $this->reference,
            'e_wallet_provider' => $this->e_wallet_provider?->value,
            'shift' => new ShiftResource($this->whenLoaded('shift')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
