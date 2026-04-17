<?php

namespace App\Actions\Payments;

use App\DTOs\Payments\PostPaymentDTO;
use App\Enums\EWalletProvider;
use App\Enums\OrderPaymentStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\ShiftStatus;
use App\Models\User;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Shift;
use App\Services\CashDrawerService;
use App\Services\CreditLedgerService;
use App\Services\InventoryService;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PostPaymentAction
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly CreditLedgerService $creditLedgerService,
        private readonly CashDrawerService $cashDrawerService,
    ) {}

    public function execute(User $user, PostPaymentDTO $dto): Payment
    {
        if (! $user->hasPermission(Permissions::PAYMENT_CREATE)) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $dto) {
            /** @var Order $order */
            $order = Order::query()->lockForUpdate()->findOrFail($dto->orderId);

            $remaining = $order->total_cents - $order->amount_paid_cents;
            if ($dto->amountCents > $remaining) {
                throw ValidationException::withMessages([
                    'amount_cents' => ['Amount exceeds remaining balance for this order.'],
                ]);
            }

            if ($dto->method === PaymentMethod::Credit && ! $order->customer_id) {
                throw ValidationException::withMessages([
                    'method' => ['Credit payments require a customer on the order.'],
                ]);
            }

            if ($dto->method === PaymentMethod::Credit && $dto->amountCents !== $remaining) {
                throw ValidationException::withMessages([
                    'amount_cents' => ['Credit (pay later) must settle the remaining balance in a single payment.'],
                ]);
            }

            $shift = $this->resolveShiftForCash($dto);

            $eWalletProvider = $dto->method === PaymentMethod::EWallet ? $dto->eWalletProvider : null;

            $payment = new Payment([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'shift_id' => in_array($dto->method, [PaymentMethod::Cash, PaymentMethod::EWallet], true) ? $shift?->id : null,
                'method' => $dto->method,
                'amount_cents' => $dto->amountCents,
                'reference' => $dto->reference,
                'e_wallet_provider' => $eWalletProvider,
            ]);
            $payment->save();

            $order->amount_paid_cents = $order->amount_paid_cents + $dto->amountCents;

            if ($order->amount_paid_cents >= $order->total_cents) {
                $order->payment_status = OrderPaymentStatus::Paid;
                $order->status = OrderStatus::Paid;

                if ($dto->method === PaymentMethod::Credit) {
                    $order->is_credit = true;
                    $this->creditLedgerService->chargeForOrder($order);
                }

                $this->inventoryService->deductForOrder($order);

                if (
                    $shift !== null
                    && in_array($dto->method, [PaymentMethod::Cash, PaymentMethod::EWallet], true)
                ) {
                    $this->cashDrawerService->recordSale($shift, $order, $dto->amountCents, $this->ledgerPaymentLabel($dto));
                }
            } else {
                $order->payment_status = OrderPaymentStatus::Partial;
            }

            $order->save();

            return $payment->fresh();
        });
    }

    private function resolveShiftForCash(PostPaymentDTO $dto): ?Shift
    {
        if (! in_array($dto->method, [PaymentMethod::Cash, PaymentMethod::EWallet], true)) {
            return null;
        }

        if ($dto->shiftId !== null) {
            /** @var Shift $shift */
            $shift = Shift::query()->whereKey($dto->shiftId)->firstOrFail();
            if ($shift->status !== ShiftStatus::Open) {
                throw ValidationException::withMessages([
                    'shift_id' => ['The selected shift is not open.'],
                ]);
            }

            return $shift;
        }

        $openShifts = Shift::query()->where('status', ShiftStatus::Open)->get();
        if ($openShifts->isEmpty()) {
            throw ValidationException::withMessages([
                'shift_id' => ['An open shift is required for cash or e-wallet payments.'],
            ]);
        }

        if ($openShifts->count() > 1) {
            throw ValidationException::withMessages([
                'shift_id' => ['shift_id is required when more than one shift is open.'],
            ]);
        }

        /** @var Shift $only */
        $only = $openShifts->first();

        return $only;
    }

    private function ledgerPaymentLabel(PostPaymentDTO $dto): string
    {
        return match ($dto->method) {
            PaymentMethod::Cash => 'Cash',
            PaymentMethod::EWallet => match ($dto->eWalletProvider) {
                EWalletProvider::Maya => 'PayMaya',
                EWalletProvider::Gcash => 'GCash',
                null => 'E-wallet',
            },
            default => '',
        };
    }
}
