<?php

namespace App\DTOs\Orders;

use App\Http\Requests\Api\V1\Orders\StoreOrderRequest;

readonly class StoreOrderDTO
{
    /**
     * @param  array<int, array{product_variant_id: int, quantity: int, modifier_ids?: list<int>, notes?: string|null}>  $items
     */
    public function __construct(
        public ?int $customerId,
        public array $items,
    ) {}

    public static function fromRequest(StoreOrderRequest $request): self
    {
        /** @var array{customer_id?: int|null, items: array<int, array{product_variant_id: int, quantity: int, modifier_ids?: list<int>, notes?: string|null}>} $data */
        $data = $request->validated();

        return new self(
            customerId: isset($data['customer_id']) ? (int) $data['customer_id'] : null,
            items: $data['items'],
        );
    }
}
