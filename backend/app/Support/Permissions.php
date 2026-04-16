<?php

namespace App\Support;

final class Permissions
{
    public const AUTH_LOGIN = 'auth.login';

    public const USER_CREATE = 'user.create';

    public const USER_READ = 'user.read';

    public const USER_UPDATE = 'user.update';

    public const USER_DELETE = 'user.delete';

    public const CATEGORY_CREATE = 'category.create';

    public const CATEGORY_READ = 'category.read';

    public const CATEGORY_UPDATE = 'category.update';

    public const CATEGORY_DELETE = 'category.delete';

    public const PRODUCT_CREATE = 'product.create';

    public const PRODUCT_READ = 'product.read';

    public const PRODUCT_UPDATE = 'product.update';

    public const PRODUCT_DELETE = 'product.delete';

    public const ORDER_CREATE = 'order.create';

    public const ORDER_READ = 'order.read';

    public const ORDER_UPDATE = 'order.update';

    public const ORDER_DELETE = 'order.delete';

    public const PAYMENT_CREATE = 'payment.create';

    public const CUSTOMER_CREATE = 'customer.create';

    public const CUSTOMER_READ = 'customer.read';

    public const CUSTOMER_UPDATE = 'customer.update';

    public const CUSTOMER_DELETE = 'customer.delete';

    public const CREDIT_READ = 'credit.read';

    public const CREDIT_WRITE = 'credit.write';

    public const INVENTORY_READ = 'inventory.read';

    public const INVENTORY_WRITE = 'inventory.write';

    public const SHIFT_OPEN = 'shift.open';

    public const SHIFT_CLOSE = 'shift.close';

    public const CASH_READ = 'cash.read';

    public const CASH_ADJUST = 'cash.adjust';

    public const REGISTER_READ = 'register.read';

    public const REGISTER_MANAGE = 'register.manage';

    public const EXPENSE_CREATE = 'expense.create';

    public const EXPENSE_READ = 'expense.read';

    public const ADVANCE_CREATE = 'advance.create';

    public const ADVANCE_READ = 'advance.read';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::AUTH_LOGIN,
            self::USER_CREATE,
            self::USER_READ,
            self::USER_UPDATE,
            self::USER_DELETE,
            self::CATEGORY_CREATE,
            self::CATEGORY_READ,
            self::CATEGORY_UPDATE,
            self::CATEGORY_DELETE,
            self::PRODUCT_CREATE,
            self::PRODUCT_READ,
            self::PRODUCT_UPDATE,
            self::PRODUCT_DELETE,
            self::ORDER_CREATE,
            self::ORDER_READ,
            self::ORDER_UPDATE,
            self::ORDER_DELETE,
            self::PAYMENT_CREATE,
            self::CUSTOMER_CREATE,
            self::CUSTOMER_READ,
            self::CUSTOMER_UPDATE,
            self::CUSTOMER_DELETE,
            self::CREDIT_READ,
            self::CREDIT_WRITE,
            self::INVENTORY_READ,
            self::INVENTORY_WRITE,
            self::SHIFT_OPEN,
            self::SHIFT_CLOSE,
            self::CASH_READ,
            self::CASH_ADJUST,
            self::REGISTER_READ,
            self::REGISTER_MANAGE,
            self::EXPENSE_CREATE,
            self::EXPENSE_READ,
            self::ADVANCE_CREATE,
            self::ADVANCE_READ,
        ];
    }
}
