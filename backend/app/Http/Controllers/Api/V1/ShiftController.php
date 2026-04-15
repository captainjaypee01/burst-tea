<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Shifts\CloseShiftAction;
use App\Actions\Shifts\OpenShiftAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Shifts\CloseShiftRequest;
use App\Http\Requests\Api\V1\Shifts\OpenShiftRequest;
use App\Http\Resources\Api\V1\ShiftResource;
use App\Models\Shift;

class ShiftController extends Controller
{
    public function open(OpenShiftRequest $request, OpenShiftAction $action): ShiftResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var array{opening_cash_cents: int} $data */
        $data = $request->validated();

        $shift = $action->execute($user, (int) $data['opening_cash_cents']);

        return new ShiftResource($shift);
    }

    public function close(CloseShiftRequest $request, Shift $shift, CloseShiftAction $action): ShiftResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var array{closing_cash_cents: int} $data */
        $data = $request->validated();

        $shift = $action->execute($user, $shift, (int) $data['closing_cash_cents']);

        return new ShiftResource($shift);
    }
}
