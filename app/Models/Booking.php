<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $booking_code
 * @property int|null $user_id
 * @property int $car_id
 * @property string $customer_name
 * @property string $customer_phone
 * @property string|null $customer_email
 * @property string|null $customer_address
 * @property string|null $customer_identity_number
 * @property string|null $customer_ktp_number
 * @property string|null $customer_sim_number
 * @property string|null $customer_kk_number
 * @property string|null $ktp_photo_url
 * @property string|null $sim_photo_url
 * @property string|null $kk_photo_url
 * @property string|null $payment_proof_url
 * @property Carbon $start_date
 * @property Carbon $end_date
 * @property int $total_days
 * @property bool $with_driver
 * @property string $pickup_location
 * @property string $return_location
 * @property int $car_price_per_day
 * @property int $driver_fee_total
 * @property int $total_price
 * @property string $status
 * @property string $payment_status
 * @property string $payment_method
 * @property string|null $notes
 * @property string|null $marketing_notes
 * @property Carbon|null $verified_by_marketing_at
 * @property Carbon|null $confirmed_by_admin_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read bool $is_locked
 * @property-read Car|null $car
 * @property-read User|null $user
 */
#[Fillable([
    'booking_code',
    'user_id',
    'car_id',
    'customer_name',
    'customer_phone',
    'customer_email',
    'customer_address',
    'customer_identity_number',
    'customer_ktp_number',
    'customer_sim_number',
    'customer_kk_number',
    'ktp_photo_url',
    'sim_photo_url',
    'kk_photo_url',
    'payment_proof_url',
    'start_date',
    'end_date',
    'total_days',
    'with_driver',
    'pickup_location',
    'return_location',
    'car_price_per_day',
    'driver_fee_total',
    'total_price',
    'status',
    'payment_status',
    'payment_method',
    'notes',
    'marketing_notes',
    'verified_by_marketing_at',
    'confirmed_by_admin_at',
])]
class Booking extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'total_days' => 'integer',
            'with_driver' => 'boolean',
            'car_price_per_day' => 'integer',
            'driver_fee_total' => 'integer',
            'total_price' => 'integer',
            'verified_by_marketing_at' => 'datetime',
            'confirmed_by_admin_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Memeriksa apakah transaksi sudah dikonfirmasi Admin dan sudah Lunas (Paid).
     * Jika ya, transaksi dikunci dan tidak dapat diubah lagi.
     */
    public function checkIsLocked(): bool
    {
        return ! in_array($this->status, ['pending', 'waiting_admin', 'cancelled'], true)
            && $this->confirmed_by_admin_at !== null
            && $this->payment_status === 'paid';
    }

    /**
     * @var list<string>
     */
    protected $appends = ['is_locked'];

    /**
     * @return Attribute<bool, never>
     */
    protected function isLocked(): Attribute
    {
        return Attribute::make(
            get: fn (): bool => $this->checkIsLocked(),
        );
    }
}
