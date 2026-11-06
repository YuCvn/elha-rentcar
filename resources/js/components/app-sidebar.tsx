import { Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck2,
    CarFront,
    Globe,
    LayoutGrid,
    Mail,
    Phone,
    Sparkles,
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
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Armada',
                href: '/fleet',
                icon: CarFront,
            },
            {
                title: 'Booking',
                href: '/bookings',
                icon: CalendarCheck2,
            },
            {
                title: 'Services',
                href: '/#services',
                icon: Sparkles,
            },
            {
                title: 'Pengguna',
                href: '/users',
                icon: Users,
            },
        ];
    } else if (role === 'marketing') {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Armada',
                href: '/fleet',
                icon: CarFront,
            },
            {
                title: 'Booking',
                href: '/bookings',
                icon: CalendarCheck2,
            },
            {
                title: 'Services',
                href: '/#services',
                icon: Sparkles,
            },
        ];
    } else {
        // Admin Operasional
        mainNavItems = [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Armada',
                href: '/fleet',
                icon: CarFront,
            },
            {
                title: 'Booking',
                href: '/bookings',
                icon: CalendarCheck2,
            },
            {
                title: 'Services',
                href: '/#services',
                icon: Sparkles,
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
