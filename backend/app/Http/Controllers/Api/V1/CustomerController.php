<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Customers\StoreCustomerRequest;
use App\Http\Requests\Api\V1\Customers\UpdateCustomerRequest;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Customer;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CustomerController extends Controller
{
    public function options(Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorizePermission($request->user(), Permissions::CUSTOMER_READ);

        $rows = Customer::query()
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        return response()->json(['data' => $rows]);
    }

    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorizePermission($request->user(), Permissions::CUSTOMER_READ);

        $paginator = Customer::query()->orderBy('name')->paginate($request->integer('per_page', 15));

        return CustomerResource::collection($paginator);
    }

    public function store(StoreCustomerRequest $request): CustomerResource
    {
        $customer = Customer::query()->create($request->validated());

        return new CustomerResource($customer);
    }

    public function show(Request $request, Customer $customer): CustomerResource
    {
        $this->authorizePermission($request->user(), Permissions::CUSTOMER_READ);

        return new CustomerResource($customer);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): CustomerResource
    {
        $customer->fill($request->validated());
        $customer->save();

        return new CustomerResource($customer->fresh());
    }

    public function destroy(Request $request, Customer $customer): Response
    {
        $this->authorizePermission($request->user(), Permissions::CUSTOMER_DELETE);

        $customer->delete();

        return response()->noContent();
    }
}
