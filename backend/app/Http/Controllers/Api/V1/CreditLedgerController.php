<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CreditLedgerEntryResource;
use App\Models\CreditLedgerEntry;
use App\Support\Permissions;
use Illuminate\Http\Request;

class CreditLedgerController extends Controller
{
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::CREDIT_READ);

        $query = CreditLedgerEntry::query()->with('customer')->orderByDesc('id');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        return CreditLedgerEntryResource::collection($paginator);
    }
}
