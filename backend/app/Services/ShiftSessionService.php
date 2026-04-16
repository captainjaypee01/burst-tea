<?php

namespace App\Services;

use App\Enums\ShiftStatus;
use App\Models\Shift;

class ShiftSessionService
{
    public function getCurrentOpenShiftForRegister(int $cashRegisterId): ?Shift
    {
        return Shift::query()
            ->where('status', ShiftStatus::Open)
            ->where('cash_register_id', $cashRegisterId)
            ->latest('id')
            ->with(['user', 'cashRegister', 'closedBy'])
            ->first();
    }
}
