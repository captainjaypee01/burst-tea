<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CashLedgerEntryResource;
use App\Models\CashLedgerEntry;
use App\Models\Shift;
use App\Support\Permissions;
use Illuminate\Http\Request;

class CashLedgerController extends Controller
{
    public function index(Request $request, Shift $shift): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::CASH_READ);

        $paginator = CashLedgerEntry::query()
            ->where('shift_id', $shift->id)
            ->orderBy('id')
            ->paginate($request->integer('per_page', 50));

        return CashLedgerEntryResource::collection($paginator);
    }
}
