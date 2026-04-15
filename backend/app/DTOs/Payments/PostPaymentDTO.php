<?php

namespace App\DTOs\Payments;

use App\Enums\PaymentMethod;
use App\Http\Requests\Api\V1\Payments\PostPaymentRequest;

readonly class PostPaymentDTO
{
    public function __construct(
        public int $orderId,
        public PaymentMethod $method,
        public int $amountCents,
        public ?int $shiftId,
    ) {}

    public static function fromRequest(PostPaymentRequest $request): self
    {
        /** @var array{order_id: int, method: string, amount_cents: int, shift_id?: int|null} $data */
        $data = $request->validated();

        return new self(
            orderId: (int) $data['order_id'],
            method: PaymentMethod::from($data['method']),
            amountCents: (int) $data['amount_cents'],
            shiftId: isset($data['shift_id']) ? (int) $data['shift_id'] : null,
        );
    }
}
