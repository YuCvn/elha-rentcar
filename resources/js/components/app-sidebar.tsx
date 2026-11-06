import { Link, usePage } from '@inertiajs/react';
import {
    Briefcase,
    CalendarCheck2,
    CarFront,
    Globe,
    LayoutGrid,
    Mail,
    Megaphone,
    Phone,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
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

    const role = auth?.user?.role ?? 'admin';

    let mainNavItems: NavItem[] = [];

    if (role === 'owner') {
        mainNavItems = [
            {
                title: 'Dashboard & Rekap Bulanan',
                href: dashboard(),
                icon: Briefcase,
            },
            {
                title: 'Kelola Akun (Admin/Mkt)',
                href: '/users',
                icon: Users,
            },
            {
                title: 'Semua Transaksi Sewa',
                href: '/bookings',
                icon: CalendarCheck2,
            },
            {
                title: 'Armada & Utilisasi',
                href: '/fleet',
                icon: CarFront,
            },
        ];
    } else if (role === 'marketing') {
        mainNavItems = [
            {
                title: 'Notifikasi & Pesanan Baru',
                href: dashboard(),
                icon: Megaphone,
            },
            {
                title: 'Input Persyaratan & Laporan',
                href: '/bookings',
                icon: CalendarCheck2,
            },
            {
                title: 'Cek Armada Tersedia',
                href: '/fleet',
                icon: CarFront,
            },
        ];
    } else {
        // Admin Operasional (tidak memiliki akses ke /users karena khusus Owner)
        mainNavItems = [
            {
                title: 'Dashboard & Konfirmasi',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Konfirmasi & Jadwal Sewa',
                href: '/bookings',
                icon: CalendarCheck2,
            },
            {
                title: 'Manajemen Armada Mobil',
                href: '/fleet',
                icon: CarFront,
            },
        ];
    }

    const footerNavItems: NavItem[] = [
        {
            title: 'Halaman Guest (Calon Pembeli)',
            href: '/',
            icon: Globe,
        },
        {
            title: 'CS: +6282115332233',
            href: 'https://wa.me/6282115332233',
            icon: Phone,
        },
        {
            title: 'elhasubang@gmail.com',
            href: 'mailto:elhasubang@gmail.com',
            icon: Mail,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
