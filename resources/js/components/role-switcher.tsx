import { router, usePage } from '@inertiajs/react';
import { Briefcase, Crown, Globe, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUserRoleBadge } from '@/lib/rental-utils';

export function RoleSwitcher() {
    const { auth } = usePage<{
        auth?: {
            user?: {
                id: number;
                name: string;
                email: string;
                role?: string;
            } | null;
        };
    }>().props;

    const currentRole = auth?.user?.role ?? 'guest';
    const currentBadge = getUserRoleBadge(currentRole);

    const handleSwitchRole = (role: string) => {
        router.post(
            '/switch-role',
            { role },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-500/20 bg-blue-500/5 px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Alur Akun Sistem:
                </span>
                {auth?.user ? (
                    <div className="flex items-center gap-1.5">
                        <Badge
                            variant="outline"
                            className={`${currentBadge.className} text-[11px]`}
                        >
                            {currentBadge.label}
                        </Badge>
                        <span className="hidden font-medium text-slate-500 sm:inline dark:text-slate-400">
                            ({auth.user.name})
                        </span>
                    </div>
                ) : (
                    <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    >
                        Halaman Guest (Calon Pembeli)
                    </Badge>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 hidden text-[11px] text-slate-400 lg:inline">
                    Simulasi Workflow:
                </span>

                <button
                    type="button"
                    onClick={() => handleSwitchRole('guest')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        !auth?.user
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                    title="Halaman Guest (Calon Pembeli memesan mobil)"
                >
                    <Globe className="size-3" />
                    <span>Guest (Pembeli)</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSwitchRole('marketing')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        currentRole === 'marketing'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                    title="Marketing (Terima Notifikasi, WA Pembeli, Input Persyaratan & Bukti Bayar, Klik DP/Lunas)"
                >
                    <Megaphone className="size-3" />
                    <span>Marketing</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSwitchRole('admin')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        currentRole === 'admin'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                    title="Admin (Konfirmasi Pesanan dari Marketing & Operasional Armada)"
                >
                    <Crown className="size-3" />
                    <span>Admin</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleSwitchRole('owner')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                        currentRole === 'owner'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                    title="Owner (Pantau Transaksi, Unduh Rekap Bulanan & Kelola Akun)"
                >
                    <Briefcase className="size-3" />
                    <span>Owner</span>
                </button>
            </div>
        </div>
    );
}
