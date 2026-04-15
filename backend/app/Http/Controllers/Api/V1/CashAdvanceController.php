<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CashAdvances\StoreCashAdvanceRequest;
use App\Http\Requests\Api\V1\CashAdvances\UpdateCashAdvanceRequest;
use App\Http\Resources\Api\V1\CashAdvanceResource;
use App\Models\CashAdvance;
use App\Models\Shift;
use App\Services\CashDrawerService;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CashAdvanceController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::ADVANCE_READ);

        $paginator = CashAdvance::query()->orderByDesc('id')->paginate($request->integer('per_page', 15));

        return CashAdvanceResource::collection($paginator);
    }

    public function store(StoreCashAdvanceRequest $request, CashDrawerService $cashDrawer): CashAdvanceResource
    {
        $advance = DB::transaction(function () use ($request, $cashDrawer) {
            $advance = CashAdvance::query()->create($request->validated());

            if ($advance->shift_id !== null) {
                /** @var Shift $shift */
                $shift = Shift::query()->findOrFail($advance->shift_id);
                $cashDrawer->recordAdvance($shift, $advance->amount_cents, CashAdvance::class, $advance->id);
            }

            return $advance;
        });

        return new CashAdvanceResource($advance);
    }

    public function show(Request $request, CashAdvance $cashAdvance): CashAdvanceResource
    {
        $this->authorizePermission($request->user(), Permissions::ADVANCE_READ);

        return new CashAdvanceResource($cashAdvance);
    }

    public function update(UpdateCashAdvanceRequest $request, CashAdvance $cashAdvance): CashAdvanceResource
    {
        $cashAdvance->fill($request->validated());
        $cashAdvance->save();

        return new CashAdvanceResource($cashAdvance->fresh());
    }

    public function destroy(Request $request, CashAdvance $cashAdvance): Response
    {
        $this->authorizePermission($request->user(), Permissions::ADVANCE_CREATE);

        $cashAdvance->delete();

        return response()->noContent();
    }
}
