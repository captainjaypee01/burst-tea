<?php

namespace App\Actions\Shifts;

use App\Models\Shift;
use App\Models\User;
use App\Services\ShiftSessionService;
use App\Support\Permissions;

class GetCurrentShiftAction
{
    public function __construct(
        private readonly ShiftSessionService $shiftSessionService,
    ) {}

    public function execute(User $user, int $cashRegisterId): ?Shift
    {
        if (! $user->hasPermission(Permissions::CASH_READ)) {
            abort(403, 'Forbidden');
        }

        return $this->shiftSessionService->getCurrentOpenShiftForRegister($cashRegisterId);
    }
}
