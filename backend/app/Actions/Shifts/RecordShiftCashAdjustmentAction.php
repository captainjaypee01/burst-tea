<?php

namespace App\Actions\Shifts;

use App\Enums\ShiftStatus;
use App\Models\Shift;
use App\Models\User;
use App\Services\CashDrawerService;
use App\Support\Permissions;
use Illuminate\Validation\ValidationException;

class RecordShiftCashAdjustmentAction
{
    public function __construct(
        private readonly CashDrawerService $cashDrawerService,
    ) {}

    public function execute(User $user, Shift $shift, int $deltaCents, string $reason): void
    {
        if (! $user->hasPermission(Permissions::CASH_ADJUST)) {
            abort(403);
        }

        if ($shift->status !== ShiftStatus::Open) {
            throw ValidationException::withMessages([
                'shift' => ['Cash count adjustments are only allowed on an open shift.'],
            ]);
        }

        $this->cashDrawerService->recordCountAdjustment($shift, $user, $deltaCents, $reason);
    }
}
