<?php

namespace App\Enums;

enum CashLedgerType: string
{
    case Opening = 'opening';
    case Sale = 'sale';
    case Expense = 'expense';
    case Advance = 'advance';
    case Adjustment = 'adjustment';
    case Closing = 'closing';
}
