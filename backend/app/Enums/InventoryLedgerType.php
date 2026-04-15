<?php

namespace App\Enums;

enum InventoryLedgerType: string
{
    case In = 'in';
    case Out = 'out';
    case Adjust = 'adjust';
}
