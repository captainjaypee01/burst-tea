<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case EWallet = 'e_wallet';
    case Credit = 'credit';
}
