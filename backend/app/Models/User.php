<?php

namespace App\Models;

use App\Enums\AccountKind;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use Notifiable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'pin_hash',
        'account_kind',
        'is_active',
        'is_superadmin',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'pin_hash',
        'remember_token',
    ];

    public function hasPermission(string $permission): bool
    {
        if ($this->is_superadmin) {
            return true;
        }

        return $this->hasPermissionTo($permission);
    }

    public function isStaff(): bool
    {
        return $this->account_kind === AccountKind::Staff;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_superadmin' => 'boolean',
            'account_kind' => AccountKind::class,
        ];
    }
}
