<?php

namespace App\Actions\Shifts;

use App\Enums\CashLedgerType;
use App\Enums\ShiftStatus;
use App\Models\CashRegister;
use App\Models\CashLedgerEntry;
use App\Models\User;
use App\Models\Shift;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OpenShiftAction
{
    public function execute(User $user, int $cashRegisterId, int $openingCashCents): Shift
    {
        if (! $user->hasPermission(Permissions::SHIFT_OPEN)) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $cashRegisterId, $openingCashCents) {
            $register = CashRegister::query()
                ->whereKey($cashRegisterId)
                ->where('is_active', true)
                ->first();
            if ($register === null) {
                throw ValidationException::withMessages([
                    'cash_register_id' => ['The selected cash register is invalid or inactive.'],
                ]);
            }

            if (Shift::query()
                ->where('user_id', $user->id)
                ->where('status', ShiftStatus::Open)
                ->where('cash_register_id', '!=', $cashRegisterId)
                ->exists()) {
                throw ValidationException::withMessages([
                    'cash_register_id' => ['Close your current shift before opening a shift on another register.'],
                ]);
            }

            if (Shift::query()
                ->where('status', ShiftStatus::Open)
                ->where('cash_register_id', $cashRegisterId)
                ->exists()) {
                throw ValidationException::withMessages([
                    'shift' => ['A shift is already open on this register.'],
                ]);
            }

            $shift = new Shift([
                'user_id' => $user->id,
                'cash_register_id' => $cashRegisterId,
                'status' => ShiftStatus::Open,
                'opened_at' => now(),
                'opening_cash_cents' => $openingCashCents,
            ]);
            $shift->save();

            $entry = new CashLedgerEntry([
                'shift_id' => $shift->id,
                'type' => CashLedgerType::Opening,
                'amount_cents' => $openingCashCents,
                'notes' => 'Opening float',
            ]);
            $entry->save();

            return $shift->fresh(['user', 'cashRegister', 'closedBy']);
        });
    }
}
