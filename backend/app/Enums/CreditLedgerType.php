<?php

namespace App\Enums;

enum CreditLedgerType: string
{
    case Charge = 'charge';
    case Payment = 'payment';
}
