<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->after('email');
            $table->string('role', 20)->default('admin')->after('phone');
            $table->string('identity_number', 50)->nullable()->after('role');
            $table->text('address')->nullable()->after('identity_number');
        });

        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('brand', 60);
            $table->string('category', 40); // MPV, SUV, City Car, Sedan, Luxury, EV
            $table->string('license_plate', 25)->unique();
            $table->unsignedSmallInteger('year')->default(2024);
            $table->string('transmission', 25)->default('Automatic'); // Automatic, Manual
            $table->string('fuel_type', 30)->default('Bensin'); // Bensin, Diesel, Hybrid, Listrik
            $table->unsignedTinyInteger('seats')->default(7);
            $table->unsignedBigInteger('price_per_day');
            $table->unsignedBigInteger('with_driver_price')->default(150000);
            $table->string('status', 25)->default('available'); // available, rented, maintenance
            $table->string('image_url')->nullable();
            $table->text('description')->nullable();
            $table->json('features')->nullable();
            $table->decimal('rating', 3, 2)->default(4.90);
            $table->unsignedInteger('total_trips')->default(0);
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code', 30)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone', 30);
            $table->string('customer_email')->nullable();
            $table->text('customer_address')->nullable();
            $table->string('customer_identity_number', 50)->nullable();
            $table->string('customer_ktp_number', 50)->nullable();
            $table->string('customer_sim_number', 50)->nullable();
            $table->string('customer_kk_number', 50)->nullable();
            $table->string('ktp_photo_url')->nullable();
            $table->string('sim_photo_url')->nullable();
            $table->string('kk_photo_url')->nullable();
            $table->string('payment_proof_url')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('total_days')->default(1);
            $table->boolean('with_driver')->default(false);
            $table->string('pickup_location')->default('Kantor Elha Rent Car Subang');
            $table->string('return_location')->default('Kantor Elha Rent Car Subang');
            $table->unsignedBigInteger('car_price_per_day');
            $table->unsignedBigInteger('driver_fee_total')->default(0);
            $table->unsignedBigInteger('total_price');
            $table->string('status', 30)->default('pending'); // pending, waiting_admin, confirmed, ongoing, completed, cancelled
            $table->string('payment_status', 25)->default('unpaid'); // unpaid, dp, paid, refunded
            $table->string('payment_method', 30)->default('transfer_bank'); // qris, transfer_bank, ewallet, cash
            $table->text('notes')->nullable();
            $table->text('marketing_notes')->nullable();
            $table->timestamp('verified_by_marketing_at')->nullable();
            $table->timestamp('confirmed_by_admin_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('cars');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'role', 'identity_number', 'address']);
        });
    }
};
