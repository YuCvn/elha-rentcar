<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OwnerController extends Controller
{
    /**
     * Memastikan hanya Owner yang dapat mengakses fitur ini.
     */
    private function ensureIsOwner(Request $request): void
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user === null || ! $user->isOwner()) {
            abort(403, 'Hanya Owner / Direktur yang memiliki hak akses ke fitur ini.');
        }
    }

    /**
     * Dashboard Eksekutif Owner:
     * - Finansial Lengkap (Pendapatan Lunas, Uang Muka DP, Potensi Nilai Transaksi)
     * - Performa Armada Paling Laris & Utilisasi
     * - Pintasan Download Rekap Bulanan & Kelola Staf
     */
    public function dashboard(Request $request): Response
    {
        $this->ensureIsOwner($request);

        $cars = Car::query()->orderBy('name')->get();
        $bookings = Booking::query()
            ->with(['car', 'user'])
            ->latest()
            ->get();

        $paidRevenue = (int) $bookings
            ->where('payment_status', 'paid')
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        $dpRevenue = (int) $bookings
            ->where('payment_status', 'dp')
            ->where('status', '!=', 'cancelled')
            ->sum(fn (Booking $b) => (int) ($b->total_price * 0.5));

        $potentialRevenue = (int) $bookings
            ->where('status', '!=', 'cancelled')
            ->sum('total_price');

        $driverRevenue = (int) $bookings
            ->where('status', '!=', 'cancelled')
            ->where('with_driver', true)
            ->sum('driver_fee_total');

        $totalCars = max(1, $cars->count());
        $rentedCars = $cars->where('status', 'rented')->count();

        return Inertia::render('dashboard', [
            'userRole' => 'owner',
            'stats' => [
                'total_cars' => $cars->count(),
                'available_cars' => $cars->where('status', 'available')->count(),
                'rented_cars' => $rentedCars,
                'maintenance_cars' => $cars->where('status', 'maintenance')->count(),
                'total_bookings' => $bookings->count(),
                'active_bookings' => $bookings->whereIn('status', ['pending', 'waiting_admin', 'confirmed', 'ongoing'])->count(),
                'waiting_admin_count' => $bookings->where('status', 'waiting_admin')->count(),
                'new_leads_count' => $bookings->where('status', 'pending')->count(),
                'paid_revenue' => $paidRevenue,
                'dp_revenue' => $dpRevenue,
                'potential_revenue' => $potentialRevenue,
                'driver_revenue' => $driverRevenue,
                'car_only_revenue' => max(0, $potentialRevenue - $driverRevenue),
                'utilization_rate' => round(($rentedCars / $totalCars) * 100, 1),
            ],
            'recentBookings' => $bookings->take(15)->values(),
            'pendingLeads' => $bookings->where('status', 'pending')->values(),
            'waitingAdminBookings' => $bookings->where('status', 'waiting_admin')->values(),
            'topCars' => Car::query()->withCount('bookings')->orderByDesc('total_trips')->take(5)->get(),
            'cars' => $cars,
        ]);
    }

    /**
     * Halaman Khusus Owner: Manajemen Akun Staf (/users).
     * Melihat semua akun Admin dan Marketing.
     */
    public function users(Request $request): Response
    {
        $this->ensureIsOwner($request);

        $users = User::query()
            ->withCount('bookings')
            ->orderByRaw("CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 WHEN 'marketing' THEN 3 ELSE 4 END")
            ->orderBy('name')
            ->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'stats' => [
                'total' => $users->count(),
                'owner' => $users->where('role', 'owner')->count(),
                'admin' => $users->where('role', 'admin')->count(),
                'marketing' => $users->where('role', 'marketing')->count(),
            ],
        ]);
    }

    /**
     * Owner mendaftarkan akun staf baru (Admin atau Marketing).
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $this->ensureIsOwner($request);

        /** @var array{
         *   name: string,
         *   email: string,
         *   phone?: string|null,
         *   role: string,
         *   password: string
         * } $validated
         */
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', 'string', Rule::in(['admin', 'marketing'])],
            'password' => ['required', 'string', Password::default()],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        $roleLabel = $user->role === 'marketing' ? 'Marketing' : 'Admin';

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Akun staf {$roleLabel} ({$user->name}) berhasil didaftarkan!",
        ]);
    }

    /**
     * Owner mengubah peran akun staf (Admin <-> Marketing).
     */
    public function updateUserRole(Request $request, User $user): RedirectResponse
    {
        $this->ensureIsOwner($request);

        /** @var array{role: string} $validated */
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'marketing', 'owner'])],
        ]);

        $user->update(['role' => $validated['role']]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Peran akun {$user->name} berhasil diperbarui menjadi {$validated['role']}.",
        ]);
    }

    /**
     * Owner menghapus akun staf.
     */
    public function destroyUser(Request $request, User $user): RedirectResponse
    {
        $this->ensureIsOwner($request);

        /** @var User $currentUser */
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ]);
        }

        $name = $user->name;
        $user->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Akun staf {$name} berhasil dihapus dari sistem.",
        ]);
    }

    /**
     * Owner mendownload file rekap transaksi bulanan (.csv / Excel-ready).
     */
    public function exportMonthlyReport(Request $request): StreamedResponse
    {
        $this->ensureIsOwner($request);

        $month = (string) $request->query('month', now()->format('Y-m'));
        $year = (string) $request->query('year', now()->format('Y'));

        $query = Booking::query()->with(['car', 'user'])->latest();

        if ($month !== 'all' && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $carbonMonth = Carbon::createFromFormat('Y-m', $month);
            if ($carbonMonth instanceof Carbon) {
                $query->whereBetween('start_date', [
                    $carbonMonth->startOfMonth()->toDateString(),
                    $carbonMonth->copy()->endOfMonth()->toDateString(),
                ]);
            }
            $periodLabel = "Bulan {$month}";
            $filename = "rekap-transaksi-elha-{$month}.csv";
        } elseif ($year !== 'all' && is_numeric($year)) {
            $query->whereYear('start_date', (int) $year);
            $periodLabel = "Tahun {$year}";
            $filename = "rekap-transaksi-elha-{$year}.csv";
        } else {
            $periodLabel = 'Seluruh Transaksi';
            $filename = 'rekap-transaksi-elha-all.csv';
        }

        $bookings = $query->get();

        return response()->streamDownload(function () use ($bookings, $periodLabel) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            // BOM UTF-8 agar kompatibel saat dibuka di Microsoft Excel
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['LAPORAN REKAP TRANSAKSI SEWA MOBIL - ELHA RENT CAR SUBANG']);
            fputcsv($handle, ['Periode Laporan', $periodLabel]);
            fputcsv($handle, ['Waktu Unduh', now()->format('d/m/Y H:i:s')]);
            fputcsv($handle, []);

            fputcsv($handle, [
                'No',
                'Kode Booking',
                'Waktu Pemesanan',
                'Nama Penyewa',
                'WhatsApp',
                'Alamat',
                'NIK KTP',
                'Nomor SIM A',
                'Nomor KK',
                'Mobil Disewa',
                'Plat Nomor',
                'Tgl Mulai',
                'Tgl Selesai',
                'Durasi (Hari)',
                'Layanan Sopir',
                'Lokasi Penjemputan',
                'Metode Bayar',
                'Status Bayar',
                'Status Pesanan',
                'Total Biaya (Rp)',
                'Catatan Marketing / Admin',
            ]);

            $no = 1;
            $totalPaid = 0;
            $totalDp = 0;
            $totalAll = 0;

            foreach ($bookings as $b) {
                if ($b->status !== 'cancelled') {
                    $totalAll += $b->total_price;
                    if ($b->payment_status === 'paid') {
                        $totalPaid += $b->total_price;
                    } elseif ($b->payment_status === 'dp') {
                        $totalDp += (int) ($b->total_price * 0.5);
                    }
                }

                fputcsv($handle, [
                    $no++,
                    $b->booking_code,
                    $b->created_at ? $b->created_at->format('Y-m-d H:i') : '-',
                    $b->customer_name,
                    $b->customer_phone,
                    $b->customer_address ?? '-',
                    $b->customer_ktp_number ?? $b->customer_identity_number ?? '-',
                    $b->customer_sim_number ?? '-',
                    $b->customer_kk_number ?? '-',
                    $b->car ? $b->car->name : '-',
                    $b->car ? $b->car->license_plate : '-',
                    $b->start_date->format('Y-m-d'),
                    $b->end_date->format('Y-m-d'),
                    $b->total_days,
                    $b->with_driver ? 'Dengan Sopir' : 'Lepas Kunci',
                    $b->pickup_location,
                    strtoupper($b->payment_method),
                    strtoupper($b->payment_status),
                    strtoupper($b->status),
                    $b->total_price,
                    $b->marketing_notes ?? $b->notes ?? '-',
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['RINGKASAN KEUANGAN PERIODE', $periodLabel]);
            fputcsv($handle, ['Total Jumlah Pesanan', $bookings->count()]);
            fputcsv($handle, ['Total Kas Masuk Lunas (Rp)', $totalPaid]);
            fputcsv($handle, ['Total Kas Masuk DP 50% (Rp)', $totalDp]);
            fputcsv($handle, ['Total Nilai Transaksi Aktif (Rp)', $totalAll]);

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
