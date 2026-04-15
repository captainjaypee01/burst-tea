<?php

namespace App\Enums;

enum AccountKind: string
{
    /** POS / back-office accounts (roles, permissions). */
    case Staff = 'staff';

    /** Registered café customer (future: loyalty app login). */
    case Customer = 'customer';

    /** Generic registered account (future use). */
    case Member = 'member';

    public function isStaff(): bool
    {
        return $this === self::Staff;
    }
}
