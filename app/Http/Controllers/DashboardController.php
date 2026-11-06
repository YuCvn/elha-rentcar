<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Menghubungkan request /dashboard secara cerdas ke controller khusus masing-masing role:
     * 1. Owner -> OwnerController::dashboard
     * 2. Marketing -> MarketingController::dashboard
     * 3. Admin -> AdminController::dashboard
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isOwner()) {
            return app(OwnerController::class)->dashboard($request);
        }

        if ($user->isMarketing()) {
            return app(MarketingController::class)->dashboard($request);
        }

        return app(AdminController::class)->dashboard($request);
    }

    /**
     * Menghubungkan request /bookings sesuai role pengguna:
     * - Marketing -> Hanya melihat pesanan yang ditangani dirinya sendiri + leads pending
     * - Admin -> Melihat semua pesanan untuk operasional
     * - Owner -> Melihat semua transaksi dalam mode Read-Only (tidak bisa merubah)
     */
    public function bookings(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isMarketing()) {
            return app(MarketingController::class)->bookings($request);
        }

        $cars = Car::query()->orderBy('name')->get();
        $bookings = Booking::query()
            ->with(['car', 'user'])
            ->latest()
            ->get();

        return Inertia::render('bookings/index', [
            'userRole' => $user->role,
            'isReadOnly' => $user->isOwner(),
            'currentUserId' => $user->id,
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
     * Menghubungkan request /fleet sesuai role:
     * - Marketing -> Halaman Khusus Armada Tersedia (Read-Only)
     * - Admin / Owner -> Halaman Manajemen Armada Lengkap
     */
    public function fleet(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isMarketing()) {
            return app(MarketingController::class)->fleet($request);
        }

        return app(AdminController::class)->fleet();
    }
}
