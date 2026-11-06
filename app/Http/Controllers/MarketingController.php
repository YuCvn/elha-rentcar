<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MarketingController extends Controller
{
    /**
     * Helper penyimpanan file upload (KTP, SIM, KK, Bukti Transfer) ke direktori publik.
     */
    private function saveUploadedDocument(?UploadedFile $file, string $prefix): ?string
    {
        if ($file === null) {
            return null;
        }

        $uploadDir = public_path('uploads/bookings');
        if (! File::exists($uploadDir)) {
            File::makeDirectory($uploadDir, 0755, true);
        }

        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = $prefix.'_'.now()->format('YmdHis').'_'.Str::random(6).'.'.$ext;
        $file->move($uploadDir, $filename);

        return '/uploads/bookings/'.$filename;
    }

    /**
     * Dashboard Khusus Marketing:
     * - Hanya melihat notifikasi pesanan baru (pending) dan transaksi miliknya sendiri
     * - Akun marketing lain tidak dapat melihat transaksi marketing ini
     */
    public function dashboard(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        // Hanya mobil yang tersedia untuk penawaran marketing
        $availableCars = Car::query()
            ->where('status', 'available')
            ->orderBy('name')
            ->get();

        // Pesanan baru dari Calon Pembeli (belum diklaim/ditangani oleh staf manapun atau milik staf ini)
        $pendingLeads = Booking::query()
            ->with(['car', 'user'])
            ->where('status', 'pending')
            ->where(function ($q) use ($user) {
                $q->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            })
            ->latest()
            ->get();

        // Laporan marketing ini yang sedang menunggu konfirmasi Admin
        $waitingAdminBookings = Booking::query()
            ->with(['car', 'user'])
            ->where('user_id', $user->id)
            ->where('status', 'waiting_admin')
            ->latest()
            ->get();

        // Riwayat transaksi milik marketing ini yang telah dikonfirmasi / berjalan
        $confirmedBookings = Booking::query()
            ->with(['car', 'user'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['confirmed', 'ongoing', 'completed'])
            ->latest()
            ->get();

        // Seluruh transaksi khusus staf marketing ini saja
        $myBookings = Booking::query()
            ->with(['car', 'user'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $dpRevenue = (int) $myBookings
            ->where('payment_status', 'dp')
            ->where('status', '!=', 'cancelled')
            ->sum(fn (Booking $b) => (int) ($b->total_price * 0.5));

        $paidRevenue = (int) $myBookings
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        return Inertia::render('dashboard', [
            'userRole' => 'marketing',
            'stats' => [
                'total_cars' => $availableCars->count(),
                'available_cars' => $availableCars->count(),
                'rented_cars' => 0,
                'maintenance_cars' => 0,
                'total_bookings' => $myBookings->count(),
                'active_bookings' => $myBookings->whereIn('status', ['pending', 'waiting_admin', 'confirmed', 'ongoing'])->count(),
                'waiting_admin_count' => $waitingAdminBookings->count(),
                'new_leads_count' => $pendingLeads->count(),
                'paid_revenue' => $paidRevenue,
                'dp_revenue' => $dpRevenue,
                'potential_revenue' => (int) $myBookings->where('status', '!=', 'cancelled')->sum('total_price'),
                'driver_revenue' => (int) $myBookings->where('status', '!=', 'cancelled')->where('with_driver', true)->sum('driver_fee_total'),
                'car_only_revenue' => max(0, (int) $myBookings->where('status', '!=', 'cancelled')->sum('total_price') - (int) $myBookings->where('status', '!=', 'cancelled')->where('with_driver', true)->sum('driver_fee_total')),
                'utilization_rate' => 0,
            ],
            'recentBookings' => $myBookings->take(15)->values(),
            'pendingLeads' => $pendingLeads,
            'waitingAdminBookings' => $waitingAdminBookings,
            'confirmedBookings' => $confirmedBookings,
            'topCars' => $availableCars->take(5),
            'cars' => $availableCars,
        ]);
    }

    /**
     * Marketing memverifikasi data calon pembeli via WhatsApp,
     * menginput KTP, SIM, KK, jadwal final, bukti transaksi, dan meneruskannya ke Admin.
     * Hanya staf marketing yang mengklaim pesanan yang dapat mengubahnya.
     */
    public function verifyBooking(Request $request, Booking $booking): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($currentUser->isOwner()) {
            abort(403, 'Owner hanya memiliki akses melihat transaksi (Read-Only).');
        }

        if ($booking->checkIsLocked()) {
            abort(403, 'Transaksi ini sudah dikonfirmasi Admin dan lunas, tidak dapat diubah lagi.');
        }

        if ($booking->user_id !== null && $booking->user_id !== $currentUser->id) {
            abort(403, 'Pesanan ini sudah ditangani oleh staf marketing lain.');
        }

        $ktpClean = preg_replace('/\D/', '', (string) $request->input('customer_ktp_number'));
        $simClean = preg_replace('/\D/', '', (string) $request->input('customer_sim_number'));
        $kkClean = preg_replace('/\D/', '', (string) $request->input('customer_kk_number'));
        $request->merge([
            'customer_ktp_number' => $ktpClean,
            'customer_sim_number' => $simClean,
            'customer_kk_number' => $kkClean,
        ]);

        /** @var array{
         *   car_id?: int|null,
         *   customer_ktp_number: string,
         *   customer_sim_number: string,
         *   customer_kk_number: string,
         *   customer_address?: string|null,
         *   start_date: string,
         *   end_date: string,
         *   with_driver?: bool,
         *   pickup_location?: string|null,
         *   return_location?: string|null,
         *   payment_method: string,
         *   payment_status: string,
         *   marketing_notes?: string|null
         * } $validated
         */
        $validated = $request->validate([
            'car_id' => ['nullable', 'integer', 'exists:cars,id'],
            'customer_ktp_number' => ['required', 'string', 'regex:/^[0-9]{16}$/'],
            'customer_sim_number' => ['required', 'string', 'regex:/^[0-9]{12,16}$/'],
            'customer_kk_number' => ['required', 'string', 'regex:/^[0-9]{16}$/'],
            'customer_address' => ['nullable', 'string', 'min:5', 'max:500'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'with_driver' => ['nullable', 'boolean'],
            'pickup_location' => ['nullable', 'string', 'max:200'],
            'return_location' => ['nullable', 'string', 'max:200'],
            'payment_method' => ['required', 'string', Rule::in(['qris', 'transfer_bank', 'ewallet', 'cash'])],
            'payment_status' => ['required', 'string', Rule::in(['dp', 'paid'])],
            'marketing_notes' => ['nullable', 'string', 'max:1000'],
            'ktp_photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'sim_photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'kk_photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'customer_ktp_number.regex' => 'Nomor NIK KTP harus terdiri dari tepat 16 digit angka.',
            'customer_sim_number.regex' => 'Nomor SIM A harus terdiri dari 12 hingga 16 digit angka.',
            'customer_kk_number.regex' => 'Nomor Kartu Keluarga (KK) harus terdiri dari tepat 16 digit angka.',
            'customer_address.min' => 'Alamat lengkap domisili minimal 5 karakter.',
        ]);

        $targetCarId = ! empty($validated['car_id']) ? (int) $validated['car_id'] : $booking->car_id;
        /** @var Car $car */
        $car = Car::query()->findOrFail($targetCarId);

        $carChangeNote = '';
        if ($targetCarId !== $booking->car_id) {
            $oldPlate = $booking->car !== null ? $booking->car->license_plate : 'Lama';
            $carChangeNote = " [Unit dipindah oleh Marketing dari plat {$oldPlate} ke {$car->license_plate}]";
        }

        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->startOfDay();
        $daysDiff = (int) $startDate->diffInDays($endDate);
        $totalDays = max(1, $daysDiff);

        $withDriver = (bool) ($validated['with_driver'] ?? $booking->with_driver);
        $carPricePerDay = $car->price_per_day;
        $driverRate = $car->with_driver_price;
        $driverFeeTotal = $withDriver ? ($driverRate * $totalDays) : 0;
        $totalPrice = ($carPricePerDay * $totalDays) + $driverFeeTotal;

        $ktpPhotoUrl = $this->saveUploadedDocument($request->file('ktp_photo'), 'ktp') ?? $booking->ktp_photo_url;
        $simPhotoUrl = $this->saveUploadedDocument($request->file('sim_photo'), 'sim') ?? $booking->sim_photo_url;
        $kkPhotoUrl = $this->saveUploadedDocument($request->file('kk_photo'), 'kk') ?? $booking->kk_photo_url;
        $paymentProofUrl = $this->saveUploadedDocument($request->file('payment_proof'), 'bukti') ?? $booking->payment_proof_url;

        $booking->update([
            'user_id' => $currentUser->id,
            'car_id' => $car->id,
            'customer_identity_number' => $validated['customer_ktp_number'],
            'customer_ktp_number' => $validated['customer_ktp_number'],
            'customer_sim_number' => $validated['customer_sim_number'],
            'customer_kk_number' => $validated['customer_kk_number'],
            'customer_address' => ! empty($validated['customer_address']) ? $validated['customer_address'] : $booking->customer_address,
            'ktp_photo_url' => $ktpPhotoUrl,
            'sim_photo_url' => $simPhotoUrl,
            'kk_photo_url' => $kkPhotoUrl,
            'payment_proof_url' => $paymentProofUrl,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_days' => $totalDays,
            'with_driver' => $withDriver,
            'pickup_location' => ! empty($validated['pickup_location']) ? $validated['pickup_location'] : $booking->pickup_location,
            'return_location' => ! empty($validated['return_location']) ? $validated['return_location'] : $booking->return_location,
            'car_price_per_day' => $carPricePerDay,
            'driver_fee_total' => $driverFeeTotal,
            'total_price' => $totalPrice,
            'status' => 'waiting_admin',
            'payment_status' => $validated['payment_status'],
            'payment_method' => $validated['payment_method'],
            'marketing_notes' => trim(($validated['marketing_notes'] ?? ($booking->marketing_notes ?? '')).$carChangeNote),
            'verified_by_marketing_at' => now(),
        ]);

        $paymentLabel = $validated['payment_status'] === 'paid' ? 'LUNAS' : 'SUDAH DP';

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Laporan pesanan {$booking->booking_code} ({$paymentLabel}) berhasil disimpan dan diteruskan ke Admin untuk dikonfirmasi!",
        ]);
    }

    /**
     * Marketing membuat pesanan transaksi baru secara manual.
     * Otomatis terikat pada user_id marketing yang sedang login.
     */
    public function storeBooking(Request $request): RedirectResponse
    {
        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($currentUser->isOwner()) {
            abort(403, 'Owner hanya memiliki akses melihat transaksi (Read-Only).');
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
            'user_id' => $currentUser->id,
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
            'message' => "Pesanan {$booking->booking_code} berhasil dibuat oleh Marketing ({$currentUser->name})!",
        ]);
    }

    /**
     * Halaman Daftar Pesanan Khusus Marketing:
     * Hanya menampilkan transaksi yang ditangani oleh dirinya sendiri
     * ditambah antrean leads baru yang belum diklaim staf lain.
     */
    public function bookings(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $availableCars = Car::query()->where('status', 'available')->orderBy('name')->get();

        $bookings = Booking::query()
            ->with(['car', 'user'])
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhere(function ($sub) {
                        $sub->whereNull('user_id')->where('status', 'pending');
                    });
            })
            ->latest()
            ->get();

        return Inertia::render('bookings/index', [
            'userRole' => 'marketing',
            'currentUserId' => $user->id,
            'bookings' => $bookings,
            'cars' => $availableCars,
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
     * Halaman Khusus Armada untuk Marketing:
     * HANYA berisi kendaraan yang berstatus TERSEDIA (Available), Read-Only tanpa aksi edit.
     */
    public function fleet(Request $request): Response
    {
        $availableCars = Car::query()
            ->where('status', 'available')
            ->orderBy('price_per_day')
            ->get();

        return Inertia::render('fleet/marketing', [
            'cars' => $availableCars,
            'stats' => [
                'total_ready' => $availableCars->count(),
            ],
        ]);
    }
}
