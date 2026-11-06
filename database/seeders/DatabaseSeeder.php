<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin Operasional
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@elha.co.id'],
            [
                'name' => 'Admin Operasional Elha',
                'phone' => '0821-1533-2233',
                'role' => 'admin',
                'identity_number' => '3213010101950001',
                'address' => 'Jl. Otista No. 45, Subang, Jawa Barat',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        // Keep test@example.com as an admin alias for test suite compatibility
        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Admin Elha RentCar',
                'phone' => '0821-1533-2233',
                'role' => 'admin',
                'identity_number' => '3213010101950002',
                'address' => 'Kantor Pusat Elha Subang',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        // 2. Owner / Pemilik Bisnis
        $owner = User::query()->updateOrCreate(
            ['email' => 'owner@elha.co.id'],
            [
                'name' => 'H. Elha (Owner / Direktur)',
                'phone' => '0812-9988-7711',
                'role' => 'owner',
                'identity_number' => '3213011005800001',
                'address' => 'Perum Griya Subang Asri No. 12',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        // 3. Marketing & Sales
        $marketing = User::query()->updateOrCreate(
            ['email' => 'marketing@elha.co.id'],
            [
                'name' => 'Rian Marketing Elha Subang',
                'phone' => '0821-1533-2233',
                'role' => 'marketing',
                'identity_number' => '3213012204980003',
                'address' => 'Jl. Pejuang 45 Subang',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]
        );

        // Referensi armada resmi dari https://www.elha.co.id/pages/rental-mobil-subang/
        $carsData = [
            [
                'license_plate' => 'T 1988 ELH',
                'name' => 'Mitsubishi Pajero Sport Dakar Black',
                'brand' => 'Mitsubishi',
                'category' => 'SUV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'seats' => 7,
                'price_per_day' => 1200000,
                'with_driver_price' => 200000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-pajero-dakar-black.jpeg',
                'description' => 'SUV premium tangguh dengan mesin diesel bertenaga, kabin mewah berbalut kulit, sunroof, dan kenyamanan suspensi terbaik.',
                'features' => ['Sunroof', 'Leather Seats', 'Mesin Diesel 2.4 MIVEC Turbo', 'Kamera 360', 'AC Dual Zone'],
                'rating' => 4.98,
                'total_trips' => 52,
            ],
            [
                'license_plate' => 'T 1777 ELH',
                'name' => 'Toyota Fortuner GR Sport',
                'brand' => 'Toyota',
                'category' => 'SUV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'seats' => 7,
                'price_per_day' => 1150000,
                'with_driver_price' => 200000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-fortuner-gr.jpeg',
                'description' => 'Tampilan sporty gagah khas GR Sport dengan performa mesin 2.8L turbo diesel bertenaga dan fitur keselamatan lengkap.',
                'features' => ['Bodykit GR Sport', 'Power Backdoor Kick Sensor', 'JBL Audio', 'Wireless Charger', 'Surround Monitor'],
                'rating' => 4.96,
                'total_trips' => 46,
            ],
            [
                'license_plate' => 'T 1420 ELH',
                'name' => 'Toyota Kijang Innova Reborn CVT',
                'brand' => 'Toyota',
                'category' => 'MPV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'seats' => 7,
                'price_per_day' => 650000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-innova-reborn-cvt.jpeg',
                'description' => 'Rajanya mobil keluarga Indonesia, kabin super hening, suspensi lembut, dan mesin diesel 2GD yang irit serta bertenaga.',
                'features' => ['AC Double Blower', 'Kabin Lega', 'Suspensi Empuk', 'Head Unit Layar Sentuh', 'Eco & Power Mode'],
                'rating' => 4.97,
                'total_trips' => 88,
            ],
            [
                'license_plate' => 'T 1824 ELH',
                'name' => 'Toyota All New Veloz Q CVT',
                'brand' => 'Toyota',
                'category' => 'MPV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 450000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-all-new-veloz-cvt.jpeg',
                'description' => 'MPV modern dengan lampu LED berdesain dinamis, rem parkir elektrik dengan auto hold, dan fitur keselamatan mutakhir.',
                'features' => ['Electric Parking Brake', 'Wireless Charger', 'Apple CarPlay & Android Auto', 'Rear Seat Monitor', 'Ambient Light'],
                'rating' => 4.94,
                'total_trips' => 73,
            ],
            [
                'license_plate' => 'T 1102 ELH',
                'name' => 'Toyota Avanza All New CVT',
                'brand' => 'Toyota',
                'category' => 'MPV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 400000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-avanza-all-new-cvt.jpeg',
                'description' => 'Pilihan andalan keluarga untuk perjalanan dalam maupun luar kota Subang, hemat bahan bakar dan mudah dikendarai.',
                'features' => ['Transmisi CVT Halus', 'Sofa Mode Kabin', 'Dual SRS Airbags', 'Sensor Parkir', 'USB Port di Setiap Baris'],
                'rating' => 4.92,
                'total_trips' => 95,
            ],
            [
                'license_plate' => 'T 1902 ELH',
                'name' => 'Mitsubishi Xpander Ultimate CVT',
                'brand' => 'Mitsubishi',
                'category' => 'MPV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 450000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-xpander-ultimate-cvt.jpeg',
                'description' => 'Desain futuristik dengan ground clearance tinggi, suspensi empuk, dan kesenyapan kabin terdepan di kelasnya.',
                'features' => ['Cruise Control', 'Wireless Charger', 'Keyless Operating System', 'Audio Steering Switch', 'Banyak Tempat Penyimpanan'],
                'rating' => 4.95,
                'total_trips' => 61,
            ],
            [
                'license_plate' => 'T 1555 ELH',
                'name' => 'Toyota Rush Black GR Sport CVT',
                'brand' => 'Toyota',
                'category' => 'SUV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 450000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-rush-black-gr-cvt.jpeg',
                'description' => 'SUV tangguh penggerak roda belakang (RWD) dengan ground clearance tinggi, sangat pas untuk jalanan tanjakan di Subang Selatan.',
                'features' => ['Penggerak RWD Tangguh', '6 Airbags', 'Auto A/C Digital', 'Smart Start/Stop', 'Velg 17 Inci GR Sport'],
                'rating' => 4.91,
                'total_trips' => 54,
            ],
            [
                'license_plate' => 'T 1633 ELH',
                'name' => 'Daihatsu All New Terios White CVT',
                'brand' => 'Daihatsu',
                'category' => 'SUV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 425000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-terios-white-cvt.jpeg',
                'description' => 'Sahabat petualang dengan kabin 7 penumpang, kamera 360, dan tampilan eksterior putih bersih elegan.',
                'features' => ['Around View Monitor 360', 'Keyless Entry', 'LED Headlamp', 'Kabin Lega 7 Seat', 'Hemat BBM'],
                'rating' => 4.90,
                'total_trips' => 48,
            ],
            [
                'license_plate' => 'T 1388 ELH',
                'name' => 'Toyota Yaris Citrus GR Sport CVT',
                'brand' => 'Toyota',
                'category' => 'City Car',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 5,
                'price_per_day' => 450000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-yaris-citrus-gr-cvt.jpeg',
                'description' => 'Hatchback berjiwa muda dengan warna atraktif Citrus Yellow, handling gesit, paddle shift, dan audio berkualitas.',
                'features' => ['Paddle Shift', 'Drive Mode Sport/Eco', '7 Airbags', 'Layar Sentuh 7 Inci', 'Desain GR Sport Eksklusif'],
                'rating' => 4.93,
                'total_trips' => 39,
            ],
            [
                'license_plate' => 'T 1205 ELH',
                'name' => 'Toyota Raize Turbo GR Sport CVT (Red)',
                'brand' => 'Toyota',
                'category' => 'SUV',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 5,
                'price_per_day' => 400000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-raize-cvt-red.jpeg',
                'description' => 'Compact SUV bermesin 1.000cc Turbo responsif dengan warna merah two-tone atraktif dan bagasi bertingkat yang fleksibel.',
                'features' => ['Mesin 1.0L Turbo', 'Paddle Shift', 'Digital Speedometer 7 Inci', 'Vehicle Stability Control', 'Hill Start Assist'],
                'rating' => 4.92,
                'total_trips' => 44,
            ],
            [
                'license_plate' => 'T 1088 ELH',
                'name' => 'Honda Brio Yellow CVT',
                'brand' => 'Honda',
                'category' => 'City Car',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 5,
                'price_per_day' => 300000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-brio-yellow-cvt.jpeg',
                'description' => 'City car terpopuler yang lincah, sangat hemat bensin, dan mudah parkir untuk keliling kota Subang dan sekitarnya.',
                'features' => ['Sangat Irit BBM', 'Transmisi CVT Halus', 'Audio Bluetooth', 'Sensor Parkir', 'AC Digital'],
                'rating' => 4.91,
                'total_trips' => 112,
            ],
            [
                'license_plate' => 'T 1414 ELH',
                'name' => 'Honda Mobilio Grey MT',
                'brand' => 'Honda',
                'category' => 'MPV',
                'year' => 2023,
                'transmission' => 'Manual',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 350000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-mobilio-grey-mt.jpeg',
                'description' => 'Low MPV dengan tenaga mesin 1.5L i-VTEC terbesar di kelasnya, bagasi luas, dan posisi duduk nyaman layaknya sedan.',
                'features' => ['Mesin 1.5L i-VTEC 118 PS', 'Transmisi Manual Responsif', 'AC Double Blower', 'Dual SRS Airbags', 'Bagasi Fleksibel'],
                'rating' => 4.88,
                'total_trips' => 67,
            ],
            [
                'license_plate' => 'T 1321 ELH',
                'name' => 'Daihatsu Sigra Orange MT',
                'brand' => 'Daihatsu',
                'category' => 'MPV',
                'year' => 2024,
                'transmission' => 'Manual',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 275000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-sigra-orange-mt.jpeg',
                'description' => 'Pilihan sewa mobil paling hemat dan ekonomis untuk 7 penumpang, cocok untuk operasional keluarga maupun perjalanan dinas.',
                'features' => ['Tarif Super Hemat', 'Kapasitas 7 Kursi', 'AC Dingin', 'Konsumsi BBM 18-20 km/L', 'Sensor Mundur'],
                'rating' => 4.86,
                'total_trips' => 93,
            ],
            [
                'license_plate' => 'T 1244 ELH',
                'name' => 'Toyota Calya G MT',
                'brand' => 'Toyota',
                'category' => 'MPV',
                'year' => 2024,
                'transmission' => 'Manual',
                'fuel_type' => 'Bensin',
                'seats' => 7,
                'price_per_day' => 275000,
                'with_driver_price' => 150000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil-calya-mt.jpeg',
                'description' => 'Mobil 7 seater terjangkau dengan perawatan resmi Toyota, kabin nyaman, dan efisiensi bahan bakar yang luar biasa.',
                'features' => ['Sangat Ekonomis', 'Audio Touchscreen', 'Power Window 4 Pintu', 'Rear Air Circulator', 'Dual SRS Airbags'],
                'rating' => 4.87,
                'total_trips' => 84,
            ],
            [
                'license_plate' => 'T 1007 ELH',
                'name' => 'Honda City Sedan CVT',
                'brand' => 'Honda',
                'category' => 'Sedan',
                'year' => 2024,
                'transmission' => 'Automatic',
                'fuel_type' => 'Bensin',
                'seats' => 5,
                'price_per_day' => 700000,
                'with_driver_price' => 175000,
                'status' => 'available',
                'image_url' => 'https://www.elha.co.id/img/listmobil/mobil--honda-city-cvt.jpeg',
                'description' => 'Sedan prestisius dengan kenyamanan berkendara mewah, kabin kedap suara, jok ergonomis, dan tampilan eksekutif elegan.',
                'features' => ['Kenyamanan Kelas Sedan', 'Paddle Shift', 'Layar Sentuh 8 Inci', 'Remote Engine Start', '8 Speakers Audio'],
                'rating' => 4.95,
                'total_trips' => 35,
            ],
        ];

        $cars = [];
        foreach ($carsData as $data) {
            $cars[] = Car::query()->updateOrCreate(
                ['license_plate' => $data['license_plate']],
                $data
            );
        }

        // Data armada mobil terisi lengkap. Tabel transaksi (bookings) dibiarkan kosong agar siap digunakan untuk transaksi riil/testing.
    }
}
