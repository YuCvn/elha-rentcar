<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GuestController extends Controller
{
    /**
     * Memastikan data armada terisi jika database masih kosong.
     */
    public function ensureFleetSeeded(): void
    {
        if (Car::query()->count() === 0) {
            app(DatabaseSeeder::class)->run();
        }
    }

    /**
     * Halaman Utama Publik untuk Calon Pembeli (Guest).
     */
    public function welcome(Request $request): Response
    {
        $this->ensureFleetSeeded();

        $cars = Car::query()
            ->orderByRaw("CASE status WHEN 'available' THEN 1 WHEN 'rented' THEN 2 ELSE 3 END")
            ->orderBy('price_per_day')
            ->get();

        $lookupCode = trim((string) $request->query('code', ''));
        $lookedUpBooking = null;

        if ($lookupCode !== '') {
            $lookedUpBooking = Booking::query()
                ->with('car')
                ->where('booking_code', strtoupper($lookupCode))
                ->first();
        }

        return Inertia::render('welcome', [
            'cars' => $cars,
            'lookupCode' => $lookupCode,
            'lookedUpBooking' => $lookedUpBooking,
            'stats' => [
                'total_cars' => $cars->count(),
                'available_cars' => $cars->where('status', 'available')->count(),
                'total_trips' => (int) $cars->sum('total_trips'),
                'avg_rating' => round((float) ($cars->avg('rating') ?? 4.95), 2),
            ],
        ]);
    }

    /**
     * Calon Pembeli membuat pesanan baru dari halaman Guest.
     * Pesanan otomatis berstatus 'pending' dan langsung masuk ke notifikasi Marketing.
     */
    public function storeBooking(Request $request): RedirectResponse
    {
        $this->ensureFleetSeeded();

        if ($request->has('customer_phone')) {
            $cleanPhone = preg_replace('/[\s\-]/', '', (string) $request->input('customer_phone'));
            $request->merge(['customer_phone' => $cleanPhone]);
        }

        /** @var array{
         *   car_id: int,
         *   customer_name: string,
         *   customer_phone: string,
         *   customer_email?: string|null,
         *   customer_address: string,
         *   start_date: string,
         *   end_date: string,
         *   with_driver?: bool,
         *   pickup_location?: string|null,
         *   return_location?: string|null,
         *   payment_method?: string|null,
         *   notes?: string|null,
         *   plate_option?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'car_id' => ['required', 'integer', 'exists:cars,id'],
            'customer_name' => ['required', 'string', 'min:3', 'max:120'],
            'customer_phone' => ['required', 'string', 'regex:/^(?:\+62|62|0)8[0-9]{8,12}$/'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_address' => ['required', 'string', 'min:5', 'max:500'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'with_driver' => ['nullable', 'boolean'],
            'pickup_location' => ['nullable', 'string', 'max:200'],
            'return_location' => ['nullable', 'string', 'max:200'],
            'payment_method' => ['nullable', 'string', Rule::in(['qris', 'transfer_bank', 'ewallet', 'cash'])],
            'notes' => ['nullable', 'string', 'max:500'],
            'plate_option' => ['nullable', 'string', Rule::in(['free', 'specific'])],
        ], [
            'customer_name.min' => 'Nama lengkap minimal 3 karakter.',
            'customer_phone.regex' => 'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia diawali 08 atau +628 (10-14 digit angka).',
            'customer_address.min' => 'Alamat domisili minimal 5 karakter.',
        ]);

        /** @var Car $car */
        $car = Car::query()->findOrFail((int) $validated['car_id']);

        $plateOption = (string) ($validated['plate_option'] ?? 'free');
        $plateNote = $plateOption === 'specific'
            ? "[Preferensi Plat: Spesifik ({$car->license_plate})]"
            : '[Preferensi Plat: Bebas / Rekomendasi Marketing]';
        $finalNotes = trim($plateNote.' '.((string) ($validated['notes'] ?? '')));

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
            'user_id' => null,
            'car_id' => $car->id,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_address' => $validated['customer_address'],
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_days' => $totalDays,
            'with_driver' => $withDriver,
            'pickup_location' => ! empty($validated['pickup_location']) ? $validated['pickup_location'] : 'Kantor Elha Rent Car Subang',
            'return_location' => ! empty($validated['return_location']) ? $validated['return_location'] : 'Kantor Elha Rent Car Subang',
            'car_price_per_day' => $car->price_per_day,
            'driver_fee_total' => $driverFeeTotal,
            'total_price' => $totalPrice,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => $validated['payment_method'] ?? 'transfer_bank',
            'notes' => $finalNotes !== '' ? $finalNotes : null,
        ]);

        return redirect()->route('home', ['code' => $booking->booking_code])->with('toast', [
            'type' => 'success',
            'message' => "Pesanan {$booking->booking_code} berhasil dibuat! Tim Marketing Elha akan segera menghubungi WhatsApp Anda.",
        ]);
    }

    /**
     * Beralih peran untuk keperluan simulasi alur kerja (Guest, Marketing, Admin, Owner).
     */
    public function switchRole(Request $request): RedirectResponse
    {
        $this->ensureFleetSeeded();

        /** @var array{role: string} $validated */
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'owner', 'marketing', 'guest'])],
        ]);

        $targetRole = $validated['role'];

        if ($targetRole === 'guest') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('home')->with('toast', [
                'type' => 'info',
                'message' => 'Anda sekarang berada di Halaman Guest (Calon Pembeli). Silakan pilih & pesan mobil.',
            ]);
        }

        $emailMap = [
            'admin' => 'admin@elha.co.id',
            'owner' => 'owner@elha.co.id',
            'marketing' => 'marketing@elha.co.id',
        ];

        $email = $emailMap[$targetRole] ?? 'admin@elha.co.id';
        $user = User::query()->where('email', $email)->first();

        if ($user !== null) {
            Auth::login($user);
            $roleLabel = match ($user->role) {
                'owner' => 'Owner / Direktur',
                'marketing' => 'Marketing & Sales',
                default => 'Admin Operasional',
            };

            return redirect()->route('dashboard')->with('toast', [
                'type' => 'success',
                'message' => "Berhasil beralih akun ke {$roleLabel} ({$user->name}).",
            ]);
        }

        return back();
    }
}
