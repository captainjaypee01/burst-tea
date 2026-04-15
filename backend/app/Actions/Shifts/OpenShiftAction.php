<?php

namespace App\Actions\Shifts;

use App\Enums\CashLedgerType;
use App\Enums\ShiftStatus;
use App\Models\CashLedgerEntry;
use App\Models\User;
use App\Models\Shift;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OpenShiftAction
{
    public function execute(User $user, int $openingCashCents): Shift
    {
        if (! $user->hasPermission(Permissions::SHIFT_OPEN)) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $openingCashCents) {
            if (Shift::query()->where('status', ShiftStatus::Open)->exists()) {
                throw ValidationException::withMessages([
                    'shift' => ['A shift is already open.'],
                ]);
            }

            $shift = new Shift([
                'user_id' => $user->id,
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

            return $shift->fresh(['user']);
        });
    }
}
