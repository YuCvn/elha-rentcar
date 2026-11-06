<?php

use App\Http\Controllers\Api\RentalApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('stats', [RentalApiController::class, 'stats'])->name('stats');
    Route::get('cars', [RentalApiController::class, 'cars'])->name('cars.index');
    Route::get('cars/{car}', [RentalApiController::class, 'showCar'])->name('cars.show');
    Route::post('bookings', [RentalApiController::class, 'storeBooking'])->name('bookings.store');
    Route::get('bookings/lookup/{bookingCode}', [RentalApiController::class, 'lookupBooking'])->name('bookings.lookup');
});
