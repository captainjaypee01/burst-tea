<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Shifts\CloseShiftAction;
use App\Actions\Shifts\GetCurrentShiftAction;
use App\Actions\Shifts\OpenShiftAction;
use App\Actions\Shifts\RecordShiftCashAdjustmentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Shifts\CloseShiftRequest;
use App\Http\Requests\Api\V1\Shifts\CurrentShiftRequest;
use App\Http\Requests\Api\V1\Shifts\OpenShiftRequest;
use App\Http\Requests\Api\V1\Shifts\RecordShiftCashAdjustmentRequest;
use App\Http\Resources\Api\V1\ShiftResource;
use App\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ShiftController extends Controller
{
    public function current(CurrentShiftRequest $request, GetCurrentShiftAction $action): JsonResponse|ShiftResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var array{cash_register_id: int} $data */
        $data = $request->validated();

        $shift = $action->execute($user, (int) $data['cash_register_id']);
        if (! $shift instanceof Shift) {
            return response()->json([
                'data' => null,
            ]);
        }

        return new ShiftResource($shift);
    }

    public function open(OpenShiftRequest $request, OpenShiftAction $action): ShiftResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var array{cash_register_id: int, opening_cash_cents: int} $data */
        $data = $request->validated();

        $shift = $action->execute($user, (int) $data['cash_register_id'], (int) $data['opening_cash_cents']);

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

    public function recordCashAdjustment(
        RecordShiftCashAdjustmentRequest $request,
        Shift $shift,
        RecordShiftCashAdjustmentAction $action,
    ): Response {
        /** @var \App\Models\User $user */
        $user = $request->user();

        /** @var array{delta_cents: int, reason: string} $data */
        $data = $request->validated();

        $action->execute(
            $user,
            $shift,
            (int) $data['delta_cents'],
            $data['reason'],
        );

        return response()->noContent();
    }
}
