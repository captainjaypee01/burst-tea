<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CashRegisters\ListShiftsForCashRegisterRequest;
use App\Http\Requests\Api\V1\CashRegisters\StoreCashRegisterRequest;
use App\Http\Requests\Api\V1\CashRegisters\UpdateCashRegisterRequest;
use App\Http\Resources\Api\V1\CashRegisterResource;
use App\Http\Resources\Api\V1\ShiftResource;
use App\Models\CashRegister;
use App\Models\Shift;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CashRegisterController extends Controller
{
    public function options(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorizePermission($request->user(), Permissions::REGISTER_READ);

        $rows = CashRegister::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::REGISTER_READ);

        $paginator = CashRegister::query()
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return CashRegisterResource::collection($paginator);
    }

    public function shifts(ListShiftsForCashRegisterRequest $request, CashRegister $cashRegister): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        $paginator = Shift::query()
            ->where('cash_register_id', $cashRegister->id)
            ->with(['user', 'closedBy', 'cashRegister'])
            ->orderByDesc('opened_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        return ShiftResource::collection($paginator);
    }

    public function store(StoreCashRegisterRequest $request): CashRegisterResource
    {
        /** @var array{name: string} $data */
        $data = $request->validated();

        $register = CashRegister::query()->create([
            'name' => $data['name'],
            'is_active' => true,
        ]);

        return new CashRegisterResource($register);
    }

    public function show(Request $request, CashRegister $cashRegister): CashRegisterResource
    {
        $this->authorizePermission($request->user(), Permissions::REGISTER_READ);

        return new CashRegisterResource($cashRegister);
    }

    public function update(UpdateCashRegisterRequest $request, CashRegister $cashRegister): CashRegisterResource
    {
        $cashRegister->fill($request->validated());
        $cashRegister->save();

        return new CashRegisterResource($cashRegister->fresh());
    }

    public function destroy(Request $request, CashRegister $cashRegister): Response
    {
        $this->authorizePermission($request->user(), Permissions::REGISTER_MANAGE);

        $cashRegister->is_active = false;
        $cashRegister->save();

        return response()->noContent();
    }
}
