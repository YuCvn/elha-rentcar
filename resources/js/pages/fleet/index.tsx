import { Head, router, useForm } from '@inertiajs/react';
import {
    Car as CarIcon,
    Edit3,
    Fuel,
    Gauge,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah, getCarStatusBadge } from '@/lib/rental-utils';
import type { Car, CarStatus } from '@/types/rental';

interface FleetPageProps {
    cars: Car[];
    stats: {
        total: number;
        available: number;
        rented: number;
        maintenance: number;
    };
}

export default function FleetIndex({ cars, stats }: FleetPageProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [isSameModelUnit, setIsSameModelUnit] = useState(false);
    const [selectedModelName, setSelectedModelName] = useState('');

    const form = useForm({
        name: '',
        brand: 'Toyota',
        category: 'MPV',
        license_plate: '',
        year: 2025,
        transmission: 'Automatic',
        fuel_type: 'Bensin',
        seats: 7,
        price_per_day: 450000,
        with_driver_price: 150000,
        status: 'available' as CarStatus,
        image_url: '',
        description: '',
        features_text: 'AC Double Blower, Bluetooth Audio, Kamera Parkir',
    });

    const existingModels = useMemo(() => {
        const map = new Map<string, Car>();
        cars.forEach((car) => {
            if (!map.has(car.name)) {
                map.set(car.name, car);
            }
        });
        return Array.from(map.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [cars]);

    const filteredCars = useMemo(() => {
        return cars.filter((car) => {
            const matchesSearch =
                car.name.toLowerCase().includes(search.toLowerCase()) ||
                car.brand.toLowerCase().includes(search.toLowerCase()) ||
                car.license_plate.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || car.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [cars, search, statusFilter]);

    const applyExistingModel = (target: Car) => {
        form.setData({
            ...form.data,
            name: target.name,
            brand: target.brand,
            category: target.category,
            year: target.year,
            transmission: target.transmission,
            fuel_type: target.fuel_type,
            seats: target.seats,
            price_per_day: target.price_per_day,
            with_driver_price: target.with_driver_price,
            image_url: target.image_url ?? '',
            description: target.description ?? '',
            features_text: (target.features ?? []).join(', '),
        });
    };

    const handleToggleSameModel = (checked: boolean) => {
        setIsSameModelUnit(checked);
        if (checked && existingModels.length > 0) {
            const first = existingModels[0];
            setSelectedModelName(first.name);
            applyExistingModel(first);
        } else {
            setSelectedModelName('');
        }
    };

    const handleSelectModel = (modelName: string) => {
        setSelectedModelName(modelName);
        const target = existingModels.find((m) => m.name === modelName);
        if (target) {
            applyExistingModel(target);
        }
    };

    const openCreateModal = () => {
        setEditingCar(null);
        setIsSameModelUnit(false);
        setSelectedModelName('');
        form.setData({
            name: '',
            brand: 'Toyota',
            category: 'MPV',
            license_plate: '',
            year: 2025,
            transmission: 'Automatic',
            fuel_type: 'Bensin',
            seats: 7,
            price_per_day: 450000,
            with_driver_price: 150000,
            status: 'available',
            image_url: '',
            description:
                'Armada bersih, wangi, dan servis berkala di bengkel resmi.',
            features_text:
                'AC Double Blower, Bluetooth Audio, Kamera Parkir, Keyless',
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (car: Car) => {
        setEditingCar(car);
        setIsSameModelUnit(false);
        setSelectedModelName('');
        form.setData({
            name: car.name,
            brand: car.brand,
            category: car.category,
            license_plate: car.license_plate,
            year: car.year,
            transmission: car.transmission,
            fuel_type: car.fuel_type,
            seats: car.seats,
            price_per_day: car.price_per_day,
            with_driver_price: car.with_driver_price,
            status: car.status,
            image_url: car.image_url ?? '',
            description: car.description ?? '',
            features_text: (car.features ?? []).join(', '),
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCar) {
            form.put(`/fleet/${editingCar.id}`, {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/fleet', {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (car: Car) => {
        if (
            window.confirm(`Hapus armada "${car.name}" (${car.license_plate})?`)
        ) {
            router.delete(`/fleet/${car.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Manajemen Armada Mobil" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Manajemen Armada Mobil
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Tambah, perbarui tarif sewa harian, dan atur status
                            ketersediaan unit kendaraan.
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                    >
                        <Plus className="size-4" />
                        <span>Tambah Unit Mobil</span>
                    </Button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-4">
                        <span className="text-xs text-muted-foreground">
                            Total Unit
                        </span>
                        <p className="mt-1 text-2xl font-bold">
                            {stats?.total ?? cars.length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">
                            Tersedia Siap Jalan
                        </span>
                        <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {stats?.available ?? 0}
                        </p>
                    </div>
                    <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
                        <span className="text-xs text-blue-700 dark:text-blue-400">
                            Sedang Disewa
                        </span>
                        <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats?.rented ?? 0}
                        </p>
                    </div>
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                        <span className="text-xs text-amber-700 dark:text-amber-400">
                            Dalam Perawatan
                        </span>
                        <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {stats?.maintenance ?? 0}
                        </p>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama mobil, merk, atau plat nomor..."
                            className="pl-9"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-slate-900"
                    >
                        <option value="all">Semua Status</option>
                        <option value="available">Tersedia</option>
                        <option value="rented">Sedang Disewa</option>
                        <option value="maintenance">Servis / Perawatan</option>
                    </select>
                </div>

                {/* Fleet Cards Grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredCars.map((car) => {
                        const badge = getCarStatusBadge(car.status);

                        return (
                            <div
                                key={car.id}
                                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
                            >
                                <div className="relative aspect-[16/10] bg-muted">
                                    {car.image_url ? (
                                        <img
                                            src={car.image_url}
                                            alt={car.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center">
                                            <CarIcon className="size-10 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <Badge
                                            variant="outline"
                                            className="bg-black/75 text-white"
                                        >
                                            {car.category} • {car.year}
                                        </Badge>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Badge
                                            variant="outline"
                                            className={`${badge.className} backdrop-blur-xs`}
                                        >
                                            {badge.label}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col p-4">
                                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        {car.license_plate}
                                    </span>
                                    <h3 className="mt-0.5 line-clamp-1 font-bold">
                                        {car.name}
                                    </h3>

                                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Gauge className="size-3.5 text-muted-foreground" />
                                            <span className="truncate">
                                                {car.transmission}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="size-3.5 text-muted-foreground" />
                                            <span>{car.seats} Seat</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Fuel className="size-3.5 text-muted-foreground" />
                                            <span>{car.fuel_type}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-border pt-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                Lepas Kunci:
                                            </span>
                                            <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                                {formatRupiah(
                                                    car.price_per_day,
                                                )}
                                                /hr
                                            </span>
                                        </div>
                                        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                                            <span>Tarif Sopir:</span>
                                            <span>
                                                +
                                                {formatRupiah(
                                                    car.with_driver_price,
                                                )}
                                                /hr
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => openEditModal(car)}
                                        >
                                            <Edit3 className="mr-1.5 size-3.5" />
                                            Edit
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                                            onClick={() => handleDelete(car)}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-lg font-bold">
                                {editingCar
                                    ? `Edit Armada: ${editingCar.name}`
                                    : 'Tambah Armada Mobil Baru'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-4 space-y-4"
                        >
                            {/* Checkbox Tambah Unit Satu Merk Mobil */}
                            {!editingCar && (
                                <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5">
                                    <input
                                        type="checkbox"
                                        id="isSameModelUnit"
                                        checked={isSameModelUnit}
                                        onChange={(e) =>
                                            handleToggleSameModel(
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 rounded border-border text-blue-600 focus:ring-blue-500"
                                    />
                                    <label
                                        htmlFor="isSameModelUnit"
                                        className="cursor-pointer text-xs font-semibold select-none text-foreground"
                                    >
                                        Tambah Unit satu merk mobil (Pilih dari model armada yang sudah ada, tanpa perlu mengisi manual)
                                    </label>
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label
                                        htmlFor={
                                            isSameModelUnit && !editingCar
                                                ? 'model_dropdown'
                                                : 'name'
                                        }
                                    >
                                        Nama Lengkap Mobil *
                                    </Label>
                                    {isSameModelUnit && !editingCar ? (
                                        <div className="space-y-1.5">
                                            <select
                                                id="model_dropdown"
                                                required
                                                value={selectedModelName}
                                                onChange={(e) =>
                                                    handleSelectModel(
                                                        e.target.value,
                                                    )
                                                }
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
                                            >
                                                <option value="" disabled>
                                                    -- Pilih Model Armada yang
                                                    Sudah Ada --
                                                </option>
                                                {existingModels.map((m) => (
                                                    <option
                                                        key={m.id}
                                                        value={m.name}
                                                    >
                                                        {m.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[11px] text-muted-foreground">
                                                Spesifikasi model otomatis disalin. Masukkan nomor plat baru di bawah.
                                            </p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="name"
                                            required
                                            value={form.data.name}
                                            onChange={(e) =>
                                                form.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Toyota Innova Zenix Hybrid"
                                        />
                                    )}
                                    <InputError message={form.errors.name} />
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="license_plate">
                                        Plat Nomor Kendaraan (Unit Baru) *
                                    </Label>
                                    <Input
                                        id="license_plate"
                                        required
                                        value={form.data.license_plate}
                                        onChange={(e) =>
                                            form.setData(
                                                'license_plate',
                                                e.target.value.toUpperCase(),
                                            )
                                        }
                                        placeholder="Contoh: T 1322 ELH"
                                        className="font-mono font-bold tracking-wider uppercase"
                                    />
                                    <InputError
                                        message={form.errors.license_plate}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="brand">Merk Pabrikan</Label>
                                    <Input
                                        id="brand"
                                        required
                                        value={form.data.brand}
                                        onChange={(e) =>
                                            form.setData(
                                                'brand',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="category">Kategori</Label>
                                    <select
                                        id="category"
                                        value={form.data.category}
                                        onChange={(e) =>
                                            form.setData(
                                                'category',
                                                e.target.value,
                                            )
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-slate-900"
                                    >
                                        <option value="MPV">MPV</option>
                                        <option value="SUV">SUV</option>
                                        <option value="City Car">
                                            City Car
                                        </option>
                                        <option value="Sedan">Sedan</option>
                                        <option value="EV">
                                            EV (Mobil Listrik)
                                        </option>
                                        <option value="Luxury">
                                            Luxury / Minibus
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="transmission">
                                        Transmisi
                                    </Label>
                                    <select
                                        id="transmission"
                                        value={form.data.transmission}
                                        onChange={(e) =>
                                            form.setData(
                                                'transmission',
                                                e.target.value,
                                            )
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-slate-900"
                                    >
                                        <option value="Automatic">
                                            Automatic
                                        </option>
                                        <option value="Manual">Manual</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="fuel_type">
                                        Jenis BBM / Energi
                                    </Label>
                                    <select
                                        id="fuel_type"
                                        value={form.data.fuel_type}
                                        onChange={(e) =>
                                            form.setData(
                                                'fuel_type',
                                                e.target.value,
                                            )
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-slate-900"
                                    >
                                        <option value="Bensin">Bensin</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Listrik">Listrik</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="year">Tahun Rakitan</Label>
                                    <Input
                                        id="year"
                                        type="number"
                                        value={form.data.year}
                                        onChange={(e) =>
                                            form.setData(
                                                'year',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="seats">Jumlah Kursi</Label>
                                    <Input
                                        id="seats"
                                        type="number"
                                        value={form.data.seats}
                                        onChange={(e) =>
                                            form.setData(
                                                'seats',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="price_per_day">
                                        Harga Sewa / Hari (Rp) *
                                    </Label>
                                    <Input
                                        id="price_per_day"
                                        type="number"
                                        required
                                        value={form.data.price_per_day}
                                        onChange={(e) =>
                                            form.setData(
                                                'price_per_day',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="with_driver_price">
                                        Biaya Tambahan Sopir / Hari (Rp)
                                    </Label>
                                    <Input
                                        id="with_driver_price"
                                        type="number"
                                        required
                                        value={form.data.with_driver_price}
                                        onChange={(e) =>
                                            form.setData(
                                                'with_driver_price',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status">Status Unit</Label>
                                    <select
                                        id="status"
                                        value={form.data.status}
                                        onChange={(e) =>
                                            form.setData(
                                                'status',
                                                e.target.value as CarStatus,
                                            )
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-slate-900"
                                    >
                                        <option value="available">
                                            Tersedia
                                        </option>
                                        <option value="rented">
                                            Sedang Disewa
                                        </option>
                                        <option value="maintenance">
                                            Servis / Perawatan
                                        </option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="image_url">
                                        URL Foto Mobil (Opsional)
                                    </Label>
                                    <Input
                                        id="image_url"
                                        value={form.data.image_url}
                                        onChange={(e) =>
                                            form.setData(
                                                'image_url',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="features_text">
                                    Fitur Unggulan (Pisahkan dengan koma)
                                </Label>
                                <Input
                                    id="features_text"
                                    value={form.data.features_text}
                                    onChange={(e) =>
                                        form.setData(
                                            'features_text',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="AC Double Blower, Apple CarPlay, Kamera 360"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="description">
                                    Deskripsi Singkat
                                </Label>
                                <Input
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="bg-blue-600 text-white hover:bg-blue-500"
                                >
                                    {form.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Armada'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

FleetIndex.layout = {
    breadcrumbs: [
        {
            title: 'Armada Mobil',
            href: '/fleet',
        },
    ],
};
