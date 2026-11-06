import { Head, router, useForm } from '@inertiajs/react';
import {
    Ban,
    Calendar,
    CheckCircle2,
    DollarSign,
    ExternalLink,
    FileCheck2,
    KeyRound,
    MapPin,
    MessageCircle,
    Phone,
    Plus,
    Search,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { BookingWorkflowModal } from '@/components/booking-workflow-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    calculateDays,
    formatRupiah,
    formatWhatsAppNumber,
    getBookingStatusBadge,
    getPaymentStatusBadge,
} from '@/lib/rental-utils';
import type {
    Booking,
    BookingStatus,
    Car,
    PaymentStatus,
} from '@/types/rental';

interface BookingsPageProps {
    userRole?: string;
    isReadOnly?: boolean;
    currentUserId?: number;
    bookings: Booking[];
    cars: Car[];
    stats: {
        total: number;
        pending: number;
        waiting_admin?: number;
        confirmed: number;
        ongoing: number;
        completed: number;
        cancelled: number;
    };
}

export default function BookingsIndex({
    userRole = 'admin',
    isReadOnly = false,
    currentUserId,
    bookings,
    cars,
    stats,
}: BookingsPageProps) {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeWorkflowBooking, setActiveWorkflowBooking] =
        useState<Booking | null>(null);

    const form = useForm({
        car_id: cars[0]?.id ?? 1,
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

    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            const matchesSearch =
                b.booking_code.toLowerCase().includes(search.toLowerCase()) ||
                b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                b.customer_phone.toLowerCase().includes(search.toLowerCase()) ||
                (b.customer_address ?? '')
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                (b.car?.name ?? '')
                    .toLowerCase()
                    .includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || b.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [bookings, search, statusFilter]);

    const selectedCar = useMemo(
        () => cars.find((c) => c.id === Number(form.data.car_id)) ?? cars[0],
        [cars, form.data.car_id],
    );

    const totalDays = calculateDays(form.data.start_date, form.data.end_date);
    const estTotal = selectedCar
        ? selectedCar.price_per_day * totalDays +
          (form.data.with_driver
              ? selectedCar.with_driver_price * totalDays
              : 0)
        : 0;

    const handleCreateBooking = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/bookings', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                form.reset(
                    'customer_name',
                    'customer_phone',
                    'customer_address',
                    'notes',
                );
            },
        });
    };

    const handleStatusChange = (
        bookingId: number,
        status: BookingStatus,
        paymentStatus: PaymentStatus,
    ) => {
        router.patch(
            `/bookings/${bookingId}/status`,
            {
                status,
                payment_status: paymentStatus,
            },
            { preserveScroll: true },
        );
    };

    const handleAdminConfirm = (bookingId: number) => {
        router.patch(
            `/bookings/${bookingId}/admin-confirm`,
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = (booking: Booking) => {
        if (
            window.confirm(
                `Hapus pesanan ${booking.booking_code} atas nama ${booking.customer_name}?`,
            )
        ) {
            router.delete(`/bookings/${booking.id}`, { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title="Manajemen Pesanan & Verifikasi Sewa" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {userRole === 'marketing'
                                ? 'Daftar Transaksi Saya & Antrean Leads'
                                : userRole === 'owner'
                                  ? 'Pemantauan Seluruh Transaksi Sewa (Mode Read-Only)'
                                  : 'Konfirmasi Pesanan & Jadwal Penyewaan'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {userRole === 'marketing'
                                ? 'Kelola pesanan yang Anda tangani sendiri dan tindak lanjuti pesanan baru (leads) yang belum diklaim staf lain.'
                                : userRole === 'owner'
                                  ? 'Pantau seluruh catatan transaksi rental mobil. Transaksi hanya dapat dilihat dan diunduh rekapnya.'
                                  : 'Periksa laporan verifikasi dari Marketing, konfirmasi pesanan, dan kelola serah terima unit mobil.'}
                        </p>
                    </div>
                    {userRole !== 'owner' && !isReadOnly && (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                        >
                            <Plus className="size-4" />
                            <span>
                                {userRole === 'marketing'
                                    ? '+ Input Transaksi Baru'
                                    : 'Input Pesanan Manual'}
                            </span>
                        </Button>
                    )}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: `Semua (${stats?.total ?? 0})` },
                        {
                            key: 'pending',
                            label: `Pesanan Baru / Marketing (${stats?.pending ?? 0})`,
                        },
                        {
                            key: 'waiting_admin',
                            label: `Menunggu Konfirmasi Admin (${stats?.waiting_admin ?? 0})`,
                        },
                        {
                            key: 'confirmed',
                            label: `Terkonfirmasi Admin (${stats?.confirmed ?? 0})`,
                        },
                        {
                            key: 'ongoing',
                            label: `Sedang Jalan (${stats?.ongoing ?? 0})`,
                        },
                        {
                            key: 'completed',
                            label: `Selesai (${stats?.completed ?? 0})`,
                        },
                        {
                            key: 'cancelled',
                            label: `Batal (${stats?.cancelled ?? 0})`,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                                statusFilter === tab.key
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Box */}
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari kode booking (ELH-...), nama calon pembeli, alamat, no. WA, atau nama mobil..."
                        className="pl-9"
                    />
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                    {filteredBookings.map((booking) => {
                        const statusBadge = getBookingStatusBadge(
                            booking.status,
                        );
                        const payBadge = getPaymentStatusBadge(
                            booking.payment_status,
                        );
                        const waPhone = formatWhatsAppNumber(
                            booking.customer_phone,
                        );
                        const waText = encodeURIComponent(
                            `Halo Kak ${booking.customer_name}, kami dari Marketing Elha Rent Car Subang menindaklanjuti pesanan mobil *${booking.car?.name ?? 'Armada Elha'}* (${booking.booking_code}). Mohon kirimkan foto/data KTP, SIM A, KK, konfirmasi jadwal final, serta bukti pembayaran DP/Lunas ya. Terima kasih!`,
                        );

                        return (
                            <div
                                key={booking.id}
                                className="rounded-2xl border border-border bg-card p-5 shadow-xs"
                            >
                                <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {booking.booking_code}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={statusBadge.className}
                                        >
                                            {statusBadge.label}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={payBadge.className}
                                        >
                                            {payBadge.label}
                                        </Badge>
                                        <Badge variant="outline">
                                            {booking.with_driver
                                                ? 'Dengan Sopir'
                                                : 'Lepas Kunci'}
                                        </Badge>
                                        {booking.is_locked && (
                                            <Badge
                                                variant="outline"
                                                className="border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                                            >
                                                🔒 Terkunci (Lunas &
                                                Dikonfirmasi)
                                            </Badge>
                                        )}
                                        {booking.user && (
                                            <span className="text-xs text-muted-foreground">
                                                Staf:{' '}
                                                <strong>
                                                    {booking.user.name}
                                                </strong>
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-left md:text-right">
                                        <span className="text-xs text-muted-foreground">
                                            Total Tagihan ({booking.total_days}{' '}
                                            hari •{' '}
                                            {booking.payment_method.toUpperCase()}
                                            )
                                        </span>
                                        <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                                            {formatRupiah(booking.total_price)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Calon Pembeli & Alamat
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1.5 font-semibold">
                                            <User className="size-3.5 text-muted-foreground" />
                                            {booking.customer_name}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Phone className="size-3" />
                                            {booking.customer_phone}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            📍{' '}
                                            {booking.customer_address ||
                                                'Alamat belum diisi'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Unit Kendaraan yang Diminati
                                        </p>
                                        <p className="mt-0.5 font-semibold text-blue-600 dark:text-blue-400">
                                            {booking.car?.name ?? '-'}
                                        </p>
                                        <p className="font-mono text-xs text-muted-foreground">
                                            {booking.car?.license_plate ?? ''}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Waktu Peminjaman & Lokasi
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1.5 font-semibold">
                                            <Calendar className="size-3.5 text-muted-foreground" />
                                            {booking.start_date} →{' '}
                                            {booking.end_date} (
                                            {booking.total_days} Hr)
                                        </p>
                                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                                            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                            <span className="truncate">
                                                {booking.pickup_location}
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Data Verifikasi (KTP, SIM, KK)
                                        </p>
                                        {booking.customer_ktp_number ? (
                                            <div className="mt-0.5 space-y-0.5 text-xs">
                                                <p>
                                                    <strong>KTP:</strong>{' '}
                                                    {
                                                        booking.customer_ktp_number
                                                    }
                                                </p>
                                                <p>
                                                    <strong>SIM A:</strong>{' '}
                                                    {booking.customer_sim_number ||
                                                        '-'}
                                                </p>
                                                <p>
                                                    <strong>KK:</strong>{' '}
                                                    {booking.customer_kk_number ||
                                                        '-'}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                                Belum diinput oleh Marketing
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {(booking.marketing_notes ||
                                    booking.payment_proof_url ||
                                    booking.ktp_photo_url) && (
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 text-xs">
                                        <span className="text-muted-foreground">
                                            <strong>Catatan Marketing:</strong>{' '}
                                            {booking.marketing_notes || '-'}
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {booking.payment_proof_url && (
                                                <a
                                                    href={
                                                        booking.payment_proof_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                                                >
                                                    <ExternalLink className="size-3" />
                                                    <span>Bukti Transaksi</span>
                                                </a>
                                            )}
                                            {booking.ktp_photo_url && (
                                                <a
                                                    href={booking.ktp_photo_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    <ExternalLink className="size-3" />
                                                    <span>Foto KTP</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Controls */}
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="h-8 gap-1.5 border-emerald-500/40 text-xs text-emerald-700 dark:text-emerald-400"
                                        >
                                            <a
                                                href={`https://wa.me/${waPhone}?text=${waText}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <MessageCircle className="size-3.5" />
                                                <span>WhatsApp Pembeli</span>
                                            </a>
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setActiveWorkflowBooking(
                                                    booking,
                                                )
                                            }
                                            className="h-8 gap-1.5 bg-amber-600 text-xs text-white hover:bg-amber-500"
                                        >
                                            <FileCheck2 className="size-3.5" />
                                            <span>
                                                {booking.is_locked ||
                                                isReadOnly ||
                                                userRole === 'owner'
                                                    ? 'Lihat Rincian Transaksi'
                                                    : userRole === 'marketing'
                                                      ? 'Input Persyaratan'
                                                      : 'Periksa Persyaratan'}
                                            </span>
                                        </Button>

                                        {userRole === 'admin' &&
                                            !booking.is_locked &&
                                            booking.status ===
                                                'waiting_admin' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleAdminConfirm(
                                                            booking.id,
                                                        )
                                                    }
                                                    className="h-8 gap-1.5 bg-blue-600 text-xs text-white shadow-xs hover:bg-blue-500"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    <span>
                                                        Konfirmasi Pesanan
                                                    </span>
                                                </Button>
                                            )}
                                    </div>

                                    {userRole === 'admin' && !isReadOnly && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Status: Confirmed */}
                                            {booking.status === 'confirmed' && (
                                                <>
                                                    {booking.payment_status !==
                                                    'paid' ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        booking.id,
                                                                        'confirmed',
                                                                        'paid',
                                                                    )
                                                                }
                                                                className="h-8 gap-1.5 bg-emerald-600 text-xs text-white shadow-xs hover:bg-emerald-500"
                                                            >
                                                                <DollarSign className="size-3.5" />
                                                                <span>
                                                                    Catat
                                                                    Pelunasan
                                                                    (Lunas)
                                                                </span>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                disabled
                                                                className="h-8 cursor-not-allowed gap-1.5 bg-muted text-xs text-muted-foreground opacity-60"
                                                                title="Mobil tidak dapat dijalankan karena baru DP. Selesaikan pelunasan terlebih dahulu."
                                                            >
                                                                <KeyRound className="size-3.5" />
                                                                <span>
                                                                    Serah Terima
                                                                    Unit (Wajib
                                                                    Lunas)
                                                                </span>
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    booking.id,
                                                                    'ongoing',
                                                                    'paid',
                                                                )
                                                            }
                                                            className="h-8 gap-1.5 bg-blue-600 text-xs text-white shadow-xs hover:bg-blue-500"
                                                        >
                                                            <KeyRound className="size-3.5" />
                                                            <span>
                                                                Serah Terima
                                                                Unit (Sedang
                                                                Jalan)
                                                            </span>
                                                        </Button>
                                                    )}

                                                    {!booking.is_locked && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleStatusChange(
                                                                    booking.id,
                                                                    'cancelled',
                                                                    booking.payment_status,
                                                                )
                                                            }
                                                            className="h-8 gap-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                                                        >
                                                            <Ban className="size-3.5" />
                                                            <span>
                                                                Batalkan
                                                            </span>
                                                        </Button>
                                                    )}
                                                </>
                                            )}

                                            {/* Status: Ongoing */}
                                            {booking.status === 'ongoing' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            booking.id,
                                                            'completed',
                                                            'paid',
                                                        )
                                                    }
                                                    className="h-8 gap-1.5 bg-emerald-600 text-xs text-white shadow-xs hover:bg-emerald-500"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    <span>
                                                        Mobil Selesai Kembali
                                                    </span>
                                                </Button>
                                            )}

                                            {/* Status: Waiting Admin - Pembatalan */}
                                            {booking.status ===
                                                'waiting_admin' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            booking.id,
                                                            'cancelled',
                                                            booking.payment_status,
                                                        )
                                                    }
                                                    className="h-8 gap-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                                                >
                                                    <Ban className="size-3.5" />
                                                    <span>Batalkan</span>
                                                </Button>
                                            )}

                                            {/* Delete for non-locked bookings that haven't completed/ongoing */}
                                            {!booking.is_locked &&
                                                booking.status !== 'ongoing' &&
                                                booking.status !==
                                                    'completed' && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(
                                                                booking,
                                                            )
                                                        }
                                                        className="h-8 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="mr-1 size-3.5" />
                                                        Hapus
                                                    </Button>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Workflow Modal (Marketing Input & Admin Confirm) */}
            {activeWorkflowBooking && (
                <BookingWorkflowModal
                    key={activeWorkflowBooking.id}
                    booking={activeWorkflowBooking}
                    userRole={userRole}
                    isReadOnly={isReadOnly}
                    currentUserId={currentUserId}
                    cars={cars}
                    onClose={() => setActiveWorkflowBooking(null)}
                />
            )}

            {/* Create Manual Booking Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h2 className="text-lg font-bold">
                                Input Pesanan Rental Baru
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateBooking}
                            className="mt-4 space-y-4"
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="car_id">
                                    Pilih Unit Mobil *
                                </Label>
                                <select
                                    id="car_id"
                                    value={form.data.car_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'car_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs dark:bg-slate-900"
                                >
                                    {cars.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.license_plate}) —{' '}
                                            {formatRupiah(c.price_per_day)}/hr
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name">
                                        Nama Calon Pembeli *
                                    </Label>
                                    <Input
                                        id="customer_name"
                                        required
                                        minLength={3}
                                        maxLength={100}
                                        value={form.data.customer_name}
                                        onChange={(e) =>
                                            form.setData(
                                                'customer_name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Nama lengkap penyewa"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_phone">
                                        Nomor WhatsApp *
                                    </Label>
                                    <Input
                                        id="customer_phone"
                                        required
                                        type="tel"
                                        inputMode="tel"
                                        minLength={10}
                                        maxLength={15}
                                        pattern="^(08|\+628|628)[0-9]{8,12}$"
                                        title="Nomor WhatsApp harus valid Indonesia (diawali 08 atau +628, 10-14 digit)"
                                        value={form.data.customer_phone}
                                        onChange={(e) =>
                                            form.setData(
                                                'customer_phone',
                                                e.target.value.replace(
                                                    /[^0-9+]/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        placeholder="Contoh: 082115332233"
                                    />
                                    <span className="text-[11px] text-muted-foreground">
                                        Format: 08xx-xxxx-xxxx (10-14 digit)
                                    </span>
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="customer_address">
                                        Alamat Lengkap Pembeli *
                                    </Label>
                                    <Input
                                        id="customer_address"
                                        required
                                        minLength={5}
                                        maxLength={255}
                                        value={form.data.customer_address}
                                        onChange={(e) =>
                                            form.setData(
                                                'customer_address',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Alamat domisili lengkap (minimal 5 karakter)"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date">
                                        Tanggal Mulai *
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        required
                                        value={form.data.start_date}
                                        onChange={(e) =>
                                            form.setData(
                                                'start_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="end_date">
                                        Tanggal Selesai *
                                    </Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        required
                                        min={form.data.start_date}
                                        value={form.data.end_date}
                                        onChange={(e) =>
                                            form.setData(
                                                'end_date',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.with_driver}
                                    onChange={(e) =>
                                        form.setData(
                                            'with_driver',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 rounded"
                                />
                                <span>
                                    Gunakan Sopir (+
                                    {formatRupiah(
                                        selectedCar?.with_driver_price ??
                                            150000,
                                    )}
                                    /hari)
                                </span>
                            </label>

                            <div className="rounded-xl bg-blue-500/10 p-3.5 text-sm">
                                <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400">
                                    <span>
                                        Total Tagihan ({totalDays} Hari):
                                    </span>
                                    <span>{formatRupiah(estTotal)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="bg-blue-600 text-white hover:bg-blue-500"
                                >
                                    Simpan Booking
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

BookingsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Pesanan & Booking',
            href: '/bookings',
        },
    ],
};
