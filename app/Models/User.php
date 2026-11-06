<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string $role
 * @property string|null $identity_number
 * @property string|null $address
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'phone', 'role', 'identity_number', 'address', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isMarketing(): bool
    {
        return $this->role === 'marketing';
    }

    public function isCustomer(): bool
    {
        return in_array($this->role, ['customer', 'guest'], true);
    }

    /**
     * @return array{label: string, className: string}
     */
    public function getRoleBadge(): array
    {
        return match ($this->role) {
            'owner' => [
                'label' => 'Owner / Direktur',
                'className' => 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400',
            ],
            'marketing' => [
                'label' => 'Marketing & Sales',
                'className' => 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
            ],
            'customer', 'guest' => [
                'label' => 'Konsumen / Penyewa',
                'className' => 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
            ],
            default => [
                'label' => 'Admin Operasional',
                'className' => 'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',
            ],
        };
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            /* @chisel-2fa */
            'two_factor_confirmed_at' => 'datetime',
            /* @end-chisel-2fa */
        ];
    }
}
