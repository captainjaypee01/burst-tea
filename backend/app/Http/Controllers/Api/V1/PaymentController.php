<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Payments\PostPaymentAction;
use App\DTOs\Payments\PostPaymentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Payments\PostPaymentRequest;
use App\Http\Resources\Api\V1\PaymentResource;

class PaymentController extends Controller
{
    public function store(PostPaymentRequest $request, PostPaymentAction $action): PaymentResource
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $payment = $action->execute($user, PostPaymentDTO::fromRequest($request));

        return new PaymentResource($payment->loadMissing(['shift.cashRegister']));
    }
}
