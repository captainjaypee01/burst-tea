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

class CloseShiftAction
{
    public function execute(User $user, Shift $shift, int $closingCashCents): Shift
    {
        if (! $user->hasPermission(Permissions::SHIFT_CLOSE)) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $shift, $closingCashCents) {
            if ($shift->status !== ShiftStatus::Open) {
                throw ValidationException::withMessages([
                    'shift' => ['Shift is not open.'],
                ]);
            }

            $shift->status = ShiftStatus::Closed;
            $shift->closed_at = now();
            $shift->closing_cash_cents = $closingCashCents;
            $shift->closed_by_user_id = $user->id;
            $shift->save();

            $entry = new CashLedgerEntry([
                'shift_id' => $shift->id,
                'type' => CashLedgerType::Closing,
                'amount_cents' => $closingCashCents,
                'notes' => sprintf('Closing count (closed by %s #%d)', $user->name, $user->id),
            ]);
            $entry->save();

            return $shift->fresh(['user', 'cashRegister', 'closedBy']);
        });
    }
}
