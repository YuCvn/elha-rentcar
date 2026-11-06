import { Head, router, useForm } from '@inertiajs/react';
import {
    Crown,
    Download,
    Filter,
    Mail,
    Phone,
    Search,
    Shield,
    Trash2,
    TrendingUp,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserRoleBadge } from '@/lib/rental-utils';
import type { UserItem } from '@/types/rental';

interface UsersPageProps {
    users: UserItem[];
    stats: {
        total: number;
        admins: number;
        owners: number;
        marketing: number;
    };
}

export default function UsersIndex({ users, stats }: UsersPageProps) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const createForm = useForm({
        name: '',
        email: '',
        phone: '0821-1533-2233',
        role: 'marketing',
        password: 'password',
    });

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                (u.phone && u.phone.includes(search));

            const matchesRole = roleFilter === 'all' || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/users', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                createForm.reset('name', 'email');
            },
        });
    };

    const handleRoleChange = (userId: number, newRole: string) => {
        setUpdatingUserId(userId);
        router.patch(
            `/users/${userId}/role`,
            { role: newRole },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingUserId(null),
            },
        );
    };

    const handleDeleteUser = (u: UserItem) => {
        if (
            window.confirm(
                `Apakah Anda yakin ingin menghapus akun ${u.name} (${u.email})?`,
            )
        ) {
            router.delete(`/users/${u.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Kelola Akun Staf (Khusus Owner)" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Badge className="bg-purple-600 text-white">
                                OTORITAS KHUSUS OWNER
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            Manajemen Akun Admin & Marketing
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Hanya Owner yang dapat melihat seluruh akun staf,
                            mendaftarkan akun baru, menghapusnya, serta
                            mengunduh rekap transaksi bulanan.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            asChild
                            variant="outline"
                            className="gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                        >
                            <a href="/reports/monthly-export?month=all&year=2026">
                                <Download className="size-4" />
                                <span>Download Rekap Bulanan (.CSV)</span>
                            </a>
                        </Button>

                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="gap-1.5 bg-purple-600 text-white hover:bg-purple-500"
                        >
                            <UserPlus className="size-4" />
                            <span>+ Daftarkan Akun Baru</span>
                        </Button>
                    </div>
                </div>

                {/* Role Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Total Akun Internal
                            </span>
                            <Users className="size-4 text-blue-600" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight">
                            {stats.total}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Akun Owner, Admin, & Marketing
                        </span>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Owner / Direktur
                            </span>
                            <Crown className="size-4 text-purple-600" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                            {stats.owners}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Pemegang hak akses tertinggi
                        </span>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Admin Operasional
                            </span>
                            <Shield className="size-4 text-blue-600" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                            {stats.admins}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Konfirmasi pesanan & kelola armada
                        </span>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-xs font-medium">
                                Marketing & Sales
                            </span>
                            <TrendingUp className="size-4 text-amber-600" />
                        </div>
                        <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                            {stats.marketing}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            Follow-up WA, KTP/SIM/KK & Bukti Bayar
                        </span>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 sm:max-w-md">
                        <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama staf, email, atau nomor telepon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Filter className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                            Filter:
                        </span>
                        {[
                            { key: 'all', label: 'Semua Staf' },
                            { key: 'owner', label: 'Owner' },
                            { key: 'admin', label: 'Admin' },
                            { key: 'marketing', label: 'Marketing' },
                        ].map((btn) => (
                            <button
                                key={btn.key}
                                type="button"
                                onClick={() => setRoleFilter(btn.key)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                    roleFilter === btn.key
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border/60 bg-muted/40 font-medium text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5">
                                        Nama & Identitas Staf
                                    </th>
                                    <th className="px-5 py-3.5">
                                        Email & Kontak
                                    </th>
                                    <th className="px-5 py-3.5">
                                        Jabatan / Role
                                    </th>
                                    <th className="px-5 py-3.5 text-center">
                                        Transaksi Ditangani
                                    </th>
                                    <th className="px-5 py-3.5">Terdaftar</th>
                                    <th className="px-5 py-3.5 text-right">
                                        Ubah Role / Hapus Akun
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data akun yang sesuai
                                            pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const roleBadge = getUserRoleBadge(
                                            u.role,
                                        );
                                        const isUpdating =
                                            updatingUserId === u.id;

                                        return (
                                            <tr
                                                key={u.id}
                                                className="transition hover:bg-muted/20"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-500/10 font-bold text-purple-600 dark:text-purple-400">
                                                            {u.name
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-foreground">
                                                                {u.name}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground">
                                                                ID: #{u.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    <div className="flex items-center gap-1.5 text-foreground">
                                                        <Mail className="size-3 text-muted-foreground" />
                                                        <span>{u.email}</span>
                                                    </div>
                                                    {u.phone && (
                                                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                                                            <Phone className="size-3 text-muted-foreground" />
                                                            <span>
                                                                {u.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            roleBadge.className
                                                        }
                                                    >
                                                        {roleBadge.label}
                                                    </Badge>
                                                </td>

                                                <td className="px-5 py-3.5 text-center">
                                                    <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted font-mono font-medium text-foreground">
                                                        {u.bookings_count ?? 0}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    {u.created_at
                                                        ? new Date(
                                                              u.created_at,
                                                          ).toLocaleDateString(
                                                              'id-ID',
                                                              {
                                                                  day: 'numeric',
                                                                  month: 'short',
                                                                  year: 'numeric',
                                                              },
                                                          )
                                                        : '-'}
                                                </td>

                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <select
                                                            disabled={
                                                                isUpdating
                                                            }
                                                            value={u.role}
                                                            onChange={(e) =>
                                                                handleRoleChange(
                                                                    u.id,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition hover:border-purple-500 focus:border-purple-500 focus:outline-hidden disabled:opacity-50"
                                                        >
                                                            <option value="marketing">
                                                                Marketing &
                                                                Sales
                                                            </option>
                                                            <option value="admin">
                                                                Admin
                                                                Operasional
                                                            </option>
                                                            <option value="owner">
                                                                Owner / Direktur
                                                            </option>
                                                        </select>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDeleteUser(
                                                                    u,
                                                                )
                                                            }
                                                            className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Daftarkan Akun Baru (Admin / Marketing) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <h2 className="text-lg font-bold">
                                    Daftarkan Akun Staf Baru
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Tambahkan akun Admin atau Marketing baru
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateUser}
                            className="mt-4 space-y-4"
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="new_name">
                                    Nama Lengkap Staf *
                                </Label>
                                <Input
                                    id="new_name"
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: Siska Marketing Subang"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new_email">
                                    Alamat Email Login *
                                </Label>
                                <Input
                                    id="new_email"
                                    type="email"
                                    required
                                    value={createForm.data.email}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="siska@elha.co.id"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new_phone">
                                    Nomor WhatsApp Staf
                                </Label>
                                <Input
                                    id="new_phone"
                                    value={createForm.data.phone}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="0821-xxxx-xxxx"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new_role">
                                    Jabatan / Peran Akun *
                                </Label>
                                <select
                                    id="new_role"
                                    value={createForm.data.role}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'role',
                                            e.target.value,
                                        )
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                >
                                    <option value="marketing">
                                        Marketing & Sales
                                    </option>
                                    <option value="admin">
                                        Admin Operasional
                                    </option>
                                    <option value="owner">
                                        Owner / Direktur
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="new_password">
                                    Password Login *
                                </Label>
                                <Input
                                    id="new_password"
                                    type="text"
                                    required
                                    minLength={6}
                                    value={createForm.data.password}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="bg-purple-600 text-white hover:bg-purple-500"
                                >
                                    Daftarkan Akun
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Akun Staf',
            href: '/users',
        },
    ],
};
