<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_initial_database_has_zero_bookings_and_fifteen_available_cars(): void
    {
        $this->get(route('home'));

        $this->assertSame(0, Booking::query()->count());
        $this->assertGreaterThanOrEqual(15, Car::query()->where('status', 'available')->count());
    }

    public function test_guest_can_create_public_booking_with_address_and_automatic_price_calculation(): void
    {
        $this->get(route('home'));
        $car = Car::query()->where('status', 'available')->firstOrFail();

        $response = $this->post(route('public.bookings.store'), [
            'car_id' => $car->id,
            'customer_name' => 'Dimas Saputra',
            'customer_phone' => '081299887766',
            'customer_address' => 'Jl. Otto Iskandardinata No. 45, Karanganyar, Subang',
            'start_date' => '2026-11-10',
            'end_date' => '2026-11-13',
            'with_driver' => true,
            'pickup_location' => 'Kantor Elha Subang',
            'return_location' => 'Kantor Elha Subang',
            'payment_method' => 'qris',
            'notes' => 'Jemput pagi jam 08.00',
        ]);

        $response->assertRedirect();

        $booking = Booking::query()->where('customer_name', 'Dimas Saputra')->first();
        $this->assertNotNull($booking);
        $this->assertSame('pending', $booking->status);
        $this->assertNull($booking->user_id);
        $this->assertSame('Jl. Otto Iskandardinata No. 45, Karanganyar, Subang', $booking->customer_address);
        $this->assertSame(3, $booking->total_days);
        $expectedTotal = ($car->price_per_day * 3) + ($car->with_driver_price * 3);
        $this->assertSame($expectedTotal, $booking->total_price);
    }

    public function test_marketing_can_only_see_their_own_transactions_and_other_marketing_cannot_see_or_modify_it(): void
    {
        $this->get(route('home'));
        $car = Car::query()->where('status', 'available')->firstOrFail();

        // 1. Guest order
        $this->post(route('public.bookings.store'), [
            'car_id' => $car->id,
            'customer_name' => 'Customer Marketing A',
            'customer_phone' => '081111111111',
            'customer_address' => 'Subang Kota',
            'start_date' => '2026-11-12',
            'end_date' => '2026-11-14',
            'with_driver' => false,
            'payment_method' => 'transfer_bank',
        ])->assertRedirect();

        $bookingA = Booking::query()->where('customer_name', 'Customer Marketing A')->firstOrFail();

        // Marketing A mengklaim & memverifikasi pesanan ini
        $marketingA = User::factory()->create(['role' => 'marketing', 'email' => 'mkt.a@elha.co.id']);
        $this->actingAs($marketingA);

        $verifyRes = $this->post(route('bookings.marketing.verify', $bookingA), [
            'customer_ktp_number' => '3213011505900001',
            'customer_sim_number' => '900513210099',
            'customer_kk_number' => '3213010101150002',
            'start_date' => '2026-11-12',
            'end_date' => '2026-11-14',
            'with_driver' => false,
            'pickup_location' => 'Kantor Elha Subang',
            'return_location' => 'Kantor Elha Subang',
            'payment_method' => 'transfer_bank',
            'payment_status' => 'dp',
            'marketing_notes' => 'Diverifikasi Marketing A',
        ]);
        $verifyRes->assertRedirect();
        $bookingA->refresh();
        $this->assertSame($marketingA->id, $bookingA->user_id);
        $this->assertSame('waiting_admin', $bookingA->status);

        // Marketing B login
        $marketingB = User::factory()->create(['role' => 'marketing', 'email' => 'mkt.b@elha.co.id']);
        $this->actingAs($marketingB);

        // Marketing B mengakses /bookings -> Booking A TIDAK boleh ada dalam daftar
        $responseB = $this->get(route('bookings.index'));
        $responseB->assertOk();
        $bookingsForB = $responseB->viewData('page')['props']['bookings'] ?? [];
        $idsForB = collect($bookingsForB)->pluck('id')->all();
        $this->assertNotContains($bookingA->id, $idsForB);

        // Marketing B mencoba memodifikasi pesanan milik Marketing A -> 403 Forbidden!
        $this->post(route('bookings.marketing.verify', $bookingA), [
            'customer_ktp_number' => '9999999999999999',
            'customer_sim_number' => '999999999999',
            'customer_kk_number' => '9999999999999999',
            'start_date' => '2026-11-12',
            'end_date' => '2026-11-14',
            'payment_method' => 'transfer_bank',
            'payment_status' => 'paid',
        ])->assertForbidden();
    }

    public function test_confirmed_and_paid_transaction_is_locked_from_modification_and_deletion(): void
    {
        $this->get(route('home'));
        $car = Car::query()->where('status', 'available')->firstOrFail();

        $booking = Booking::query()->create([
            'booking_code' => 'ELH-LOCK-TEST',
            'user_id' => null,
            'car_id' => $car->id,
            'customer_name' => 'Pak Joko',
            'customer_phone' => '081234567890',
            'customer_address' => 'Subang',
            'customer_ktp_number' => '3213010101900001',
            'customer_sim_number' => '900113210001',
            'customer_kk_number' => '3213010101900002',
            'start_date' => '2026-11-20',
            'end_date' => '2026-11-22',
            'total_days' => 2,
            'with_driver' => false,
            'pickup_location' => 'Pool Subang',
            'return_location' => 'Pool Subang',
            'car_price_per_day' => 400000,
            'driver_fee_total' => 0,
            'total_price' => 800000,
            'status' => 'waiting_admin',
            'payment_status' => 'paid',
            'payment_method' => 'transfer_bank',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // Admin mengonfirmasi pesanan lunas
        $this->patch(route('bookings.admin.confirm', $booking))->assertRedirect();
        $booking->refresh();

        $this->assertSame('confirmed', $booking->status);
        $this->assertSame('paid', $booking->payment_status);
        $this->assertTrue($booking->checkIsLocked());
        $this->assertTrue($booking->is_locked);

        // Admin mencoba mengubah payment status atau membatalkan pesanan terkunci -> 403 Forbidden!
        $this->patch(route('bookings.status', $booking), [
            'status' => 'cancelled',
            'payment_status' => 'unpaid',
        ])->assertForbidden();

        // Admin mencoba menghapus transaksi yang sudah lunas dan dikonfirmasi -> 403 Forbidden!
        $this->delete(route('bookings.destroy', $booking))->assertForbidden();
        $this->assertNotNull(Booking::query()->find($booking->id));

        // Namun Admin tetap boleh melakukan serah terima operasional (ongoing -> completed)
        $this->patch(route('bookings.status', $booking), [
            'status' => 'ongoing',
            'payment_status' => 'paid',
        ])->assertRedirect();
        $this->assertSame('ongoing', $booking->fresh()?->status);

        $this->patch(route('bookings.status', $booking), [
            'status' => 'completed',
            'payment_status' => 'paid',
        ])->assertRedirect();
        $this->assertSame('completed', $booking->fresh()?->status);
    }

    public function test_marketing_cannot_edit_fleet_and_sees_only_available_cars(): void
    {
        $this->get(route('home'));

        $carAvailable = Car::query()->where('status', 'available')->firstOrFail();
        $carRented = Car::query()->where('id', '!=', $carAvailable->id)->firstOrFail();
        $carRented->update(['status' => 'rented']);

        $marketing = User::factory()->create(['role' => 'marketing']);
        $this->actingAs($marketing);

        // Marketing membuka /fleet -> Hanya menampilkan mobil available
        $resFleet = $this->get(route('fleet.index'));
        $resFleet->assertOk();
        $carsProp = $resFleet->viewData('page')['props']['cars'] ?? [];
        $statuses = collect($carsProp)->pluck('status')->unique()->all();
        $this->assertSame(['available'], $statuses);

        // Marketing dilarang menambah, mengedit, mengubah status, atau menghapus armada mobil
        $this->post(route('fleet.store'), [
            'name' => 'Mobil Baru Marketing',
            'brand' => 'Honda',
            'category' => 'MPV',
            'license_plate' => 'T 9999 MKT',
            'year' => 2026,
            'transmission' => 'Automatic',
            'fuel_type' => 'Bensin',
            'seats' => 7,
            'price_per_day' => 450000,
            'with_driver_price' => 150000,
            'status' => 'available',
        ])->assertForbidden();

        $this->put(route('fleet.update', $carAvailable), [
            'name' => 'Mobil Edit Marketing',
            'brand' => 'Toyota',
            'category' => 'MPV',
            'license_plate' => $carAvailable->license_plate,
            'year' => 2025,
            'transmission' => 'Automatic',
            'fuel_type' => 'Bensin',
            'seats' => 7,
            'price_per_day' => 500000,
            'with_driver_price' => 150000,
            'status' => 'available',
        ])->assertForbidden();

        $this->patch(route('fleet.status', $carAvailable), [
            'status' => 'maintenance',
        ])->assertForbidden();

        $this->delete(route('fleet.destroy', $carAvailable))->assertForbidden();
    }

    public function test_owner_cannot_modify_or_delete_transactions_and_only_views_them(): void
    {
        $this->get(route('home'));
        $car = Car::query()->where('status', 'available')->firstOrFail();

        $booking = Booking::query()->create([
            'booking_code' => 'ELH-OWNER-TEST',
            'user_id' => null,
            'car_id' => $car->id,
            'customer_name' => 'Ibu Maya',
            'customer_phone' => '081234567899',
            'customer_address' => 'Kalijati Subang',
            'start_date' => '2026-11-25',
            'end_date' => '2026-11-27',
            'total_days' => 2,
            'with_driver' => true,
            'pickup_location' => 'Kantor Elha',
            'return_location' => 'Kantor Elha',
            'car_price_per_day' => 450000,
            'driver_fee_total' => 300000,
            'total_price' => 1200000,
            'status' => 'waiting_admin',
            'payment_status' => 'dp',
            'payment_method' => 'transfer_bank',
        ]);

        $owner = User::factory()->create(['role' => 'owner']);
        $this->actingAs($owner);

        // Owner bisa melihat /bookings (Read-Only)
        $this->get(route('bookings.index'))->assertOk();

        // Owner TIDAK bisa membuat pesanan transaksi manual
        $this->post(route('bookings.store'), [
            'car_id' => $car->id,
            'customer_name' => 'Order dari Owner',
            'customer_phone' => '081199998888',
            'start_date' => '2026-11-28',
            'end_date' => '2026-11-30',
        ])->assertForbidden();

        // Owner TIDAK bisa mengonfirmasi pesanan
        $this->patch(route('bookings.admin.confirm', $booking))->assertForbidden();

        // Owner TIDAK bisa mengubah status pesanan
        $this->patch(route('bookings.status', $booking), [
            'status' => 'confirmed',
        ])->assertForbidden();

        // Owner TIDAK bisa menghapus pesanan
        $this->delete(route('bookings.destroy', $booking))->assertForbidden();
    }

    public function test_only_owner_can_manage_users_and_export_monthly_report(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $admin = User::factory()->create(['role' => 'admin']);
        $marketing = User::factory()->create(['role' => 'marketing']);

        // Admin & Marketing tidak boleh mengakses halaman /users atau export laporan bulanan
        $this->actingAs($admin)->get(route('users.index'))->assertForbidden();
        $this->actingAs($marketing)->get(route('users.index'))->assertForbidden();
        $this->actingAs($admin)->get(route('reports.monthly.export'))->assertForbidden();

        // Owner bisa melihat daftar akun, mendaftarkan akun baru, mengubah role, menghapus akun, dan download laporan
        $this->actingAs($owner)->get(route('users.index'))->assertOk();

        $storeRes = $this->actingAs($owner)->post(route('users.store'), [
            'name' => 'Staf Marketing Baru',
            'email' => 'marketing.baru@elha.co.id',
            'phone' => '082115332233',
            'role' => 'marketing',
            'password' => 'password123',
        ]);
        $storeRes->assertRedirect();

        $newStaff = User::query()->where('email', 'marketing.baru@elha.co.id')->firstOrFail();
        $this->assertSame('marketing', $newStaff->role);

        // Ubah role ke admin
        $this->actingAs($owner)->patch(route('users.role', $newStaff), [
            'role' => 'admin',
        ])->assertRedirect();
        $this->assertSame('admin', $newStaff->fresh()?->role);

        // Download file rekap bulanan (.csv)
        $exportRes = $this->actingAs($owner)->get(route('reports.monthly.export', ['month' => '2026-11']));
        $exportRes->assertOk();
        $this->assertStringContainsString('text/csv', (string) $exportRes->headers->get('Content-Type'));

        // Hapus akun staf
        $this->actingAs($owner)->delete(route('users.destroy', $newStaff))->assertRedirect();
        $this->assertNull(User::query()->find($newStaff->id));
    }

    public function test_mobile_android_api_v1_endpoints_work_properly(): void
    {
        $statsRes = $this->getJson('/api/v1/stats');
        $statsRes->assertOk()->assertJsonPath('status', 'success');

        $carsRes = $this->getJson('/api/v1/cars?status=available');
        $carsRes->assertOk()->assertJsonPath('status', 'success');

        $car = Car::query()->firstOrFail();

        $createBookingRes = $this->postJson('/api/v1/bookings', [
            'car_id' => $car->id,
            'customer_name' => 'Pengguna Android Elha',
            'customer_phone' => '081987654321',
            'start_date' => '2026-11-20',
            'end_date' => '2026-11-22',
            'with_driver' => true,
            'payment_method' => 'qris',
        ]);

        $createBookingRes->assertCreated()->assertJsonPath('status', 'success');

        $bookingCode = (string) $createBookingRes->json('data.booking_code');
        $lookupRes = $this->getJson("/api/v1/bookings/lookup/{$bookingCode}");
        $lookupRes->assertOk()->assertJsonPath('data.customer_name', 'Pengguna Android Elha');
    }

    public function test_quick_role_switcher_authenticates_target_roles_and_guest(): void
    {
        // Switch to Admin
        $resAdmin = $this->post(route('switch.role'), ['role' => 'admin']);
        $resAdmin->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
        $this->assertSame('admin', auth()->user()?->role);

        // Switch to Owner
        $resOwner = $this->post(route('switch.role'), ['role' => 'owner']);
        $resOwner->assertRedirect(route('dashboard'));
        $this->assertSame('owner', auth()->user()?->role);

        // Switch to Marketing
        $resMarketing = $this->post(route('switch.role'), ['role' => 'marketing']);
        $resMarketing->assertRedirect(route('dashboard'));
        $this->assertSame('marketing', auth()->user()?->role);

        // Switch to Guest -> Logs out and redirects to home
        $resGuest = $this->post(route('switch.role'), ['role' => 'guest']);
        $resGuest->assertRedirect(route('home'));
        $this->assertGuest();
    }

    public function test_invalid_verification_data_and_phone_numbers_are_rejected(): void
    {
        $this->get(route('home'));
        $car = Car::query()->where('status', 'available')->firstOrFail();

        // 1. Guest mencoba submit nomor telepon random tidak valid (contoh: 023)
        $resPhone = $this->post(route('public.bookings.store'), [
            'car_id' => $car->id,
            'customer_name' => 'Budi Santoso',
            'customer_phone' => '023', // Nomor tidak valid!
            'customer_address' => 'Jl. Otista No. 10 Subang',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);
        $resPhone->assertSessionHasErrors(['customer_phone']);

        // 2. Marketing mencoba submit data KTP/SIM/KK tidak lengkap / tidak valid (contoh: 12)
        $booking = Booking::query()->create([
            'booking_code' => 'ELH-VAL-TEST',
            'car_id' => $car->id,
            'customer_name' => 'Valid User',
            'customer_phone' => '082115332233',
            'customer_address' => 'Subang',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'total_days' => 2,
            'with_driver' => false,
            'pickup_location' => 'Kantor',
            'return_location' => 'Kantor',
            'car_price_per_day' => 300000,
            'driver_fee_total' => 0,
            'total_price' => 600000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => 'transfer_bank',
        ]);

        $marketing = User::factory()->create(['role' => 'marketing']);
        $this->actingAs($marketing);

        $resVerify = $this->post(route('bookings.marketing.verify', $booking), [
            'customer_ktp_number' => '12', // Harus 16 digit
            'customer_sim_number' => '12', // Harus 12-16 digit
            'customer_kk_number' => '12', // Harus 16 digit
            'customer_address' => 'Alamat valid Subang',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'payment_method' => 'transfer_bank',
            'payment_status' => 'dp',
        ]);
        $resVerify->assertSessionHasErrors(['customer_ktp_number', 'customer_sim_number', 'customer_kk_number']);
    }

    public function test_admin_cannot_revert_to_pending_or_waiting_admin_and_dp_cannot_ongoing(): void
    {
        $this->get(route('home'));
        $car = Car::query()->where('status', 'available')->firstOrFail();

        $booking = Booking::query()->create([
            'booking_code' => 'ELH-OP-TEST',
            'car_id' => $car->id,
            'customer_name' => 'Penyewa DP',
            'customer_phone' => '082115332233',
            'customer_address' => 'Subang',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'total_days' => 2,
            'with_driver' => false,
            'pickup_location' => 'Kantor',
            'return_location' => 'Kantor',
            'car_price_per_day' => 400000,
            'driver_fee_total' => 0,
            'total_price' => 800000,
            'status' => 'confirmed',
            'confirmed_by_admin_at' => now(),
            'payment_status' => 'dp', // Status masih DP!
            'payment_method' => 'transfer_bank',
        ]);

        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // 1. Admin dilarang revert ke 'pending' atau 'waiting_admin'
        $this->patch(route('bookings.status', $booking), [
            'status' => 'pending',
        ])->assertStatus(422);

        $this->patch(route('bookings.status', $booking), [
            'status' => 'waiting_admin',
        ])->assertStatus(422);

        // 2. Mobil TIDAK BISA dijalankan jika baru DP -> Harus LUNAS dulu!
        $this->patch(route('bookings.status', $booking), [
            'status' => 'ongoing',
        ])->assertStatus(422);

        // 3. Pelunasan tagihan: ubah payment_status menjadi 'paid'
        $this->patch(route('bookings.status', $booking), [
            'payment_status' => 'paid',
        ])->assertRedirect();

        $booking->refresh();
        $this->assertSame('paid', $booking->payment_status);

        // 4. Setelah LUNAS, barulah mobil BISA dijalankan (ongoing)
        $this->patch(route('bookings.status', $booking), [
            'status' => 'ongoing',
        ])->assertRedirect();

        $booking->refresh();
        $this->assertSame('ongoing', $booking->status);
        $this->assertSame('rented', $car->fresh()?->status);
    }
}
