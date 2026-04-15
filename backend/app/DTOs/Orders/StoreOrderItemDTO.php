<?php

namespace App\DTOs\Orders;

use App\Http\Requests\Api\V1\Orders\StoreOrderItemRequest;

readonly class StoreOrderItemDTO
{
    /**
     * @param  list<int>  $modifierIds
     */
    public function __construct(
        public int $productVariantId,
        public int $quantity,
        public array $modifierIds,
    ) {}

    public static function fromRequest(StoreOrderItemRequest $request): self
    {
        /** @var array{product_variant_id: int, quantity: int, modifier_ids?: list<int>} $data */
        $data = $request->validated();

        return new self(
            productVariantId: (int) $data['product_variant_id'],
            quantity: (int) $data['quantity'],
            modifierIds: $data['modifier_ids'] ?? [],
        );
    }

    /**
     * @return array{product_variant_id: int, quantity: int, modifier_ids?: list<int>}
     */
    public function toLineArray(): array
    {
        return [
            'product_variant_id' => $this->productVariantId,
            'quantity' => $this->quantity,
            'modifier_ids' => $this->modifierIds,
        ];
    }
}
