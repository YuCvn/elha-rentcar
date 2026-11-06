<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Dashboard Operasional Admin:
     * - Antrean Konfirmasi Pesanan yang telah diverifikasi Marketing (status: waiting_admin)
     * - Status Kesiapan Armada (Siap Pakai, Sedang Disewa, Servis)
     * - Jadwal Serah Terima dan Pengembalian Mobil
     */
    public function dashboard(Request $request): Response
    {
        $cars = Car::query()->orderBy('name')->get();
        $bookings = Booking::query()
            ->with(['car', 'user'])
            ->latest()
            ->get();

        $waitingAdminBookings = $bookings
            ->where('status', 'waiting_admin')
            ->values();

        $pendingLeads = $bookings
            ->where('status', 'pending')
            ->values();

        $totalCars = max(1, $cars->count());
        $rentedCars = $cars->where('status', 'rented')->count();

        return Inertia::render('dashboard', [
            'userRole' => 'admin',
            'stats' => [
                'total_cars' => $cars->count(),
                'available_cars' => $cars->where('status', 'available')->count(),
                'rented_cars' => $rentedCars,
                'maintenance_cars' => $cars->where('status', 'maintenance')->count(),
                'total_bookings' => $bookings->count(),
                'active_bookings' => $bookings->whereIn('status', ['pending', 'waiting_admin', 'confirmed', 'ongoing'])->count(),
                'waiting_admin_count' => $waitingAdminBookings->count(),
                'new_leads_count' => $pendingLeads->count(),
                'paid_revenue' => (int) $bookings->where('payment_status', 'paid')->where('status', '!=', 'cancelled')->sum('total_price'),
                'dp_revenue' => (int) $bookings->where('payment_status', 'dp')->where('status', '!=', 'cancelled')->sum(fn (Booking $b) => (int) ($b->total_price * 0.5)),
                'potential_revenue' => (int) $bookings->where('status', '!=', 'cancelled')->sum('total_price'),
                'driver_revenue' => (int) $bookings->where('status', '!=', 'cancelled')->where('with_driver', true)->sum('driver_fee_total'),
                'car_only_revenue' => max(0, (int) $bookings->where('status', '!=', 'cancelled')->sum('total_price') - (int) $bookings->where('status', '!=', 'cancelled')->where('with_driver', true)->sum('driver_fee_total')),
                'utilization_rate' => round(($rentedCars / $totalCars) * 100, 1),
            ],
            'recentBookings' => $bookings->take(15)->values(),
            'pendingLeads' => $pendingLeads,
            'waitingAdminBookings' => $waitingAdminBookings,
            'topCars' => Car::query()->withCount('bookings')->orderByDesc('total_trips')->take(5)->get(),
            'cars' => $cars,
        ]);
    }

    /**
     * Halaman Daftar Pesanan untuk Admin.
     */
    public function bookings(Request $request): Response
    {
        $cars = Car::query()->orderBy('name')->get();
        $bookings = Booking::query()
            ->with(['car', 'user'])
            ->latest()
            ->get();

        return Inertia::render('bookings/index', [
            'userRole' => 'admin',
            'bookings' => $bookings,
            'cars' => $cars,
            'stats' => [
                'total' => $bookings->count(),
                'pending' => $bookings->where('status', 'pending')->count(),
                'waiting_admin' => $bookings->where('status', 'waiting_admin')->count(),
                'confirmed' => $bookings->where('status', 'confirmed')->count(),
                'ongoing' => $bookings->where('status', 'ongoing')->count(),
                'completed' => $bookings->where('status', 'completed')->count(),
                'cancelled' => $bookings->where('status', 'cancelled')->count(),
            ],
        ]);
    }

    /**
     * Admin memeriksa kelengkapan KTP, SIM, KK, serta bukti bayar dari Marketing,
     * lalu menyetujui pesanan (status: confirmed).
     */
    public function confirmBooking(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isOwner()) {
            abort(403, 'Owner hanya memiliki akses melihat transaksi (Read-Only).');
        }

        if ($user->isMarketing()) {
            abort(403, 'Hanya Admin yang dapat mengonfirmasi pesanan.');
        }

        if ($booking->checkIsLocked()) {
            abort(403, 'Transaksi ini sudah dikonfirmasi Admin dan lunas, tidak dapat diubah lagi.');
        }

        $booking->update([
            'status' => 'confirmed',
            'confirmed_by_admin_at' => now(),
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Pesanan {$booking->booking_code} ({$booking->customer_name}) berhasil dikonfirmasi oleh Admin!",
        ]);
    }

    /**
     * Admin mengelola status operasional pesanan: ongoing, completed, atau cancelled.
     * Aturan: Jika transaksi sudah dikonfirmasi admin dan sudah lunas, transaksi terkunci dan tidak dapat diubah lagi.
     */
    public function updateBookingStatus(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isOwner()) {
            abort(403, 'Owner hanya memiliki akses melihat transaksi (Read-Only).');
        }

        if ($user->isMarketing()) {
            abort(403, 'Marketing tidak memiliki izin untuk mengubah status operasional.');
        }

        if (in_array($request->input('status'), ['pending', 'waiting_admin'], true)) {
            abort(422, 'Admin tidak dapat mengembalikan status ke Pesanan Baru atau Menunggu Konfirmasi Admin.');
        }

        /** @var array{status?: string|null, payment_status?: string|null} $validated */
        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in(['ongoing', 'completed', 'cancelled'])],
            'payment_status' => ['nullable', 'string', Rule::in(['unpaid', 'dp', 'paid'])],
        ]);

        $newStatus = $validated['status'] ?? $booking->status;
        $targetPaymentStatus = $validated['payment_status'] ?? $booking->payment_status;

        // Aturan Kritis: Ketika baru DP / Belum Bayar, mobil TIDAK BISA dijalankan. Harus lunas dulu.
        if ($newStatus === 'ongoing' && $targetPaymentStatus !== 'paid') {
            abort(422, 'Mobil tidak dapat dijalankan / diserahterimakan karena belum Lunas (status pembayaran masih DP / Belum Bayar). Pembayaran harus dilunasi terlebih dahulu sebelum serah terima unit.');
        }

        // Pengecekan Kunci: Jika sudah dikonfirmasi dan berstatus lunas
        if ($booking->checkIsLocked()) {
            // Admin tidak boleh membatalkan atau mengubah status bayar transaksi yang sudah lunas
            if (isset($validated['payment_status']) && $validated['payment_status'] !== 'paid') {
                abort(403, 'Transaksi ini sudah lunas dan dikonfirmasi, status pembayaran tidak dapat diubah.');
            }

            if ($newStatus === 'cancelled') {
                abort(403, 'Transaksi yang sudah dikonfirmasi dan lunas tidak dapat dibatalkan.');
            }

            if ($booking->status === 'completed' && $newStatus !== 'completed') {
                abort(403, 'Transaksi ini sudah selesai (completed) dan tidak dapat diubah statusnya lagi.');
            }
        }

        $car = $booking->car;
        $updateData = [];

        if (! empty($validated['status'])) {
            $updateData['status'] = $newStatus;

            if ($newStatus === 'ongoing' && $car !== null) {
                $car->update(['status' => 'rented']);
            } elseif ($newStatus === 'completed' && $car !== null) {
                $car->update([
                    'status' => 'available',
                    'total_trips' => $car->total_trips + 1,
                ]);
            } elseif ($newStatus === 'cancelled' && $car !== null && $car->status === 'rented') {
                $car->update(['status' => 'available']);
            }
        }

        if (! empty($validated['payment_status'])) {
            $updateData['payment_status'] = $validated['payment_status'];
        }

        if (! empty($updateData)) {
            $booking->update($updateData);
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Pesanan {$booking->booking_code} berhasil diperbarui (Status: {$newStatus}, Pembayaran: {$targetPaymentStatus}).",
        ]);
    }

    /**
     * Admin membuat pesanan manual langsung dari sistem internal.
     */
    public function storeBooking(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isOwner()) {
            abort(403, 'Owner hanya memiliki hak akses melihat transaksi (Read-Only).');
        }

        if ($request->has('customer_phone')) {
            $cleanPhone = preg_replace('/[\s\-]/', '', (string) $request->input('customer_phone'));
            $request->merge(['customer_phone' => $cleanPhone]);
        }
        if ($request->has('customer_identity_number') && $request->input('customer_identity_number') !== null) {
            $cleanKtp = preg_replace('/\D/', '', (string) $request->input('customer_identity_number'));
            $request->merge(['customer_identity_number' => $cleanKtp]);
        }

        /** @var array{
         *   car_id: int,
         *   customer_name: string,
         *   customer_phone: string,
         *   customer_email?: string|null,
         *   customer_address?: string|null,
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
            'customer_name' => ['required', 'string', 'min:3', 'max:120'],
            'customer_phone' => ['required', 'string', 'regex:/^(?:\+62|62|0)8[0-9]{8,12}$/'],
            'customer_email' => ['nullable', 'email', 'max:120'],
            'customer_address' => ['nullable', 'string', 'min:5', 'max:500'],
            'customer_identity_number' => ['nullable', 'string', 'regex:/^[0-9]{16}$/'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'with_driver' => ['nullable', 'boolean'],
            'pickup_location' => ['nullable', 'string', 'max:200'],
            'return_location' => ['nullable', 'string', 'max:200'],
            'payment_method' => ['nullable', 'string', Rule::in(['qris', 'transfer_bank', 'ewallet', 'cash'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ], [
            'customer_name.min' => 'Nama lengkap minimal 3 karakter.',
            'customer_phone.regex' => 'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia diawali 08 atau +628 (10-14 digit angka).',
            'customer_identity_number.regex' => 'Nomor Identitas NIK KTP harus tepat 16 digit angka.',
            'customer_address.min' => 'Alamat lengkap domisili minimal 5 karakter.',
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
            'user_id' => $user->id,
            'car_id' => $car->id,
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'customer_email' => $validated['customer_email'] ?? null,
            'customer_address' => $validated['customer_address'] ?? null,
            'customer_identity_number' => $validated['customer_identity_number'] ?? null,
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
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Pesanan manual {$booking->booking_code} berhasil dibuat!",
        ]);
    }

    /**
     * Menghapus pesanan.
     * Aturan: Transaksi yang sudah dikonfirmasi dan lunas tidak dapat dihapus.
     */
    public function destroyBooking(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isOwner()) {
            abort(403, 'Owner hanya memiliki hak akses melihat transaksi (Read-Only).');
        }

        if ($user->isMarketing()) {
            abort(403, 'Marketing tidak memiliki izin menghapus transaksi.');
        }

        if ($booking->checkIsLocked()) {
            abort(403, 'Transaksi yang sudah dikonfirmasi dan berstatus lunas tidak dapat dihapus.');
        }

        $code = $booking->booking_code;
        $booking->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Pesanan {$code} berhasil dihapus.",
        ]);
    }

    /**
     * Halaman Manajemen Armada Mobil (/fleet).
     */
    public function fleet(): Response
    {
        $cars = Car::query()
            ->withCount('bookings')
            ->latest()
            ->get();

        return Inertia::render('fleet/index', [
            'cars' => $cars,
            'stats' => [
                'total' => $cars->count(),
                'available' => $cars->where('status', 'available')->count(),
                'rented' => $cars->where('status', 'rented')->count(),
                'maintenance' => $cars->where('status', 'maintenance')->count(),
            ],
        ]);
    }

    /**
     * Tambah unit mobil baru ke armada. Marketing dilarang.
     */
    public function storeCar(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isMarketing()) {
            abort(403, 'Marketing tidak memiliki izin untuk menambah armada mobil.');
        }

        /** @var array{
         *   name: string,
         *   brand: string,
         *   category: string,
         *   license_plate: string,
         *   year: int,
         *   transmission: string,
         *   fuel_type: string,
         *   seats: int,
         *   price_per_day: int,
         *   with_driver_price: int,
         *   status: string,
         *   image_url?: string|null,
         *   description?: string|null,
         *   features_text?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'brand' => ['required', 'string', 'max:60'],
            'category' => ['required', 'string', Rule::in(['MPV', 'SUV', 'City Car', 'Sedan', 'Luxury', 'EV'])],
            'license_plate' => ['required', 'string', 'max:25', 'unique:cars,license_plate'],
            'year' => ['required', 'integer', 'min:2010', 'max:2030'],
            'transmission' => ['required', 'string', Rule::in(['Automatic', 'Manual'])],
            'fuel_type' => ['required', 'string', Rule::in(['Bensin', 'Diesel', 'Hybrid', 'Listrik'])],
            'seats' => ['required', 'integer', 'min:2', 'max:20'],
            'price_per_day' => ['required', 'integer', 'min:100000'],
            'with_driver_price' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'string', Rule::in(['available', 'rented', 'maintenance'])],
            'image_url' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'features_text' => ['nullable', 'string', 'max:500'],
        ]);

        $features = ['AC Dingin', 'Bluetooth Audio', 'Sensor Parkir'];
        if (! empty($validated['features_text'])) {
            $parsed = array_values(array_filter(array_map('trim', explode(',', $validated['features_text']))));
            if (count($parsed) > 0) {
                $features = $parsed;
            }
        }

        Car::query()->create([
            'name' => $validated['name'],
            'brand' => $validated['brand'],
            'category' => $validated['category'],
            'license_plate' => strtoupper($validated['license_plate']),
            'year' => (int) $validated['year'],
            'transmission' => $validated['transmission'],
            'fuel_type' => $validated['fuel_type'],
            'seats' => (int) $validated['seats'],
            'price_per_day' => (int) $validated['price_per_day'],
            'with_driver_price' => (int) $validated['with_driver_price'],
            'status' => $validated['status'],
            'image_url' => ! empty($validated['image_url'])
                ? $validated['image_url']
                : 'https://www.elha.co.id/img/listmobil/mobil-avanza-all-new-cvt.jpeg',
            'description' => $validated['description'] ?? 'Armada terawat resmi Elha Subang siap jalan dalam & luar kota.',
            'features' => $features,
            'rating' => 5.0,
            'total_trips' => 0,
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Armada mobil baru berhasil ditambahkan!',
        ]);
    }

    /**
     * Edit data mobil di armada. Marketing dilarang.
     */
    public function updateCar(Request $request, Car $car): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isMarketing()) {
            abort(403, 'Marketing tidak memiliki izin untuk mengedit armada mobil.');
        }

        /** @var array{
         *   name: string,
         *   brand: string,
         *   category: string,
         *   license_plate: string,
         *   year: int,
         *   transmission: string,
         *   fuel_type: string,
         *   seats: int,
         *   price_per_day: int,
         *   with_driver_price: int,
         *   status: string,
         *   image_url?: string|null,
         *   description?: string|null,
         *   features_text?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'brand' => ['required', 'string', 'max:60'],
            'category' => ['required', 'string', Rule::in(['MPV', 'SUV', 'City Car', 'Sedan', 'Luxury', 'EV'])],
            'license_plate' => ['required', 'string', 'max:25', Rule::unique('cars', 'license_plate')->ignore($car->id)],
            'year' => ['required', 'integer', 'min:2010', 'max:2030'],
            'transmission' => ['required', 'string', Rule::in(['Automatic', 'Manual'])],
            'fuel_type' => ['required', 'string', Rule::in(['Bensin', 'Diesel', 'Hybrid', 'Listrik'])],
            'seats' => ['required', 'integer', 'min:2', 'max:20'],
            'price_per_day' => ['required', 'integer', 'min:100000'],
            'with_driver_price' => ['required', 'integer', 'min:0'],
            'status' => ['required', 'string', Rule::in(['available', 'rented', 'maintenance'])],
            'image_url' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'features_text' => ['nullable', 'string', 'max:500'],
        ]);

        $features = $car->features ?? ['AC Dingin', 'Bluetooth Audio'];
        if (isset($validated['features_text']) && trim($validated['features_text']) !== '') {
            $parsed = array_values(array_filter(array_map('trim', explode(',', $validated['features_text']))));
            if (count($parsed) > 0) {
                $features = $parsed;
            }
        }

        $car->update([
            'name' => $validated['name'],
            'brand' => $validated['brand'],
            'category' => $validated['category'],
            'license_plate' => strtoupper($validated['license_plate']),
            'year' => (int) $validated['year'],
            'transmission' => $validated['transmission'],
            'fuel_type' => $validated['fuel_type'],
            'seats' => (int) $validated['seats'],
            'price_per_day' => (int) $validated['price_per_day'],
            'with_driver_price' => (int) $validated['with_driver_price'],
            'status' => $validated['status'],
            'image_url' => ! empty($validated['image_url']) ? $validated['image_url'] : $car->image_url,
            'description' => $validated['description'] ?? $car->description,
            'features' => $features,
        ]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Data mobil {$car->name} ({$car->license_plate}) berhasil diperbarui!",
        ]);
    }

    /**
     * Ubah status ketersediaan mobil secara cepat (available, rented, maintenance). Marketing dilarang.
     */
    public function updateCarStatus(Request $request, Car $car): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isMarketing()) {
            abort(403, 'Marketing tidak memiliki izin untuk mengubah status armada mobil.');
        }

        /** @var array{status: string} $validated */
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['available', 'rented', 'maintenance'])],
        ]);

        $car->update(['status' => $validated['status']]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Status mobil {$car->name} berhasil diubah menjadi {$validated['status']}.",
        ]);
    }

    /**
     * Hapus mobil dari sistem. Marketing dilarang.
     */
    public function destroyCar(Request $request, Car $car): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isMarketing()) {
            abort(403, 'Marketing tidak memiliki izin untuk menghapus armada mobil.');
        }

        $name = $car->name;
        $car->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Mobil {$name} berhasil dihapus dari armada.",
        ]);
    }

    /**
     * Panduan Integrasi Android & Mobile API v1.
     */
    public function androidGuide(): Response
    {
        return Inertia::render('android-guide', [
            'apiEndpoints' => [],
        ]);
    }
}
