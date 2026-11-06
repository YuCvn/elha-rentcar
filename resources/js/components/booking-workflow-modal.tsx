import { router } from '@inertiajs/react';
import {
    Calendar,
    Car as CarIcon,
    CheckCircle2,
    CreditCard,
    DollarSign,
    ExternalLink,
    FileCheck2,
    FileText,
    KeyRound,
    MapPin,
    MessageCircle,
    Phone,
    ShieldCheck,
    Upload,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';
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
import type { Booking, Car } from '@/types/rental';

interface BookingWorkflowModalProps {
    booking: Booking;
    userRole: string;
    isReadOnly?: boolean;
    currentUserId?: number;
    cars?: Car[];
    onClose: () => void;
}

export function BookingWorkflowModal({
    booking,
    userRole,
    isReadOnly = false,
    currentUserId,
    cars = [],
    onClose,
}: BookingWorkflowModalProps) {
    const isLocked = Boolean(
        booking.is_locked ||
        (booking.confirmed_by_admin_at && booking.payment_status === 'paid'),
    );
    const isOwnerRole = userRole === 'owner';
    const isDifferentMarketing =
        userRole === 'marketing' &&
        booking.user_id !== null &&
        currentUserId !== undefined &&
        booking.user_id !== currentUserId;

    const canEdit =
        !isLocked && !isOwnerRole && !isReadOnly && !isDifferentMarketing;

    const [selectedCarId, setSelectedCarId] = useState<number>(booking.car_id);
    const [ktpNumber, setKtpNumber] = useState(
        booking.customer_ktp_number ?? booking.customer_identity_number ?? '',
    );
    const [simNumber, setSimNumber] = useState(
        booking.customer_sim_number ?? '',
    );
    const [kkNumber, setKkNumber] = useState(booking.customer_kk_number ?? '');
    const [address, setAddress] = useState(booking.customer_address ?? '');
    const [startDate, setStartDate] = useState(booking.start_date.slice(0, 10));
    const [endDate, setEndDate] = useState(booking.end_date.slice(0, 10));
    const [withDriver, setWithDriver] = useState(booking.with_driver);
    const [pickupLocation, setPickupLocation] = useState(
        booking.pickup_location || 'Kantor Elha Rent Car Subang',
    );
    const [returnLocation, setReturnLocation] = useState(
        booking.return_location || 'Kantor Elha Rent Car Subang',
    );
    const [paymentMethod, setPaymentMethod] = useState(
        booking.payment_method || 'transfer_bank',
    );
    const [marketingNotes, setMarketingNotes] = useState(
        booking.marketing_notes ?? '',
    );

    const [ktpPhoto, setKtpPhoto] = useState<File | null>(null);
    const [simPhoto, setSimPhoto] = useState<File | null>(null);
    const [kkPhoto, setKkPhoto] = useState<File | null>(null);
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalDays = calculateDays(startDate, endDate);
    const selectedCar = cars.find((c) => c.id === selectedCarId) ?? booking.car;
    const carRate = selectedCar?.price_per_day ?? booking.car_price_per_day;
    const driverRate = selectedCar?.with_driver_price ?? 150000;
    const finalTotal =
        carRate * totalDays + (withDriver ? driverRate * totalDays : 0);

    const availableCarOptions =
        cars.length > 0
            ? cars.filter(
                  (c) =>
                      c.status === 'available' ||
                      c.id === booking.car_id ||
                      c.id === selectedCarId,
              )
            : booking.car
              ? [booking.car]
              : [];

    const waPhone = formatWhatsAppNumber(booking.customer_phone);
    const currentCarName = selectedCar?.name ?? 'Armada Elha';
    const currentLicensePlate = selectedCar?.license_plate ?? '';
    const waText = encodeURIComponent(
        `Halo Kak ${booking.customer_name}, kami dari Tim Marketing Elha Rent Car Subang.\n\nMenindaklanjuti pesanan mobil *${currentCarName}* (Plat: *${currentLicensePlate}*, Kode: *${booking.booking_code}*) untuk tanggal *${startDate}* s/d *${endDate}*.\n\nMohon kirimkan kelengkapan persyaratan berikut untuk verifikasi kami:\n- Foto & Nomor NIK KTP (16 Digit Angka)\n- Foto & Nomor SIM A (12-16 Digit Angka)\n- Foto & Nomor Kartu Keluarga (KK 16 Digit Angka)\n- Konfirmasi jadwal peminjaman final\n- Bukti transfer pembayaran (DP 50% / Lunas)\n\nTerima kasih!`,
    );

    const handleMarketingSubmit = (targetPaymentStatus: 'dp' | 'paid') => {
        const cleanKtp = ktpNumber.trim().replace(/\D/g, '');
        const cleanSim = simNumber.trim().replace(/\D/g, '');
        const cleanKk = kkNumber.trim().replace(/\D/g, '');

        if (cleanKtp.length !== 16) {
            window.alert(
                `Nomor NIK KTP wajib terdiri dari tepat 16 digit angka (saat ini: ${cleanKtp.length} digit).`,
            );
            return;
        }

        if (cleanSim.length < 12 || cleanSim.length > 16) {
            window.alert(
                `Nomor SIM A wajib terdiri dari 12 hingga 16 digit angka (saat ini: ${cleanSim.length} digit).`,
            );
            return;
        }

        if (cleanKk.length !== 16) {
            window.alert(
                `Nomor Kartu Keluarga (KK) wajib terdiri dari tepat 16 digit angka (saat ini: ${cleanKk.length} digit).`,
            );
            return;
        }

        if (!address || address.trim().length < 5) {
            window.alert(
                'Mohon lengkapi alamat lengkap domisili calon pembeli minimal 5 karakter.',
            );
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/bookings/${booking.id}/marketing-verify`,
            {
                car_id: selectedCarId,
                customer_ktp_number: cleanKtp,
                customer_sim_number: cleanSim,
                customer_kk_number: cleanKk,
                customer_address: address.trim(),
                start_date: startDate,
                end_date: endDate,
                with_driver: withDriver,
                pickup_location: pickupLocation,
                return_location: returnLocation,
                payment_method: paymentMethod,
                payment_status: targetPaymentStatus,
                marketing_notes: marketingNotes,
                ktp_photo: ktpPhoto,
                sim_photo: simPhoto,
                kk_photo: kkPhoto,
                payment_proof: paymentProof,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleAdminConfirm = () => {
        setIsSubmitting(true);
        router.patch(
            `/bookings/${booking.id}/admin-confirm`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleAdminMarkPaid = () => {
        setIsSubmitting(true);
        router.patch(
            `/bookings/${booking.id}/status`,
            { payment_status: 'paid' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleAdminDispatchOngoing = () => {
        if (booking.payment_status !== 'paid') {
            window.alert(
                'Mobil belum dapat dijalankan karena baru DP (Belum Lunas). Harap selesaikan pelunasan tagihan terlebih dahulu.',
            );
            return;
        }
        setIsSubmitting(true);
        router.patch(
            `/bookings/${booking.id}/status`,
            { status: 'ongoing' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const statusBadge = getBookingStatusBadge(booking.status);
    const paymentBadge = getPaymentStatusBadge(booking.payment_status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
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
                                className={paymentBadge.className}
                            >
                                {paymentBadge.label}
                            </Badge>
                        </div>
                        <h3 className="mt-1 text-xl font-bold">
                            {userRole === 'marketing'
                                ? 'Laporan Verifikasi Marketing (KTP, SIM, KK & Bukti Bayar)'
                                : 'Pemeriksaan & Konfirmasi Laporan Pesanan'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Unit Kendaraan yang Diminati:{' '}
                            <strong className="text-foreground">
                                {selectedCar?.name ?? 'Armada Elha'} (
                                {selectedCar?.license_plate})
                            </strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Banner Status Terkunci / Mode Pantauan */}
                {isLocked && (
                    <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-300">
                        <strong>🔒 Transaksi Terkunci Permanen:</strong> Pesanan
                        ini telah dikonfirmasi Admin dan berstatus LUNAS. Sesuai
                        aturan sistem, rincian transaksi tidak dapat diubah
                        lagi.
                    </div>
                )}
                {!isLocked && isOwnerRole && (
                    <div className="mt-4 rounded-xl border border-blue-500/40 bg-blue-500/10 p-3 text-xs text-blue-800 dark:text-blue-300">
                        <strong>ℹ️ Mode Pantauan Owner (Read-Only):</strong>{' '}
                        Owner hanya memiliki hak akses melihat transaksi dan
                        mengunduh rekap keuangan, tidak dapat mengubah isi
                        transaksi.
                    </div>
                )}
                {!isLocked && isDifferentMarketing && (
                    <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                        <strong>⚠️ Hak Akses Staf:</strong> Transaksi ini
                        ditangani oleh staf marketing lain. Anda hanya dapat
                        melihat rincian tanpa izin mengubah data.
                    </div>
                )}

                {/* Calon Pembeli Info & Direct WhatsApp Button */}
                <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:flex-row sm:items-center">
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <User className="size-4 text-emerald-600" />
                            <span>Calon Pembeli: {booking.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="size-3.5" />
                            <span>No. WhatsApp: {booking.customer_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="size-3.5" />
                            <span>
                                Alamat:{' '}
                                {booking.customer_address ||
                                    'Belum diisi lengkap'}
                            </span>
                        </div>
                        {booking.notes && (
                            <p className="text-amber-700 dark:text-amber-400">
                                Catatan Pembeli: &ldquo;{booking.notes}&rdquo;
                            </p>
                        )}
                    </div>

                    <Button
                        asChild
                        className="shrink-0 gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                        <a
                            href={`https://wa.me/${waPhone}?text=${waText}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <MessageCircle className="size-4" />
                            <span>WhatsApp Calon Pembeli</span>
                        </a>
                    </Button>
                </div>

                {/* Existing Uploaded Documents Preview (Visible to Admin, Owner, and Marketing) */}
                {(booking.ktp_photo_url ||
                    booking.sim_photo_url ||
                    booking.kk_photo_url ||
                    booking.payment_proof_url) && (
                    <div className="mt-4 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
                        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-blue-700 uppercase dark:text-blue-300">
                            <FileCheck2 className="size-4" />
                            Lampiran Dokumen & Screenshot Bukti Transaksi
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {booking.ktp_photo_url && (
                                <a
                                    href={booking.ktp_photo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-background px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                                >
                                    <ExternalLink className="size-3.5" />
                                    <span>Lihat Foto KTP</span>
                                </a>
                            )}
                            {booking.sim_photo_url && (
                                <a
                                    href={booking.sim_photo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-background px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                                >
                                    <ExternalLink className="size-3.5" />
                                    <span>Lihat Foto SIM A</span>
                                </a>
                            )}
                            {booking.kk_photo_url && (
                                <a
                                    href={booking.kk_photo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-background px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                                >
                                    <ExternalLink className="size-3.5" />
                                    <span>Lihat Foto KK</span>
                                </a>
                            )}
                            {booking.payment_proof_url && (
                                <a
                                    href={booking.payment_proof_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                                >
                                    <ExternalLink className="size-3.5" />
                                    <span>
                                        Lihat Screenshot Bukti Transaksi
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Form Data KTP, SIM, KK, Waktu Peminjaman Final, dan Bukti Transaksi */}
                <div className="mt-5 space-y-5">
                    {/* Unit Kendaraan & Pilihan Plat Nomor */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <CarIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>Unit Kendaraan & Plat Nomor</span>
                            </h4>
                            {selectedCarId !== booking.car_id ? (
                                <Badge className="bg-amber-500 text-[11px] text-white">
                                    Unit / Plat Diubah
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="font-mono text-[11px]"
                                >
                                    Plat: {selectedCar?.license_plate}
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="wf_car_select"
                                className="text-xs text-muted-foreground"
                            >
                                Pilih / Pindahkan Unit Kendaraan & Nomor Plat
                                (Sesuai Permintaan Calon Pembeli):
                            </Label>
                            <select
                                id="wf_car_select"
                                value={selectedCarId}
                                disabled={!canEdit}
                                onChange={(e) =>
                                    setSelectedCarId(Number(e.target.value))
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-xs font-semibold shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {availableCarOptions.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.license_plate} — {c.name} (
                                        {formatRupiah(c.price_per_day)}/hari){' '}
                                        {c.id === booking.car_id
                                            ? '★ Unit Awal'
                                            : ''}
                                    </option>
                                ))}
                            </select>

                            <div className="flex flex-wrap items-center justify-between pt-1 text-xs">
                                <span className="text-muted-foreground">
                                    Mobil Terpilih:{' '}
                                    <strong className="text-foreground">
                                        {selectedCar?.name}
                                    </strong>{' '}
                                    • Plat:{' '}
                                    <strong className="font-mono text-foreground">
                                        {selectedCar?.license_plate}
                                    </strong>{' '}
                                    • Tarif:{' '}
                                    <strong className="text-foreground">
                                        {formatRupiah(carRate)}/hari
                                    </strong>
                                </span>
                                {selectedCarId !== booking.car_id && (
                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                        ⚠️ Pindah plat dari{' '}
                                        <strong>
                                            {booking.car?.license_plate}
                                        </strong>{' '}
                                        ➜{' '}
                                        <strong>
                                            {selectedCar?.license_plate}
                                        </strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Data Dokumen Identitas (KTP, SIM, KK) */}
                    <div className="rounded-xl border border-border p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                            <FileText className="size-4 text-amber-600" />
                            <span>
                                Data Identitas Wajib (KTP, SIM A, & Kartu
                                Keluarga)
                            </span>
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="wf_ktp">Nomor NIK KTP *</Label>
                                <Input
                                    id="wf_ktp"
                                    required
                                    maxLength={16}
                                    minLength={16}
                                    pattern="\d{16}"
                                    inputMode="numeric"
                                    value={ktpNumber}
                                    onChange={(e) =>
                                        setKtpNumber(
                                            e.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 16),
                                        )
                                    }
                                    placeholder="16 digit NIK KTP"
                                />
                                <span className="text-[10px] text-muted-foreground">
                                    {ktpNumber.replace(/\D/g, '').length}/16
                                    digit angka
                                </span>
                                <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-blue-600 hover:underline dark:text-blue-400">
                                    <Upload className="size-3" />
                                    <span>
                                        {ktpPhoto
                                            ? ktpPhoto.name
                                            : 'Upload Foto KTP (Opsional)'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) =>
                                            setKtpPhoto(
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="wf_sim">Nomor SIM A *</Label>
                                <Input
                                    id="wf_sim"
                                    required
                                    maxLength={16}
                                    minLength={12}
                                    pattern="\d{12,16}"
                                    inputMode="numeric"
                                    value={simNumber}
                                    onChange={(e) =>
                                        setSimNumber(
                                            e.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 16),
                                        )
                                    }
                                    placeholder="Nomor SIM A aktif"
                                />
                                <span className="text-[10px] text-muted-foreground">
                                    {simNumber.replace(/\D/g, '').length} digit
                                    (min 12, max 16)
                                </span>
                                <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-blue-600 hover:underline dark:text-blue-400">
                                    <Upload className="size-3" />
                                    <span>
                                        {simPhoto
                                            ? simPhoto.name
                                            : 'Upload Foto SIM (Opsional)'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) =>
                                            setSimPhoto(
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="wf_kk">
                                    Nomor Kartu Keluarga (KK) *
                                </Label>
                                <Input
                                    id="wf_kk"
                                    required
                                    maxLength={16}
                                    minLength={16}
                                    pattern="\d{16}"
                                    inputMode="numeric"
                                    value={kkNumber}
                                    onChange={(e) =>
                                        setKkNumber(
                                            e.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 16),
                                        )
                                    }
                                    placeholder="16 digit Nomor KK"
                                />
                                <span className="text-[10px] text-muted-foreground">
                                    {kkNumber.replace(/\D/g, '').length}/16
                                    digit angka
                                </span>
                                <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-[11px] text-blue-600 hover:underline dark:text-blue-400">
                                    <Upload className="size-3" />
                                    <span>
                                        {kkPhoto
                                            ? kkPhoto.name
                                            : 'Upload Foto KK (Opsional)'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) =>
                                            setKkPhoto(
                                                e.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            <div className="space-y-1.5 sm:col-span-3">
                                <Label htmlFor="wf_address">
                                    Alamat Lengkap Sesuai KTP/Domisili *
                                </Label>
                                <Input
                                    id="wf_address"
                                    required
                                    minLength={5}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Alamat lengkap penyewa (minimal 5 karakter)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Waktu Peminjaman Final & Lokasi */}
                    <div className="rounded-xl border border-border p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                            <Calendar className="size-4 text-blue-600" />
                            <span>
                                Waktu Peminjaman Final & Lokasi Serah Terima
                            </span>
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="wf_start">
                                    Tanggal Mulai Final *
                                </Label>
                                <Input
                                    id="wf_start"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="wf_end">
                                    Tanggal Selesai Final *
                                </Label>
                                <Input
                                    id="wf_end"
                                    type="date"
                                    min={startDate}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="wf_pickup">
                                    Lokasi Pengambilan / Jemput
                                </Label>
                                <Input
                                    id="wf_pickup"
                                    value={pickupLocation}
                                    onChange={(e) =>
                                        setPickupLocation(e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="wf_return">
                                    Lokasi Pengembalian
                                </Label>
                                <Input
                                    id="wf_return"
                                    value={returnLocation}
                                    onChange={(e) =>
                                        setReturnLocation(e.target.value)
                                    }
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={withDriver}
                                        onChange={(e) =>
                                            setWithDriver(e.target.checked)
                                        }
                                        className="size-4 rounded border-border"
                                    />
                                    <span>
                                        Termasuk Layanan Sopir Resmi (+
                                        {formatRupiah(driverRate)}/hari)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Bukti Transaksi & Catatan Laporan */}
                    <div className="rounded-xl border border-border p-4">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
                            <CreditCard className="size-4 text-emerald-600" />
                            <span>Bukti Transaksi & Catatan Laporan</span>
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="wf_method">
                                    Metode Pembayaran
                                </Label>
                                <select
                                    id="wf_method"
                                    value={paymentMethod}
                                    onChange={(e) =>
                                        setPaymentMethod(e.target.value)
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                >
                                    <option value="transfer_bank">
                                        Transfer Bank (BCA / Mandiri / BRI)
                                    </option>
                                    <option value="qris">
                                        QRIS Resmi Elha
                                    </option>
                                    <option value="ewallet">
                                        E-Wallet (GoPay / OVO / Dana)
                                    </option>
                                    <option value="cash">
                                        Tunai di Kantor Pool
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="wf_proof">
                                    Upload Screenshot Bukti Transaksi
                                </Label>
                                <Input
                                    id="wf_proof"
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) =>
                                        setPaymentProof(
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="text-xs"
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="wf_notes">
                                    Catatan Laporan Marketing untuk Admin
                                </Label>
                                <Input
                                    id="wf_notes"
                                    value={marketingNotes}
                                    onChange={(e) =>
                                        setMarketingNotes(e.target.value)
                                    }
                                    placeholder="Contoh: KTP, SIM A, KK asli sudah dicek via WA. Bukti transfer BCA Rp 750.000 terlampir."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Kalkulasi Final */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Total Tagihan Final ({totalDays} Hari{' '}
                                {withDriver ? '+ Sopir' : 'Lepas Kunci'}):
                            </span>
                            <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                                {formatRupiah(finalTotal)}
                            </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                            <p>
                                Estimasi DP 50%:{' '}
                                <strong>
                                    {formatRupiah(finalTotal * 0.5)}
                                </strong>
                            </p>
                            <p>
                                Pelunasan 100%:{' '}
                                <strong>{formatRupiah(finalTotal)}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Tutup
                        </Button>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Tombol Khusus Marketing: Kirim Laporan Pertama Kali atau Perbarui Laporan */}
                            {canEdit && userRole === 'marketing' && (
                                <>
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() =>
                                            handleMarketingSubmit('dp')
                                        }
                                        className="gap-1.5 bg-amber-600 text-white hover:bg-amber-500"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        <span>
                                            {booking.status === 'waiting_admin'
                                                ? 'Simpan Perubahan (Status DP)'
                                                : 'Klik Sudah DP (Kirim ke Admin)'}
                                        </span>
                                    </Button>

                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() =>
                                            handleMarketingSubmit('paid')
                                        }
                                        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        <span>
                                            {booking.status === 'waiting_admin'
                                                ? 'Simpan Perubahan (Status Lunas)'
                                                : 'Klik Sudah Lunas (Kirim ke Admin)'}
                                        </span>
                                    </Button>
                                </>
                            )}

                            {/* Tombol Konfirmasi Admin (Khusus Admin, Bukan Owner, dan Belum Terkunci) */}
                            {userRole === 'admin' &&
                                !isLocked &&
                                (booking.status === 'waiting_admin' ||
                                    booking.status === 'pending') && (
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleAdminConfirm}
                                        className="gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                                    >
                                        <ShieldCheck className="size-4" />
                                        <span>
                                            Konfirmasi Pesanan (Setujui Admin)
                                        </span>
                                    </Button>
                                )}

                            {/* Tindakan Operasional Admin untuk Pesanan yang Sudah Dikonfirmasi */}
                            {userRole === 'admin' &&
                                !isReadOnly &&
                                booking.status === 'confirmed' && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {booking.payment_status !== 'paid' ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={
                                                        handleAdminMarkPaid
                                                    }
                                                    className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500"
                                                >
                                                    <DollarSign className="size-4" />
                                                    <span>
                                                        Catat Pelunasan Tagihan
                                                        (Lunas)
                                                    </span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    disabled
                                                    className="cursor-not-allowed gap-1.5 bg-muted text-muted-foreground opacity-60"
                                                    title="Mobil tidak dapat dijalankan karena baru DP. Pelunasan harus diselesaikan terlebih dahulu."
                                                >
                                                    <KeyRound className="size-4" />
                                                    <span>
                                                        Serah Terima Unit (Wajib
                                                        Lunas)
                                                    </span>
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                type="button"
                                                disabled={isSubmitting}
                                                onClick={
                                                    handleAdminDispatchOngoing
                                                }
                                                className="gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                                            >
                                                <KeyRound className="size-4" />
                                                <span>
                                                    Serah Terima Unit (Sedang
                                                    Jalan)
                                                </span>
                                            </Button>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
