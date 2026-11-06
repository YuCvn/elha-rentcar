<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $brand
 * @property string $category
 * @property string $license_plate
 * @property int $year
 * @property string $transmission
 * @property string $fuel_type
 * @property int $seats
 * @property int $price_per_day
 * @property int $with_driver_price
 * @property string $status
 * @property string|null $image_url
 * @property string|null $description
 * @property array<int, string>|null $features
 * @property float $rating
 * @property int $total_trips
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'brand',
    'category',
    'license_plate',
    'year',
    'transmission',
    'fuel_type',
    'seats',
    'price_per_day',
    'with_driver_price',
    'status',
    'image_url',
    'description',
    'features',
    'rating',
    'total_trips',
])]
class Car extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'seats' => 'integer',
            'price_per_day' => 'integer',
            'with_driver_price' => 'integer',
            'features' => 'array',
            'rating' => 'float',
            'total_trips' => 'integer',
        ];
    }

    /**
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
