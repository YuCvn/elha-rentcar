import { Head, Link, router } from '@inertiajs/react';
import {
    BellRing,
    CalendarCheck2,
    CarFront,
    CheckCircle2,
    DollarSign,
    Download,
    FileCheck2,
    FileSpreadsheet,
    KeyRound,
    MapPin,
    Megaphone,
    MessageCircle,
    Percent,
    Phone,
    PlayCircle,
    ShieldCheck,
    TrendingUp,
    UserPlus,
    Users,
    Wallet,
    Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { BookingWorkflowModal } from '@/components/booking-workflow-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    formatRupiah,
    formatWhatsAppNumber,
    getBookingStatusBadge,
    getCarStatusBadge,
    getPaymentStatusBadge,
    getUserRoleBadge,
} from '@/lib/rental-utils';
import { dashboard } from '@/routes';
import type { Booking, Car, DashboardStats } from '@/types/rental';

interface DashboardProps {
    userRole?: string;
    stats: DashboardStats;
    recentBookings: Booking[];
    pendingLeads: Booking[];
    waitingAdminBookings?: Booking[];
    topCars: Car[];
    cars: Car[];
}

export default function Dashboard({
    userRole = 'admin',
    stats,
    recentBookings,
    pendingLeads,
    waitingAdminBookings = [],
    topCars,
    cars,
}: DashboardProps) {
    const [activeBookingModal, setActiveBookingModal] =
        useState<Booking | null>(null);
    const [exportMonth, setExportMonth] = useState<string>('all');
    const [exportYear, setExportYear] = useState<string>(
        String(new Date().getFullYear()),
    );

    const roleBadge = getUserRoleBadge(userRole);

    const handleQuickAdminConfirm = (bookingId: number) => {
        router.patch(
            `/bookings/${bookingId}/admin-confirm`,
            {},
            { preserveScroll: true },
        );
    };

    const handleQuickStatus = (
        bookingId: number,
        status: string,
        paymentStatus: string,
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

    return (
        <>
            <Head
                title={
                    userRole === 'owner'
                        ? 'Dashboard Owner & Rekap Bulanan'
                        : userRole === 'marketing'
                          ? 'Dashboard Marketing - Pesanan Baru'
                          : 'Dashboard Admin - Konfirmasi & Operasional'
                }
            />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Role-Based Adaptive Header */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-1.5 flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className={roleBadge.className}
                            >
                                {roleBadge.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                Elha Rent Car Subang
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {userRole === 'owner' &&
                                'Dashboard Direktur / Owner & Rekap Bulanan'}
                            {userRole === 'marketing' &&
                                'Portal Marketing: Notifikasi Pesanan Baru & Verifikasi WA'}
                            {userRole === 'admin' &&
                                'Pusat Konfirmasi Admin & Operasional Armada'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {userRole === 'owner' &&
                                'Pantau performa finansial, unduh file rekap transaksi bulanan, serta kelola akun Admin & Marketing.'}
                            {userRole === 'marketing' &&
                                'Terima notifikasi pesanan dari Calon Pembeli, hubungi via WhatsApp, input KTP/SIM/KK & bukti transaksi, lalu klik Sudah DP / Lunas.'}
                            {userRole === 'admin' &&
                                'Periksa laporan verifikasi dari Marketing (KTP, SIM, KK, & Bukti Bayar), konfirmasi pesanan, dan kelola armada mobil.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {userRole === 'owner' && (
                            <>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <Link href="/users">
                                        <Users className="size-4" />
                                        <span>
                                            Kelola Akun (Admin & Marketing)
                                        </span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="gap-1.5 bg-purple-600 text-white hover:bg-purple-500"
                                >
                                    <a
                                        href={`/reports/monthly-export?month=${exportMonth}&year=${exportYear}`}
                                    >
                                        <Download className="size-4" />
                                        <span>Download Rekap Bulanan</span>
                                    </a>
                                </Button>
                            </>
                        )}

                        {userRole === 'marketing' && (
                            <Button
                                asChild
                                size="sm"
                                className="gap-1.5 bg-amber-600 text-white hover:bg-amber-500"
                            >
                                <Link href="/bookings">
                                    <Megaphone className="size-4" />
                                    <span>Semua Laporan Pesanan</span>
                                </Link>
                            </Button>
                        )}

                        {userRole === 'admin' && (
                            <>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <Link href="/fleet">
                                        <CarFront className="size-4" />
                                        <span>Kelola Armada</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                                >
                                    <Link href="/bookings">
                                        <CalendarCheck2 className="size-4" />
                                        <span>Semua Jadwal & Konfirmasi</span>
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 1. TAMPILAN KHUSUS MARKETING: NOTIFIKASI PESANAN BARU */}
                {/* ========================================================= */}
                {userRole === 'marketing' && (
                    <>
                        {/* Banner Notifikasi Pesanan Baru dari Calon Pembeli */}
                        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-5 shadow-xs">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                                        <BellRing className="size-6 animate-bounce" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-amber-600 text-white">
                                                NOTIFIKASI MARKETING
                                            </Badge>
                                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                Real-Time Alert
                                            </span>
                                        </div>
                                        <h2 className="mt-1 text-lg font-extrabold text-foreground sm:text-xl">
                                            {pendingLeads.length > 0
                                                ? `Ada ${pendingLeads.length} Pesanan Baru dari Calon Pembeli!`
                                                : 'Belum Ada Pesanan Baru yang Menunggu Follow-Up'}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                                            Segera hubungi Calon Pembeli via
                                            WhatsApp, minta foto/nomor{' '}
                                            <strong>KTP, SIM A, dan KK</strong>,
                                            pastikan waktu peminjaman final &
                                            bukti transaksi, lalu klik{' '}
                                            <strong>Sudah DP</strong> atau{' '}
                                            <strong>Sudah Lunas</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daftar Kartu Pesanan Baru dari Calon Pembeli */}
                        <div className="rounded-2xl border border-border bg-card shadow-xs">
                            <div className="flex items-center justify-between border-b border-border p-5">
                                <div>
                                    <h3 className="text-base font-bold">
                                        Daftar Pesanan Baru dari Calon Pembeli (
                                        {pendingLeads.length})
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Berisi data identitas calon penyewa,
                                        alamat domisili, jadwal sewa, serta unit
                                        kendaraan yang diminati
                                    </p>
                                </div>
                            </div>

                            {pendingLeads.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    Semua pesanan dari Calon Pembeli sudah
                                    diverifikasi dan diteruskan ke Admin.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {pendingLeads.map((lead) => {
                                        const waPhone = formatWhatsAppNumber(
                                            lead.customer_phone,
                                        );
                                        const waMsg = encodeURIComponent(
                                            `Halo Kak ${lead.customer_name}, kami dari Marketing Elha Rent Car Subang.\n\nKami menerima pesanan baru Anda:\n- Kode: ${lead.booking_code}\n- Unit Kendaraan: ${lead.car?.name ?? '-'}\n- Alamat: ${lead.customer_address ?? '-'}\n- Waktu Sewa: ${lead.start_date} s/d ${lead.end_date} (${lead.total_days} hari)\n- Lokasi: ${lead.pickup_location}\n- Estimasi Biaya: ${formatRupiah(lead.total_price)}\n\nMohon kirimkan foto/data *KTP, SIM A, dan KK*, konfirmasi waktu peminjaman final, serta screenshot *Bukti Transaksi (DP/Lunas)* agar pesanan segera kami proses ke Admin. Terima kasih!`,
                                        );

                                        return (
                                            <div
                                                key={lead.id}
                                                className="grid grid-cols-1 items-start gap-4 p-5 transition hover:bg-muted/20 lg:grid-cols-[1fr_auto] lg:items-center"
                                            >
                                                <div className="min-w-0 space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-300">
                                                            🔔 Pesanan Baru dari
                                                            Calon Pembeli
                                                        </Badge>
                                                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                                            {lead.booking_code}
                                                        </span>
                                                        <span className="text-sm font-bold text-foreground">
                                                            {lead.customer_name}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                        Unit Kendaraan yang
                                                        Diminati:{' '}
                                                        {lead.car?.name ??
                                                            'Armada Elha'}{' '}
                                                        (
                                                        {
                                                            lead.car
                                                                ?.license_plate
                                                        }
                                                        ) —{' '}
                                                        {lead.with_driver
                                                            ? 'Dengan Sopir'
                                                            : 'Lepas Kunci'}
                                                    </p>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                            <Phone className="size-3.5 text-emerald-600" />
                                                            {
                                                                lead.customer_phone
                                                            }
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="size-3.5 text-rose-500" />
                                                            Alamat:{' '}
                                                            {lead.customer_address ||
                                                                '-'}
                                                        </span>
                                                        <span>
                                                            📅 Waktu Sewa:{' '}
                                                            <strong>
                                                                {
                                                                    lead.start_date
                                                                }{' '}
                                                                s/d{' '}
                                                                {lead.end_date}
                                                            </strong>{' '}
                                                            ({lead.total_days}{' '}
                                                            Hari)
                                                        </span>
                                                        <span>
                                                            📍 Lokasi:{' '}
                                                            {
                                                                lead.pickup_location
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center lg:w-[410px] lg:justify-end">
                                                    <div className="w-32 shrink-0 text-left sm:text-right">
                                                        <span className="block text-[11px] font-medium text-muted-foreground">
                                                            Estimasi Biaya
                                                        </span>
                                                        <span className="text-base font-extrabold text-foreground">
                                                            {formatRupiah(
                                                                lead.total_price,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-56">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="w-full justify-center gap-1.5 bg-emerald-600 font-semibold text-white shadow-xs hover:bg-emerald-500"
                                                        >
                                                            <a
                                                                href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex w-full items-center justify-center gap-1.5"
                                                            >
                                                                <MessageCircle className="size-4 shrink-0" />
                                                                <span>
                                                                    WhatsApp
                                                                    Pembeli
                                                                </span>
                                                            </a>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                setActiveBookingModal(
                                                                    lead,
                                                                )
                                                            }
                                                            className="w-full justify-center gap-1.5 bg-blue-600 font-semibold text-white shadow-xs hover:bg-blue-500"
                                                        >
                                                            <FileCheck2 className="size-4 shrink-0" />
                                                            <span>
                                                                Input
                                                                Persyaratan
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Daftar Laporan Marketing yang Menunggu Konfirmasi Admin */}
                        <div className="rounded-2xl border border-border bg-card shadow-xs">
                            <div className="flex items-center justify-between border-b border-border p-5">
                                <div>
                                    <h3 className="text-base font-bold">
                                        Laporan Sudah Diinput Marketing —
                                        Menunggu Konfirmasi Admin (
                                        {waitingAdminBookings.length})
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Pesanan yang sudah dilengkapi KTP, SIM,
                                        KK, dan ditandai Sudah DP / Lunas oleh
                                        Marketing
                                    </p>
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {waitingAdminBookings.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground">
                                        Belum ada pesanan dalam antrean
                                        konfirmasi Admin.
                                    </div>
                                ) : (
                                    waitingAdminBookings.map((b) => {
                                        const waPhone = formatWhatsAppNumber(
                                            b.customer_phone,
                                        );
                                        const waMsg = encodeURIComponent(
                                            `Halo Kak ${b.customer_name}, laporan verifikasi data pesanan Anda (${b.booking_code}) sudah kami teruskan ke Admin Elha Rent Car untuk konfirmasi unit. Kami akan mengabari Anda segera. Terima kasih!`,
                                        );

                                        return (
                                            <div
                                                key={b.id}
                                                className="grid grid-cols-1 items-start gap-4 p-5 transition hover:bg-muted/15 lg:grid-cols-[1fr_auto] lg:items-center"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className="bg-purple-600/20 text-purple-700 dark:text-purple-300">
                                                            ⏳ Menunggu
                                                            Konfirmasi Admin
                                                        </Badge>
                                                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                                            {b.booking_code}
                                                        </span>
                                                        <span className="text-sm font-bold text-foreground">
                                                            {b.customer_name}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                getPaymentStatusBadge(
                                                                    b.payment_status,
                                                                ).className
                                                            }
                                                        >
                                                            {
                                                                getPaymentStatusBadge(
                                                                    b.payment_status,
                                                                ).label
                                                            }
                                                        </Badge>
                                                    </div>

                                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                        Mobil:{' '}
                                                        {b.car?.name ??
                                                            'Armada Elha'}{' '}
                                                        ({b.car?.license_plate})
                                                        —{' '}
                                                        {b.with_driver
                                                            ? 'Dengan Sopir'
                                                            : 'Lepas Kunci'}
                                                    </p>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                            <Phone className="size-3.5 text-emerald-600" />
                                                            {b.customer_phone}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="size-3.5 text-rose-500" />
                                                            Alamat:{' '}
                                                            {b.customer_address ||
                                                                '-'}
                                                        </span>
                                                        <span>
                                                            📅 Waktu Sewa Final:{' '}
                                                            <strong>
                                                                {b.start_date}{' '}
                                                                s/d {b.end_date}
                                                            </strong>{' '}
                                                            ({b.total_days}{' '}
                                                            Hari)
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                        <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                                                            NIK KTP:{' '}
                                                            <strong>
                                                                {b.customer_ktp_number ||
                                                                    '-'}
                                                            </strong>
                                                        </span>
                                                        <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                                                            SIM A:{' '}
                                                            <strong>
                                                                {b.customer_sim_number ||
                                                                    '-'}
                                                            </strong>
                                                        </span>
                                                        <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
                                                            KK:{' '}
                                                            <strong>
                                                                {b.customer_kk_number ||
                                                                    '-'}
                                                            </strong>
                                                        </span>
                                                        {b.payment_proof_url ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-emerald-500 text-emerald-600"
                                                            >
                                                                ✓ Bukti Transfer
                                                                Ada
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-amber-500 text-amber-600"
                                                            >
                                                                ! Bukti Belum
                                                                Upload
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {b.marketing_notes && (
                                                        <p className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
                                                            <strong>
                                                                Catatan
                                                                Marketing:
                                                            </strong>{' '}
                                                            {b.marketing_notes}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center lg:w-[410px] lg:justify-end">
                                                    <div className="w-32 shrink-0 text-left sm:text-right">
                                                        <span className="block text-[11px] font-medium text-muted-foreground">
                                                            Total Tagihan Final
                                                        </span>
                                                        <span className="text-base font-extrabold text-foreground">
                                                            {formatRupiah(
                                                                b.total_price,
                                                            )}
                                                        </span>
                                                        {b.payment_status ===
                                                            'dp' && (
                                                            <span className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                                DP Masuk:{' '}
                                                                {formatRupiah(
                                                                    b.total_price *
                                                                        0.5,
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-56">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="w-full justify-center gap-1.5 text-emerald-600 shadow-xs hover:text-emerald-500"
                                                        >
                                                            <a
                                                                href={`https://wa.me/${waPhone}?text=${waMsg}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex w-full items-center justify-center gap-1.5"
                                                            >
                                                                <MessageCircle className="size-4 shrink-0" />
                                                                <span>
                                                                    WhatsApp
                                                                    Pembeli
                                                                </span>
                                                            </a>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setActiveBookingModal(
                                                                    b,
                                                                )
                                                            }
                                                            className="w-full justify-center gap-1.5 border-blue-500/40 text-blue-600 shadow-xs hover:bg-blue-50 dark:text-blue-400"
                                                        >
                                                            <FileCheck2 className="size-4 shrink-0" />
                                                            <span>
                                                                Input
                                                                Persyaratan
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ========================================================= */}
                {/* 2. TAMPILAN KHUSUS ADMIN: KONFIRMASI LAPORAN MARKETING */}
                {/* ========================================================= */}
                {userRole === 'admin' && (
                    <>
                        {/* Kartu Statistik Operasional Admin */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-300">
                                        Menunggu Konfirmasi Admin
                                    </span>
                                    <ShieldCheck className="size-5 text-purple-600" />
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                                    {waitingAdminBookings.length} Pesanan
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Sudah diverifikasi Marketing (DP/Lunas)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Armada Siap Pakai
                                    </span>
                                    <CarFront className="size-5 text-emerald-600" />
                                </div>
                                <p className="mt-3 text-2xl font-bold">
                                    {stats.available_cars} / {stats.total_cars}{' '}
                                    Unit
                                </p>
                                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                    Tersedia di garasi Subang
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Sedang Disewa (On Road)
                                    </span>
                                    <KeyRound className="size-5 text-blue-600" />
                                </div>
                                <p className="mt-3 text-2xl font-bold">
                                    {stats.rented_cars} Unit
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Kendaraan sedang dibawa penyewa
                                </p>
                            </div>

                            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Servis / Perawatan
                                    </span>
                                    <Wrench className="size-5 text-amber-600" />
                                </div>
                                <p className="mt-3 text-2xl font-bold">
                                    {stats.maintenance_cars} Unit
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pengecekan berkala bengkel
                                </p>
                            </div>
                        </div>

                        {/* Antrean Konfirmasi Admin (Dari Laporan Marketing) */}
                        <div className="rounded-2xl border-2 border-purple-500/30 bg-card shadow-xs">
                            <div className="flex flex-col justify-between gap-2 border-b border-border bg-purple-500/5 p-5 sm:flex-row sm:items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-purple-600 text-white">
                                            TUGAS UTAMA ADMIN
                                        </Badge>
                                        <h2 className="text-base font-bold">
                                            Antrean Konfirmasi Pesanan dari
                                            Marketing (
                                            {waitingAdminBookings.length})
                                        </h2>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Marketing telah menginput KTP, SIM A,
                                        KK, jadwal final, dan bukti pembayaran
                                        (DP/Lunas). Silakan periksa dan klik{' '}
                                        <strong>Konfirmasi Pesanan</strong>.
                                    </p>
                                </div>
                            </div>

                            {waitingAdminBookings.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    Tidak ada antrean laporan dari Marketing
                                    yang menunggu konfirmasi Admin saat ini.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {waitingAdminBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-blue-600">
                                                        {booking.booking_code}
                                                    </span>
                                                    <span className="text-base font-bold">
                                                        {booking.customer_name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            getPaymentStatusBadge(
                                                                booking.payment_status,
                                                            ).className
                                                        }
                                                    >
                                                        {
                                                            getPaymentStatusBadge(
                                                                booking.payment_status,
                                                            ).label
                                                        }
                                                    </Badge>
                                                </div>

                                                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                    Unit: {booking.car?.name} (
                                                    {booking.car?.license_plate}
                                                    ) • Final:{' '}
                                                    {booking.start_date} s/d{' '}
                                                    {booking.end_date} (
                                                    {booking.total_days} Hari)
                                                </p>

                                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    <span>
                                                        🪪 <strong>KTP:</strong>{' '}
                                                        {booking.customer_ktp_number ||
                                                            '-'}
                                                    </span>
                                                    <span>
                                                        🪪{' '}
                                                        <strong>SIM A:</strong>{' '}
                                                        {booking.customer_sim_number ||
                                                            '-'}
                                                    </span>
                                                    <span>
                                                        🪪 <strong>KK:</strong>{' '}
                                                        {booking.customer_kk_number ||
                                                            '-'}
                                                    </span>
                                                    <span>
                                                        📍{' '}
                                                        <strong>Alamat:</strong>{' '}
                                                        {booking.customer_address ||
                                                            '-'}
                                                    </span>
                                                </div>

                                                {booking.marketing_notes && (
                                                    <p className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">
                                                        <strong>
                                                            Laporan Marketing:
                                                        </strong>{' '}
                                                        {
                                                            booking.marketing_notes
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:items-center">
                                                <div className="min-w-[125px] text-left sm:text-right">
                                                    <span className="block text-[11px] text-muted-foreground">
                                                        Total Tagihan Final
                                                    </span>
                                                    <span className="text-base font-extrabold text-emerald-600">
                                                        {formatRupiah(
                                                            booking.total_price,
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="flex min-w-[220px] flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setActiveBookingModal(
                                                                booking,
                                                            )
                                                        }
                                                        className="w-full justify-center"
                                                    >
                                                        Lihat Dokumen & Bukti
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleQuickAdminConfirm(
                                                                booking.id,
                                                            )
                                                        }
                                                        className="w-full justify-center gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                        <span>
                                                            Konfirmasi Pesanan
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ========================================================= */}
                {/* 3. TAMPILAN KHUSUS OWNER: REKAP BULANAN & KELOLA AKUN */}
                {/* ========================================================= */}
                {userRole === 'owner' && (
                    <>
                        {/* Panel Download Rekap Transaksi Bulanan & Kelola Akun */}
                        <div className="rounded-2xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent p-6 shadow-xs">
                            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-purple-600 text-white">
                                            KHUSUS OWNER
                                        </Badge>
                                        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                            Laporan & Kontrol Penuh Sistem
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-extrabold">
                                        Download File Rekap Transaksi Bulanan &
                                        Manajemen Akun
                                    </h2>
                                    <p className="text-xs text-muted-foreground sm:text-sm">
                                        Unduh rekapitulasi transaksi bulanan
                                        lengkap (format CSV/Excel) atau kelola
                                        pendaftaran & penghapusan akun Admin
                                        maupun Marketing.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <select
                                        value={exportMonth}
                                        onChange={(e) =>
                                            setExportMonth(e.target.value)
                                        }
                                        className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium"
                                    >
                                        <option value="all">Semua Bulan</option>
                                        <option value="1">Januari</option>
                                        <option value="2">Februari</option>
                                        <option value="3">Maret</option>
                                        <option value="4">April</option>
                                        <option value="5">Mei</option>
                                        <option value="6">Juni</option>
                                        <option value="7">Juli</option>
                                        <option value="8">Agustus</option>
                                        <option value="9">September</option>
                                        <option value="10">Oktober</option>
                                        <option value="11">November</option>
                                        <option value="12">Desember</option>
                                    </select>

                                    <select
                                        value={exportYear}
                                        onChange={(e) =>
                                            setExportYear(e.target.value)
                                        }
                                        className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-medium"
                                    >
                                        <option value="2026">Tahun 2026</option>
                                        <option value="2025">Tahun 2025</option>
                                    </select>

                                    <Button
                                        asChild
                                        className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
                                    >
                                        <a
                                            href={`/reports/monthly-export?month=${exportMonth}&year=${exportYear}`}
                                        >
                                            <FileSpreadsheet className="size-4" />
                                            <span>
                                                Download File Rekap Bulanan
                                                (.CSV)
                                            </span>
                                        </a>
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="gap-2 border-purple-500/40 text-purple-700 dark:text-purple-300"
                                    >
                                        <Link href="/users">
                                            <UserPlus className="size-4" />
                                            <span>
                                                Kelola Akun Admin & Marketing
                                            </span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Statistik Keuangan Owner */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                                        Pendapatan Lunas (Paid)
                                    </span>
                                    <DollarSign className="size-5 text-emerald-600" />
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                    {formatRupiah(stats.paid_revenue)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Kas bersih dari sewa lunas
                                </p>
                            </div>

                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                                        Uang Muka Masuk (DP 50%)
                                    </span>
                                    <Wallet className="size-5 text-amber-600" />
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                                    {formatRupiah(stats.dp_revenue ?? 0)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    DP pesanan terverifikasi
                                </p>
                            </div>

                            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                                        Total Nilai Transaksi
                                    </span>
                                    <TrendingUp className="size-5 text-blue-600" />
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                                    {formatRupiah(stats.potential_revenue)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Unit:{' '}
                                    {formatRupiah(stats.car_only_revenue ?? 0)}{' '}
                                    • Sopir:{' '}
                                    {formatRupiah(stats.driver_revenue ?? 0)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-400">
                                        Tingkat Utilisasi Armada
                                    </span>
                                    <Percent className="size-5 text-purple-600" />
                                </div>
                                <p className="mt-3 text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                                    {stats.utilization_rate ?? 0}%
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {stats.rented_cars} dari {stats.total_cars}{' '}
                                    unit sedang jalan
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Tabel Semua Transaksi & Status Workflow */}
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="rounded-2xl border border-border/80 bg-card shadow-xs lg:col-span-8">
                        <div className="flex items-center justify-between border-b border-border p-5">
                            <div>
                                <h2 className="text-base font-bold">
                                    Daftar Transaksi & Alur Verifikasi
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Alur: Guest Pesan → Marketing Verifikasi WA
                                    (KTP/SIM/KK & DP/Lunas) → Admin Konfirmasi
                                </p>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/bookings">Lihat Semua</Link>
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Kode & Pembeli
                                        </th>
                                        <th className="px-4 py-3">
                                            Armada & Jadwal
                                        </th>
                                        <th className="px-4 py-3">
                                            Dokumen (KTP/SIM/KK)
                                        </th>
                                        <th className="px-4 py-3">
                                            Total & Status
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentBookings.map((booking) => {
                                        const bBadge = getBookingStatusBadge(
                                            booking.status,
                                        );
                                        const pBadge = getPaymentStatusBadge(
                                            booking.payment_status,
                                        );

                                        return (
                                            <tr
                                                key={booking.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3.5">
                                                    <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                                        {booking.booking_code}
                                                    </p>
                                                    <p className="font-semibold">
                                                        {booking.customer_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {booking.customer_phone}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <p className="font-medium">
                                                        {booking.car?.name ??
                                                            '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {booking.start_date} s/d{' '}
                                                        {booking.end_date} (
                                                        {booking.total_days} hr)
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs">
                                                    {booking.customer_ktp_number ? (
                                                        <div className="space-y-0.5">
                                                            <p>
                                                                KTP:{' '}
                                                                {
                                                                    booking.customer_ktp_number
                                                                }
                                                            </p>
                                                            <p>
                                                                SIM:{' '}
                                                                {booking.customer_sim_number ||
                                                                    '-'}
                                                            </p>
                                                            <p>
                                                                KK:{' '}
                                                                {booking.customer_kk_number ||
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            Belum diinput
                                                            Marketing
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <p className="font-bold">
                                                        {formatRupiah(
                                                            booking.total_price,
                                                        )}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        <Badge
                                                            variant="outline"
                                                            className={`${bBadge.className} text-[10px]`}
                                                        >
                                                            {bBadge.label}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={`${pBadge.className} text-[10px]`}
                                                        >
                                                            {pBadge.label}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2.5 text-xs"
                                                            onClick={() =>
                                                                setActiveBookingModal(
                                                                    booking,
                                                                )
                                                            }
                                                        >
                                                            {userRole ===
                                                            'marketing'
                                                                ? 'Input Laporan'
                                                                : 'Detail / Bukti'}
                                                        </Button>

                                                        {userRole !==
                                                            'marketing' &&
                                                            booking.status ===
                                                                'waiting_admin' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 gap-1 bg-blue-600 px-2.5 text-xs text-white hover:bg-blue-500"
                                                                    onClick={() =>
                                                                        handleQuickAdminConfirm(
                                                                            booking.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>
                                                                        Konfirmasi
                                                                    </span>
                                                                </Button>
                                                            )}

                                                        {userRole !==
                                                            'marketing' &&
                                                            booking.status ===
                                                                'confirmed' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 gap-1 px-2 text-xs text-indigo-600"
                                                                    onClick={() =>
                                                                        handleQuickStatus(
                                                                            booking.id,
                                                                            'ongoing',
                                                                            booking.payment_status,
                                                                        )
                                                                    }
                                                                >
                                                                    <PlayCircle className="size-3.5" />
                                                                    <span>
                                                                        Jalan
                                                                    </span>
                                                                </Button>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Panel Samping: Armada Terlaris / Ketersediaan */}
                    <div className="rounded-2xl border border-border/80 bg-card shadow-xs lg:col-span-4">
                        <div className="flex items-center justify-between border-b border-border p-5">
                            <div>
                                <h2 className="text-base font-bold">
                                    Status Armada Subang
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Ketersediaan & performa unit
                                </p>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {(userRole === 'owner'
                                ? topCars
                                : cars.slice(0, 6)
                            ).map((car) => {
                                const cBadge = getCarStatusBadge(car.status);
                                return (
                                    <div
                                        key={car.id}
                                        className="flex items-center justify-between gap-3 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={
                                                    car.image_url ||
                                                    'https://www.elha.co.id/img/listmobil/mobil-avanza-all-new-cvt.jpeg'
                                                }
                                                alt={car.name}
                                                className="size-12 rounded-xl object-cover"
                                            />
                                            <div>
                                                <p className="text-sm leading-tight font-semibold">
                                                    {car.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {car.license_plate} •{' '}
                                                    {formatRupiah(
                                                        car.price_per_day,
                                                    )}
                                                    /hr
                                                </p>
                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                    <span>
                                                        {car.total_trips} trip selesai
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`${cBadge.className} text-[10px]`}
                                        >
                                            {cBadge.label}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Workflow Verifikasi Marketing & Konfirmasi Admin */}
            {activeBookingModal && (
                <BookingWorkflowModal
                    key={activeBookingModal.id}
                    booking={activeBookingModal}
                    userRole={userRole}
                    cars={cars}
                    onClose={() => setActiveBookingModal(null)}
                />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
