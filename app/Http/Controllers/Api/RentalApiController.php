<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RentalApiController extends Controller
{
    private function ensureFleetSeeded(): void
    {
        if (Car::query()->count() === 0) {
            app(DatabaseSeeder::class)->run();
        }
    }

    public function stats(): JsonResponse
    {
        $this->ensureFleetSeeded();

        $cars = Car::query()->get();
        $bookings = Booking::query()->get();

        return response()->json([
            'status' => 'success',
            'app' => 'Elha RentCar Mobile API v1',
            'data' => [
                'total_cars' => $cars->count(),
                'available_cars' => $cars->where('status', 'available')->count(),
                'rented_cars' => $cars->where('status', 'rented')->count(),
                'maintenance_cars' => $cars->where('status', 'maintenance')->count(),
                'total_bookings' => $bookings->count(),
                'active_bookings' => $bookings->whereIn('status', ['pending', 'confirmed', 'ongoing'])->count(),
            ],
        ]);
    }

    public function cars(Request $request): JsonResponse
    {
        $this->ensureFleetSeeded();

        $query = Car::query();

        $category = $request->query('category');
        if (is_string($category) && $category !== '' && $category !== 'all') {
            $query->where('category', $category);
        }

        $status = $request->query('status');
        if (is_string($status) && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $transmission = $request->query('transmission');
        if (is_string($transmission) && $transmission !== '' && $transmission !== 'all') {
            $query->where('transmission', $transmission);
        }

        $cars = $query->orderBy('price_per_day')->get();

        return response()->json([
            'status' => 'success',
            'count' => $cars->count(),
            'data' => $cars,
        ]);
    }

    public function showCar(Car $car): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $car,
        ]);
    }

    public function storeBooking(Request $request): JsonResponse
    {
        /** @var array{
         *   car_id: int,
         *   customer_name: string,
         *   customer_phone: string,
         *   customer_email?: string|null,
         *   customer_identity_number?: string|null,
         *   start_date: string,
         *   end_date: string,
         *   with_driver?: bool,
         *   pickup_location?: string|null,
         *   return_location?: string|null,
         *   payment_method?: string|null,
         *   notes?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'car_id' => ['required', 'integer', 'exists:cars,id'],
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_identity_number' => ['nullable', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'with_driver' => ['nullable', 'boolean'],
            'pickup_location' => ['nullable', 'string', 'max:200'],
            'return_location' => ['nullable', 'string', 'max:200'],
            'payment_method' => ['nullable', 'string', Rule::in(['qris', 'transfer_bank', 'ewallet', 'cash'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        /** @var Car $car */
        $car = Car::query()->findOrFail((int) $validated['car_id']);

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->startOfDay();
        $daysDiff = (int) $startDate->diffInDays($endDate);
        $totalDays = max(1, $daysDiff);

        $withDriver = (bool) ($validated['with_driver'] ?? false);
        $driverFeeTotal = $withDriver ? ($car->with_driver_price * $totalDays) : 0;
        $totalPrice = ($car->price_per_day * $totalDays) + $driverFeeTotal;

        $bookingCode = 'ELH-'.now()->format('Ym').'-'.strtoupper(Str::random(4));

        $booking = Booking::query()->create([
            'booking_code' => $bookingCode,
            'user_id' => $request->user()?->id,
            'car_id' => $car->id,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_identity_number' => $validated['customer_identity_number'] ?? null,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_days' => $totalDays,
            'with_driver' => $withDriver,
            'pickup_location' => ! empty($validated['pickup_location']) ? $validated['pickup_location'] : 'Kantor Pusat Elha RentCar',
            'return_location' => ! empty($validated['return_location']) ? $validated['return_location'] : 'Kantor Pusat Elha RentCar',
            'car_price_per_day' => $car->price_per_day,
            'driver_fee_total' => $driverFeeTotal,
            'total_price' => $totalPrice,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => $validated['payment_method'] ?? 'qris',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Booking berhasil dibuat melalui Mobile API',
            'data' => $booking->load('car'),
        ], 201);
    }

    public function lookupBooking(string $bookingCode): JsonResponse
    {
        $booking = Booking::query()
            ->with('car')
            ->where('booking_code', strtoupper(trim($bookingCode)))
            ->first();

        if ($booking === null) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kode booking tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $booking,
        ]);
    }
}
