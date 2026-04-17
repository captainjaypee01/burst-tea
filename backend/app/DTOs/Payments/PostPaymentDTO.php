<?php

namespace App\DTOs\Payments;

use App\Enums\EWalletProvider;
use App\Enums\PaymentMethod;
use App\Http\Requests\Api\V1\Payments\PostPaymentRequest;

readonly class PostPaymentDTO
{
    public function __construct(
        public int $orderId,
        public PaymentMethod $method,
        public int $amountCents,
        public ?int $shiftId,
        public ?string $reference,
        public ?EWalletProvider $eWalletProvider,
    ) {}

    public static function fromRequest(PostPaymentRequest $request): self
    {
        /** @var array{order_id: int, method: string, amount_cents: int, shift_id?: int|null, reference?: string|null, e_wallet_provider?: string|null} $data */
        $data = $request->validated();

        $ew = null;
        if (! empty($data['e_wallet_provider'])) {
            $ew = EWalletProvider::from($data['e_wallet_provider']);
        }

        return new self(
            orderId: (int) $data['order_id'],
            method: PaymentMethod::from($data['method']),
            amountCents: (int) $data['amount_cents'],
            shiftId: isset($data['shift_id']) ? (int) $data['shift_id'] : null,
            reference: $data['reference'] ?? null,
            eWalletProvider: $ew,
        );
    }
}
