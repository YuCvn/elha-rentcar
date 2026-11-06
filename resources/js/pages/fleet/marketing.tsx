import { Head, Link } from '@inertiajs/react';
import {
    CalendarCheck2,
    Car as CarIcon,
    CheckCircle2,
    Fuel,
    Gauge,
    Search,
    Star,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/lib/rental-utils';
import type { Car } from '@/types/rental';

interface MarketingFleetProps {
    cars: Car[];
    stats: {
        total_ready: number;
    };
}

export default function MarketingFleet({ cars, stats }: MarketingFleetProps) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const categories = useMemo(() => {
        const unique = Array.from(new Set(cars.map((c) => c.category)));
        return ['all', ...unique];
    }, [cars]);

    const filteredCars = useMemo(() => {
        return cars.filter((car) => {
            const matchesSearch =
                car.name.toLowerCase().includes(search.toLowerCase()) ||
                car.brand.toLowerCase().includes(search.toLowerCase()) ||
                car.license_plate.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                categoryFilter === 'all' || car.category === categoryFilter;

            return matchesSearch && matchesCategory;
        });
    }, [cars, search, categoryFilter]);

    return (
        <>
            <Head title="Katalog Armada Tersedia - Khusus Marketing" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Banner Khusus Marketing */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-1.5 flex items-center gap-2">
                            <Badge className="bg-emerald-600 text-white">
                                KATALOG KHUSUS MARKETING
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            >
                                Mode Khusus Penawaran (Tersedia Saja)
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Armada Mobil Tersedia (Siap Disewa)
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Daftar kendaraan resmi Elha Rent Car yang saat ini
                            berstatus <strong>Tersedia (Ready)</strong> di pool
                            Subang untuk Anda tawarkan langsung ke calon
                            pembeli.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-emerald-500/40 bg-card p-3 text-right shadow-xs">
                            <span className="block text-xs text-muted-foreground">
                                Total Unit Siap Jalan
                            </span>
                            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {stats.total_ready} Unit
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama mobil, merk, plat..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-xs text-muted-foreground">
                            Kategori:
                        </span>
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                size="sm"
                                variant={
                                    categoryFilter === cat
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() => setCategoryFilter(cat)}
                                className={`text-xs capitalize ${
                                    categoryFilter === cat
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                        : ''
                                }`}
                            >
                                {cat === 'all' ? 'Semua Kategori' : cat}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Grid Kartu Mobil Tersedia */}
                {filteredCars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
                        <CarIcon className="size-12 text-muted-foreground/50" />
                        <h3 className="mt-3 text-base font-bold">
                            Tidak ada unit tersedia yang cocok
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Coba ubah kata kunci pencarian atau pilih kategori
                            lain.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCars.map((car) => (
                            <div
                                key={car.id}
                                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-emerald-500/50 hover:shadow-md"
                            >
                                {/* Foto Mobil & Badge Status */}
                                <div className="relative h-44 w-full overflow-hidden bg-muted">
                                    <img
                                        src={
                                            car.image_url ||
                                            'https://www.elha.co.id/img/listmobil/mobil-avanza-all-new-cvt.jpeg'
                                        }
                                        alt={car.name}
                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <Badge className="bg-emerald-600 text-white shadow-xs">
                                            <CheckCircle2 className="mr-1 size-3" />
                                            Ready Siap Pakai
                                        </Badge>
                                    </div>
                                    <div className="absolute top-3 right-3 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[11px] font-bold text-white backdrop-blur-xs">
                                        {car.license_plate}
                                    </div>
                                </div>

                                {/* Spesifikasi & Info */}
                                <div className="flex flex-1 flex-col justify-between p-4">
                                    <div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {car.brand} • {car.category} (
                                                {car.year})
                                            </span>
                                            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                                <Star className="size-3 fill-amber-500 text-amber-500" />
                                                {car.rating}
                                            </span>
                                        </div>

                                        <h3 className="mt-1 text-base font-bold text-foreground">
                                            {car.name}
                                        </h3>

                                        {/* Specs Badges */}
                                        <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                                                <Gauge className="size-3 text-blue-500" />
                                                {car.transmission}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                                                <Fuel className="size-3 text-amber-500" />
                                                {car.fuel_type}
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                                                <Users className="size-3 text-emerald-500" />
                                                {car.seats} Kursi
                                            </span>
                                        </div>

                                        {/* Features Pills */}
                                        {car.features &&
                                            car.features.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1">
                                                    {car.features
                                                        .slice(0, 3)
                                                        .map((f, i) => (
                                                            <span
                                                                key={i}
                                                                className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:text-emerald-300"
                                                            >
                                                                {f}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}
                                    </div>

                                    {/* Pricing & Quick Booking Action */}
                                    <div className="mt-4 border-t border-border pt-3">
                                        <div className="flex items-baseline justify-between">
                                            <div>
                                                <span className="block text-[10px] text-muted-foreground">
                                                    Lepas Kunci
                                                </span>
                                                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                                                    {formatRupiah(
                                                        car.price_per_day,
                                                    )}
                                                    <span className="text-xs font-normal text-muted-foreground">
                                                        /hari
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] text-muted-foreground">
                                                    + Sopir Resmi
                                                </span>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    +
                                                    {formatRupiah(
                                                        car.with_driver_price,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            asChild
                                            size="sm"
                                            className="mt-3 w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                                        >
                                            <Link
                                                href={`/bookings?car_id=${car.id}`}
                                            >
                                                <CalendarCheck2 className="size-4" />
                                                <span>
                                                    Buat Transaksi dengan Mobil
                                                    Ini
                                                </span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
