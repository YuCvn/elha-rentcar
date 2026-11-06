import type { BookingStatus, CarStatus, PaymentStatus } from '@/types/rental';

export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatWhatsAppNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) {
        return '6282115332233';
    }
    if (digits.startsWith('0')) {
        return `62${digits.slice(1)}`;
    }
    if (digits.startsWith('8')) {
        return `62${digits}`;
    }
    return digits;
}

export function calculateDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) {
        return 1;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(1, days);
}

export function getCarStatusBadge(status: CarStatus): {
    label: string;
    className: string;
} {
    switch (status) {
        case 'available':
            return {
                label: 'Tersedia',
                className:
                    'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
            };
        case 'rented':
            return {
                label: 'Sedang Disewa',
                className:
                    'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',
            };
        case 'maintenance':
            return {
                label: 'Servis / Perawatan',
                className:
                    'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
            };
    }
}

export function getBookingStatusBadge(status: BookingStatus): {
    label: string;
    className: string;
} {
    switch (status) {
        case 'pending':
            return {
                label: 'Pesanan Baru (Marketing)',
                className:
                    'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
            };
        case 'waiting_admin':
            return {
                label: 'Menunggu Konfirmasi Admin',
                className:
                    'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400',
            };
        case 'confirmed':
            return {
                label: 'Terkonfirmasi Admin',
                className:
                    'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400',
            };
        case 'ongoing':
            return {
                label: 'Sedang Jalan',
                className:
                    'bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:text-indigo-400',
            };
        case 'completed':
            return {
                label: 'Selesai',
                className:
                    'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
            };
        case 'cancelled':
            return {
                label: 'Dibatalkan',
                className:
                    'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-400',
            };
    }
}

export function getPaymentStatusBadge(status: PaymentStatus): {
    label: string;
    className: string;
} {
    switch (status) {
        case 'unpaid':
            return {
                label: 'Belum Bayar',
                className:
                    'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-400',
            };
        case 'dp':
            return {
                label: 'Sudah DP',
                className:
                    'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
            };
        case 'paid':
            return {
                label: 'Sudah Lunas',
                className:
                    'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
            };
        case 'refunded':
            return {
                label: 'Refund',
                className:
                    'bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-400',
            };
    }
}

export function getUserRoleBadge(role: string): {
    label: string;
    className: string;
} {
    switch (role) {
        case 'owner':
            return {
                label: 'Owner / Direktur',
                className:
                    'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400',
            };
        case 'marketing':
            return {
                label: 'Marketing & Sales',
                className:
                    'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400',
            };
        case 'guest':
            return {
                label: 'Halaman Guest (Calon Pembeli)',
                className:
                    'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
            };
        default:
            return {
                label: 'Admin Operasional',
                className:
                    'bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400',
            };
    }
}
