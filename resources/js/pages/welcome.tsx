import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Calendar,
    Car as CarIcon,
    CheckCircle2,
    Clock,
    Fuel,
    Gauge,
    KeyRound,
    LayoutDashboard,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoleSwitcher } from '@/components/role-switcher';
import {
    calculateDays,
    formatRupiah,
    getBookingStatusBadge,
    getCarStatusBadge,
    getPaymentStatusBadge,
} from '@/lib/rental-utils';
import { dashboard, login } from '@/routes';
import type { Booking, Car } from '@/types/rental';

interface WelcomeProps {
    cars: Car[];
    lookupCode: string;
    lookedUpBooking: Booking | null;
    stats: {
        total_cars: number;
        available_cars: number;
        total_trips: number;
        avg_rating: number;
    };
}

export default function Welcome({
    cars,
    lookupCode,
    lookedUpBooking,
    stats,
}: WelcomeProps) {
    const page = usePage<{
        auth?: { user?: { name?: string; email?: string } | null };
    }>();
    const user = page.props.auth?.user;

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTransmission, setSelectedTransmission] =
        useState<string>('all');
    const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
    const [bookingCodeInput, setBookingCodeInput] =
        useState<string>(lookupCode);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);

    const bookingForm = useForm({
        car_id: 0,
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        start_date: today,
        end_date: tomorrow,
        with_driver: false,
        pickup_location: 'Kantor Elha Rent Car Subang',
        return_location: 'Kantor Elha Rent Car Subang',
        notes: '',
    });

    const categories = ['all', 'MPV', 'SUV', 'City Car', 'EV', 'Luxury'];

    const filteredCars = useMemo(() => {
        return cars.filter((car) => {
            const matchesSearch =
                car.name.toLowerCase().includes(search.toLowerCase()) ||
                car.brand.toLowerCase().includes(search.toLowerCase()) ||
                car.license_plate.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' || car.category === selectedCategory;

            const matchesTransmission =
                selectedTransmission === 'all' ||
                car.transmission === selectedTransmission;

            const matchesAvailable =
                !onlyAvailable || car.status === 'available';

            return (
                matchesSearch &&
                matchesCategory &&
                matchesTransmission &&
                matchesAvailable
            );
        });
    }, [cars, search, selectedCategory, selectedTransmission, onlyAvailable]);

    const openBookingModal = (car: Car) => {
        setSelectedCar(car);
        bookingForm.setData({
            ...bookingForm.data,
            car_id: car.id,
        });
    };

    const closeBookingModal = () => {
        setSelectedCar(null);
    };

    const totalDays = calculateDays(
        bookingForm.data.start_date,
        bookingForm.data.end_date,
    );
    const baseCarTotal = selectedCar
        ? selectedCar.price_per_day * totalDays
        : 0;
    const driverTotal =
        selectedCar && bookingForm.data.with_driver
            ? selectedCar.with_driver_price * totalDays
            : 0;
    const grandTotal = baseCarTotal + driverTotal;

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bookingForm.post('/bookings/public', {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCar(null);
                bookingForm.reset('notes');
            },
        });
    };

    const handleLookupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/',
            { code: bookingCodeInput.trim() },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Elha Rent Car Subang - Rental Mobil Murah & Terpercaya" />

            <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 md:pb-0 dark:bg-slate-950 dark:text-slate-100">
                {/* 4 User Roles Switcher Bar */}
                <RoleSwitcher />

                {/* Top Navigation Bar */}
                <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
                                <CarIcon className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold tracking-tight">
                                        Elha RentCar
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="hidden border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-700 sm:inline-flex dark:text-emerald-400"
                                    >
                                        Subang • 24 Jam
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Rental Mobil Subang • Lepas Kunci & Plus
                                    Driver
                                </p>
                            </div>
                        </div>

                        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
                            <a
                                href="#katalog"
                                className="text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                            >
                                Katalog Armada
                            </a>
                            <a
                                href="#cek-booking"
                                className="text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                            >
                                Cek Kode Booking
                            </a>
                            <a
                                href="#kontak"
                                className="text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
                            >
                                Kontak & Layanan
                            </a>
                        </nav>

                        <div className="flex items-center gap-2.5">
                            <a
                                href="https://wa.me/6282115332233?text=Halo%20Admin%20Elha%20Rent%20Car%20Subang"
                                target="_blank"
                                rel="noreferrer"
                                className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 lg:inline-flex dark:text-emerald-400"
                            >
                                <Phone className="size-3.5 text-emerald-600" />
                                <span>+6282115332233</span>
                            </a>
                            {user ? (
                                <Button asChild size="sm" className="gap-1.5">
                                    <Link href={dashboard()}>
                                        <LayoutDashboard className="size-4" />
                                        <span>Panel Staf</span>
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={login()}>Login Staf</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-14 text-white sm:py-20 dark:border-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-10 lg:grid-cols-12">
                            <div className="space-y-6 lg:col-span-7">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-3.5 py-1.5 text-xs font-medium text-blue-200">
                                    <Sparkles className="size-3.5 text-blue-400" />
                                    <span>
                                        Armada Tahun Muda 2024–2026 • Lepas
                                        Kunci & Driver Subang
                                    </span>
                                </div>

                                <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.15]">
                                    Sewa Mobil Nyaman, Cepat, &{' '}
                                    <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                        Transparan
                                    </span>
                                </h1>

                                <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                                    Pilih mobil keluarga, SUV mewah, hingga
                                    mobil listrik bebas ganjil-genap. Tersedia
                                    layanan lepas kunci 24 jam atau dengan sopir
                                    profesional.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-blue-600 text-white hover:bg-blue-500"
                                    >
                                        <a href="#katalog">
                                            Pilih Mobil Sekarang
                                        </a>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="border-slate-700 bg-slate-800/70 text-white hover:bg-slate-800"
                                    >
                                        <a href="#cek-booking">
                                            Cek Pesanan Saya
                                        </a>
                                    </Button>
                                </div>

                                {/* Key Metrics */}
                                <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                                        <p className="text-2xl font-bold text-white">
                                            {stats.total_cars} Unit
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            Total Armada Terawat
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {stats.available_cars} Siap
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            Tersedia Hari Ini
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                                        <p className="text-2xl font-bold text-amber-400">
                                            100%
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            Unit Terawat & Legal
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                                        <p className="text-2xl font-bold text-cyan-300">
                                            {stats.total_trips} Trip
                                        </p>
                                        <p className="text-xs text-slate-300">
                                            Perjalanan Sukses
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Highlight Card */}
                            <div className="lg:col-span-5">
                                <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold tracking-wider text-blue-300 uppercase">
                                                Keunggulan Elha RentCar
                                            </span>
                                            <h2 className="text-xl font-bold text-white">
                                                Mengapa Sewa di Sini?
                                            </h2>
                                        </div>
                                        <ShieldCheck className="size-8 text-blue-400" />
                                    </div>

                                    <div className="space-y-3.5 text-sm">
                                        <div className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3.5">
                                            <KeyRound className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Bisa Lepas Kunci 24 Jam
                                                </p>
                                                <p className="text-xs text-slate-300">
                                                    Proses verifikasi KTP & SIM
                                                    A cepat tanpa ribet.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3.5">
                                            <UserCheck className="mt-0.5 size-5 shrink-0 text-cyan-400" />
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Opsi Sopir Profesional
                                                </p>
                                                <p className="text-xs text-slate-300">
                                                    Sopir ramah, hafal rute
                                                    dalam & luar kota.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3.5">
                                            <Phone className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Hotline 24 Jam & CS Subang
                                                </p>
                                                <p className="text-xs text-slate-300">
                                                    +6282115332233 • Respon
                                                    cepat via WhatsApp & Gmail
                                                    resmi.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fleet Catalog Section */}
                <section
                    id="katalog"
                    className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
                >
                    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <span className="text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                                Armada Pilihan Terbaik
                            </span>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                                Katalog Mobil Siap Jalan
                            </h2>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                Klik tombol{' '}
                                <span className="font-semibold">
                                    Sewa Sekarang
                                </span>{' '}
                                pada mobil pilihan Anda untuk menghitung biaya
                                otomatis.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                        selectedCategory === cat
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {cat === 'all' ? 'Semua Kategori' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
                        <div className="relative sm:col-span-6">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama mobil, merk (Toyota, Honda, Hyundai), atau plat nomor..."
                                className="pl-9"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <select
                                value={selectedTransmission}
                                onChange={(e) =>
                                    setSelectedTransmission(e.target.value)
                                }
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none dark:bg-slate-900"
                            >
                                <option value="all">Semua Transmisi</option>
                                <option value="Automatic">
                                    Automatic (Matic)
                                </option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>

                        <div className="flex items-center sm:col-span-3">
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium select-none">
                                <input
                                    type="checkbox"
                                    checked={onlyAvailable}
                                    onChange={(e) =>
                                        setOnlyAvailable(e.target.checked)
                                    }
                                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Hanya yang Tersedia</span>
                            </label>
                        </div>
                    </div>

                    {/* Cars Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredCars.map((car) => {
                            const statusBadge = getCarStatusBadge(car.status);
                            const isAvailable = car.status === 'available';

                            return (
                                <div
                                    key={car.id}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {car.image_url ? (
                                            <img
                                                src={car.image_url}
                                                alt={car.name}
                                                className="size-full object-cover transition duration-500 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <CarIcon className="size-12 text-slate-400" />
                                            </div>
                                        )}

                                        <div className="absolute top-3 left-3 flex gap-1.5">
                                            <Badge
                                                variant="outline"
                                                className="border-slate-900/20 bg-slate-900/75 text-white backdrop-blur-sm"
                                            >
                                                {car.category}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="border-slate-900/20 bg-white/90 text-slate-900 backdrop-blur-sm"
                                            >
                                                {car.year}
                                            </Badge>
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <Badge
                                                variant="outline"
                                                className={`${statusBadge.className} backdrop-blur-sm`}
                                            >
                                                {statusBadge.label}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                {car.license_plate}
                                            </span>
                                            <span className="font-medium text-slate-500 dark:text-slate-400">
                                                {car.total_trips} trip
                                            </span>
                                        </div>

                                        <h3 className="line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
                                            {car.name}
                                        </h3>

                                        <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                                            {car.description}
                                        </p>

                                        {/* Specs */}
                                        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <Gauge className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                <span className="font-medium">
                                                    {car.transmission}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <Users className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                <span className="font-medium">
                                                    {car.seats} Kursi
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 text-center">
                                                <Fuel className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                <span className="font-medium">
                                                    {car.fuel_type}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Features tags */}
                                        {car.features &&
                                            car.features.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1">
                                                    {car.features
                                                        .slice(0, 3)
                                                        .map((feat) => (
                                                            <span
                                                                key={feat}
                                                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                            >
                                                                {feat}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}

                                        <div className="mt-auto pt-5">
                                            <div className="flex items-end justify-between border-t border-slate-100 pt-3.5 dark:border-slate-800">
                                                <div>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Harga Sewa / Hari
                                                    </span>
                                                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                                                        {formatRupiah(
                                                            car.price_per_day,
                                                        )}
                                                    </p>
                                                </div>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={!isAvailable}
                                                    onClick={() =>
                                                        openBookingModal(car)
                                                    }
                                                    className={
                                                        isAvailable
                                                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                                                            : ''
                                                    }
                                                >
                                                    {isAvailable
                                                        ? 'Sewa Sekarang'
                                                        : 'Tidak Tersedia'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Booking Status Lookup Section */}
                <section
                    id="cek-booking"
                    className="border-y border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900/60"
                >
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 text-center">
                                <Badge
                                    variant="outline"
                                    className="mb-2 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                >
                                    Real-Time Tracker
                                </Badge>
                                <h2 className="text-2xl font-bold">
                                    Cek Status Pesanan / Kode Booking
                                </h2>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                    Masukkan Kode Booking Anda (contoh:{' '}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setBookingCodeInput(
                                                'ELH-202611-001',
                                            )
                                        }
                                        className="font-mono font-semibold text-blue-600 underline dark:text-blue-400"
                                    >
                                        ELH-202611-001
                                    </button>{' '}
                                    atau{' '}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setBookingCodeInput(
                                                'ELH-202611-002',
                                            )
                                        }
                                        className="font-mono font-semibold text-blue-600 underline dark:text-blue-400"
                                    >
                                        ELH-202611-002
                                    </button>
                                    )
                                </p>
                            </div>

                            <form
                                onSubmit={handleLookupSubmit}
                                className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row"
                            >
                                <Input
                                    value={bookingCodeInput}
                                    onChange={(e) =>
                                        setBookingCodeInput(
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: ELH-202611-001"
                                    className="bg-white font-mono uppercase dark:bg-slate-950"
                                />
                                <Button
                                    type="submit"
                                    className="bg-blue-600 text-white hover:bg-blue-500"
                                >
                                    Cek Status
                                </Button>
                            </form>

                            {lookupCode !== '' && !lookedUpBooking && (
                                <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center text-sm text-rose-700 dark:text-rose-300">
                                    Kode booking{' '}
                                    <span className="font-mono font-bold">
                                        {lookupCode}
                                    </span>{' '}
                                    tidak ditemukan. Pastikan kode sudah benar.
                                </div>
                            )}

                            {lookedUpBooking && (
                                <div className="mt-6 rounded-xl border border-blue-500/30 bg-white p-5 shadow-sm dark:bg-slate-950">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div>
                                            <span className="text-xs text-slate-500">
                                                Kode Booking Resmi
                                            </span>
                                            <p className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {lookedUpBooking.booking_code}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    getBookingStatusBadge(
                                                        lookedUpBooking.status,
                                                    ).className
                                                }
                                            >
                                                {
                                                    getBookingStatusBadge(
                                                        lookedUpBooking.status,
                                                    ).label
                                                }
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    getPaymentStatusBadge(
                                                        lookedUpBooking.payment_status,
                                                    ).className
                                                }
                                            >
                                                {
                                                    getPaymentStatusBadge(
                                                        lookedUpBooking.payment_status,
                                                    ).label
                                                }
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Penyewa
                                            </p>
                                            <p className="font-semibold">
                                                {lookedUpBooking.customer_name}{' '}
                                                (
                                                {lookedUpBooking.customer_phone}
                                                )
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Unit Mobil
                                            </p>
                                            <p className="font-semibold">
                                                {lookedUpBooking.car?.name} (
                                                {
                                                    lookedUpBooking.car
                                                        ?.license_plate
                                                }
                                                )
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Jadwal Sewa (
                                                {lookedUpBooking.total_days}{' '}
                                                Hari)
                                            </p>
                                            <p className="font-semibold">
                                                {lookedUpBooking.start_date} s/d{' '}
                                                {lookedUpBooking.end_date}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Total Biaya (
                                                {lookedUpBooking.with_driver
                                                    ? 'Dengan Sopir'
                                                    : 'Lepas Kunci'}
                                                )
                                            </p>
                                            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                                                {formatRupiah(
                                                    lookedUpBooking.total_price,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Kontak & Layanan Resmi Section */}
                <section
                    id="kontak"
                    className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
                >
                    <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-slate-900/40 to-emerald-600/10 p-6 sm:p-10">
                        <div className="mb-8 max-w-3xl">
                            <Badge className="mb-3 bg-blue-600 text-white">
                                Kontak & Layanan Resmi
                            </Badge>
                            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                                Hubungi Layanan Rental Mobil Subang
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                Butuh sewa mobil mendadak, konsultasi armada,
                                atau penjemputan khusus di Stasiun Pagadenbaru &
                                Bandara? Hubungi kami langsung melalui WhatsApp,
                                Telepon, maupun Gmail resmi.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Card 1: WhatsApp & Phone */}
                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                                <div>
                                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                        <Phone className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        Hotline & WhatsApp 24 Jam
                                    </h3>
                                    <p className="mt-1 font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                        +62 821-1533-2233
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        Respon cepat untuk booking kilat, cek
                                        ketersediaan mobil hari ini, atau
                                        bantuan darurat di jalan.
                                    </p>
                                </div>
                                <div className="mt-5 flex flex-col gap-2">
                                    <Button
                                        asChild
                                        className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
                                    >
                                        <a
                                            href="https://wa.me/6282115332233?text=Halo%20Admin%20Elha%20Rent%20Car%20Subang,%20saya%20ingin%20tanya%20sewa%20mobil"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <MessageCircle className="size-4" />
                                            <span>Chat WhatsApp Langsung</span>
                                        </a>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full gap-2"
                                    >
                                        <a href="tel:+6282115332233">
                                            <Phone className="size-4" />
                                            <span>Telepon Seluler</span>
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Card 2: Gmail / Email Resmi */}
                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                                <div>
                                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                        <Mail className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        Gmail & Penawaran Resmi
                                    </h3>
                                    <p className="mt-1 font-mono text-base font-bold break-all text-blue-600 dark:text-blue-400">
                                        elhasubang@gmail.com
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        Kirim permintaan sewa korporat, instansi
                                        pemerintahan, sewa bulanan, proposal
                                        kemitraan, atau invoice resmi.
                                    </p>
                                </div>
                                <div className="mt-5">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full gap-2 border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                                    >
                                        <a href="mailto:elhasubang@gmail.com?subject=Permintaan%20Sewa%20Mobil%20Elha%20Subang">
                                            <Mail className="size-4" />
                                            <span>Kirim Email / Surat</span>
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            {/* Card 3: Lokasi & Jam Operasional */}
                            <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                                <div>
                                    <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                        <MapPin className="size-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        Pool Armada Subang
                                    </h3>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        Subang Kota, Pagaden & Pamanukan
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                        Melayani serah terima unit di pool atau
                                        antar-jemput ke Stasiun Pagadenbaru,
                                        Hotel, Kantor, hingga Tol Cipali.
                                    </p>
                                </div>
                                <div className="mt-5 rounded-xl border border-border/50 bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                                    <p className="font-semibold text-foreground">
                                        Jam Operasional: 24 Jam Non-Stop
                                    </p>
                                    <p className="mt-0.5 text-[11px]">
                                        Senin – Minggu termasuk Hari Libur
                                        Nasional
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info Strip */}
                        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
                            <p>
                                © 2026 PT Elha Rent Car Subang. Seluruh hak
                                cipta dilindungi.
                            </p>
                            <p className="flex items-center gap-3 font-medium">
                                <span>Hotline: +6282115332233</span>
                                <span>•</span>
                                <span>Gmail: elhasubang@gmail.com</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mobile Bottom Bar for Public Storefront */}
                <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 py-2 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
                    <a
                        href="#katalog"
                        className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400"
                    >
                        <CarIcon className="size-5" />
                        <span>Armada</span>
                    </a>
                    <a
                        href="#cek-booking"
                        className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                    >
                        <Clock className="size-5" />
                        <span>Cek Booking</span>
                    </a>
                    <a
                        href="#kontak"
                        className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                    >
                        <Phone className="size-5" />
                        <span>Kontak</span>
                    </a>
                    <Link
                        href={user ? dashboard() : login()}
                        className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                    >
                        <LayoutDashboard className="size-5" />
                        <span>{user ? 'Dashboard' : 'Admin'}</span>
                    </Link>
                </nav>
            </div>

            {/* Instant Booking Modal (Calon Pembeli -> Marketing) */}
            {selectedCar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <Badge className="mb-1 bg-blue-600 text-white">
                                    Form Pesan Mobil (Calon Pembeli)
                                </Badge>
                                <h3 className="text-xl font-bold">
                                    {selectedCar.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Plat: {selectedCar.license_plate} •{' '}
                                    {selectedCar.transmission} •{' '}
                                    {selectedCar.seats} Kursi
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeBookingModal}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                            <strong>Alur Pemesanan:</strong> Isi nama, nomor
                            WhatsApp, alamat, waktu peminjaman, dan lokasi di
                            bawah ini. Pesanan Anda akan langsung masuk ke
                            notifikasi <strong>Marketing Elha Subang</strong>{' '}
                            dan tim kami akan segera menghubungi WhatsApp Anda
                            untuk kelengkapan KTP, SIM, KK, serta pembayaran.
                        </div>

                        <form
                            onSubmit={handleBookingSubmit}
                            className="mt-4 space-y-4"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name">
                                        Nama Lengkap Calon Pembeli *
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        required
                                        minLength={3}
                                        maxLength={100}
                                        value={bookingForm.data.customer_name}
                                        onChange={(e) =>
                                            bookingForm.setData(
                                                'customer_name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Masukkan nama lengkap Anda"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_phone">
                                        Nomor WhatsApp Aktif *
                                    </Label>
                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="customer_phone"
                                            required
                                            type="tel"
                                            inputMode="tel"
                                            minLength={10}
                                            maxLength={15}
                                            pattern="^(08|\+628|628)[0-9]{8,12}$"
                                            title="Nomor WhatsApp harus valid diawali 08 atau +628 dengan 10-14 digit angka"
                                            value={
                                                bookingForm.data.customer_phone
                                            }
                                            onChange={(e) =>
                                                bookingForm.setData(
                                                    'customer_phone',
                                                    e.target.value.replace(
                                                        /[^0-9+]/g,
                                                        '',
                                                    ),
                                                )
                                            }
                                            placeholder="Contoh: 082115332233"
                                            className="pl-9"
                                        />
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                        Format: 08xx-xxxx-xxxx (10-14 digit)
                                    </span>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="customer_address">
                                        Alamat Lengkap Domisili *
                                    </Label>
                                    <Input
                                        id="customer_address"
                                        required
                                        minLength={5}
                                        maxLength={255}
                                        value={
                                            bookingForm.data.customer_address
                                        }
                                        onChange={(e) =>
                                            bookingForm.setData(
                                                'customer_address',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Jl. Otto Iskandardinata No. 12, Kec. Subang, Kab. Subang"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date">
                                        Waktu Peminjaman (Mulai) *
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="start_date"
                                            type="date"
                                            required
                                            value={bookingForm.data.start_date}
                                            onChange={(e) =>
                                                bookingForm.setData(
                                                    'start_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="end_date">
                                        Waktu Peminjaman (Selesai) *
                                    </Label>
                                    <div className="relative">
                                        <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="end_date"
                                            type="date"
                                            required
                                            min={bookingForm.data.start_date}
                                            value={bookingForm.data.end_date}
                                            onChange={(e) =>
                                                bookingForm.setData(
                                                    'end_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="pickup_location">
                                        Lokasi Pengambilan / Jemput *
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="pickup_location"
                                            required
                                            value={
                                                bookingForm.data.pickup_location
                                            }
                                            onChange={(e) =>
                                                bookingForm.setData(
                                                    'pickup_location',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="return_location">
                                        Lokasi Pengembalian *
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="return_location"
                                            required
                                            value={
                                                bookingForm.data.return_location
                                            }
                                            onChange={(e) =>
                                                bookingForm.setData(
                                                    'return_location',
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="notes">
                                        Catatan Tambahan (Opsional)
                                    </Label>
                                    <Input
                                        id="notes"
                                        value={bookingForm.data.notes}
                                        onChange={(e) =>
                                            bookingForm.setData(
                                                'notes',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Jemput jam 08.00 pagi di Stasiun Pagadenbaru"
                                    />
                                </div>
                            </div>

                            {/* Driver Option */}
                            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={bookingForm.data.with_driver}
                                        onChange={(e) =>
                                            bookingForm.setData(
                                                'with_driver',
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-slate-300 text-blue-600"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Gunakan Jasa Sopir Profesional
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Tambahan{' '}
                                            {formatRupiah(
                                                selectedCar.with_driver_price,
                                            )}{' '}
                                            / hari
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline">
                                    {bookingForm.data.with_driver
                                        ? 'Dengan Sopir'
                                        : 'Lepas Kunci'}
                                </Badge>
                            </label>

                            {/* Price Calculation Box */}
                            <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Sewa Mobil ({totalDays} hari ×{' '}
                                        {formatRupiah(
                                            selectedCar.price_per_day,
                                        )}
                                        )
                                    </span>
                                    <span className="font-semibold">
                                        {formatRupiah(baseCarTotal)}
                                    </span>
                                </div>
                                {bookingForm.data.with_driver && (
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Biaya Sopir ({totalDays} hari ×{' '}
                                            {formatRupiah(
                                                selectedCar.with_driver_price,
                                            )}
                                            )
                                        </span>
                                        <span className="font-semibold">
                                            {formatRupiah(driverTotal)}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-2 flex items-center justify-between border-t border-blue-500/20 pt-2 text-base font-extrabold text-blue-600 dark:text-blue-400">
                                    <span>Estimasi Total Biaya</span>
                                    <span>{formatRupiah(grandTotal)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeBookingModal}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={bookingForm.processing}
                                    className="gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                                >
                                    <CheckCircle2 className="size-4" />
                                    <span>
                                        {bookingForm.processing
                                            ? 'Mengirim ke Marketing...'
                                            : 'Pesan Mobil Sekarang'}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
