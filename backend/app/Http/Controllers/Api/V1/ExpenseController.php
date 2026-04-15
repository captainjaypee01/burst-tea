<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Expenses\StoreExpenseRequest;
use App\Http\Requests\Api\V1\Expenses\UpdateExpenseRequest;
use App\Http\Resources\Api\V1\ExpenseResource;
use App\Models\Expense;
use App\Models\Shift;
use App\Services\CashDrawerService;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::EXPENSE_READ);

        $paginator = Expense::query()->orderByDesc('id')->paginate($request->integer('per_page', 15));

        return ExpenseResource::collection($paginator);
    }

    public function store(StoreExpenseRequest $request, CashDrawerService $cashDrawer): ExpenseResource
    {
        $expense = DB::transaction(function () use ($request, $cashDrawer) {
            $expense = Expense::query()->create($request->validated());

            if ($expense->shift_id !== null) {
                /** @var Shift $shift */
                $shift = Shift::query()->findOrFail($expense->shift_id);
                $cashDrawer->recordExpense($shift, $expense->amount_cents, Expense::class, $expense->id);
            }

            return $expense;
        });

        return new ExpenseResource($expense);
    }

    public function show(Request $request, Expense $expense): ExpenseResource
    {
        $this->authorizePermission($request->user(), Permissions::EXPENSE_READ);

        return new ExpenseResource($expense);
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): ExpenseResource
    {
        $expense->fill($request->validated());
        $expense->save();

        return new ExpenseResource($expense->fresh());
    }

    public function destroy(Request $request, Expense $expense): Response
    {
        $this->authorizePermission($request->user(), Permissions::EXPENSE_CREATE);

        $expense->delete();

        return response()->noContent();
    }
}
