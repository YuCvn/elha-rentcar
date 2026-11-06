<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\MarketingController;
use App\Http\Controllers\OwnerController;
use Illuminate\Support\Facades\Route;

// =========================================================================
// 1. GUEST CONTROLLER (Calon Pembeli & Pengunjung Publik)
// =========================================================================
Route::get('/', [GuestController::class, 'welcome'])->name('home');
Route::post('/bookings/public', [GuestController::class, 'storeBooking'])->name('public.bookings.store');
Route::post('/switch-role', [GuestController::class, 'switchRole'])->name('switch.role');

Route::middleware(['auth', 'verified'])->group(function () {
    // Hub Utama Dashboard & Pesanan (Didelegasikan sesuai Role Pengguna)
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('bookings', [DashboardController::class, 'bookings'])->name('bookings.index');

    // =====================================================================
    // 2. MARKETING CONTROLLER (Verifikasi Dokumen KTP, SIM, KK & Bukti Bayar)
    // =====================================================================
    Route::post('bookings/{booking}/marketing-verify', [MarketingController::class, 'verifyBooking'])->name('bookings.marketing.verify');

    // =====================================================================
    // 3. ADMIN CONTROLLER (Konfirmasi Pesanan, Armada & Serah Terima Unit)
    // =====================================================================
    Route::patch('bookings/{booking}/admin-confirm', [AdminController::class, 'confirmBooking'])->name('bookings.admin.confirm');
    Route::patch('bookings/{booking}/status', [AdminController::class, 'updateBookingStatus'])->name('bookings.status');
    Route::post('bookings', [AdminController::class, 'storeBooking'])->name('bookings.store');
    Route::delete('bookings/{booking}', [AdminController::class, 'destroyBooking'])->name('bookings.destroy');

    Route::get('fleet', [DashboardController::class, 'fleet'])->name('fleet.index');
    Route::post('fleet', [AdminController::class, 'storeCar'])->name('fleet.store');
    Route::put('fleet/{car}', [AdminController::class, 'updateCar'])->name('fleet.update');
    Route::patch('fleet/{car}/status', [AdminController::class, 'updateCarStatus'])->name('fleet.status');
    Route::delete('fleet/{car}', [AdminController::class, 'destroyCar'])->name('fleet.destroy');

    Route::get('android-guide', [AdminController::class, 'androidGuide'])->name('android.guide');

    // =====================================================================
    // 4. OWNER CONTROLLER (Khusus Owner: Kelola Akun & Download Rekap Bulanan)
    // =====================================================================
    Route::get('users', [OwnerController::class, 'users'])->name('users.index');
    Route::post('users', [OwnerController::class, 'storeUser'])->name('users.store');
    Route::patch('users/{user}/role', [OwnerController::class, 'updateUserRole'])->name('users.role');
    Route::delete('users/{user}', [OwnerController::class, 'destroyUser'])->name('users.destroy');
    Route::get('reports/monthly-export', [OwnerController::class, 'exportMonthlyReport'])->name('reports.monthly.export');
});

require __DIR__.'/settings.php';
