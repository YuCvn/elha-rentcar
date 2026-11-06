import { Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck2,
    CarFront,
    Globe,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { RoleSwitcher } from '@/components/role-switcher';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const page = usePage<{
        auth?: {
            user?: {
                role?: string;
            } | null;
        };
    }>();
    const { url } = page;
    const role = page.props.auth?.user?.role ?? 'admin';

    const mobileBottomLinks = [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
        { title: 'Booking', href: '/bookings', icon: CalendarCheck2 },
        { title: 'Armada', href: '/fleet', icon: CarFront },
        ...(role === 'owner'
            ? [{ title: 'Akun Tim', href: '/users', icon: Users }]
            : []),
        { title: 'Guest', href: '/', icon: Globe },
    ];

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-w-0 overflow-x-clip pb-20 md:pb-6"
            >
                {/* Workflow Role Switcher Bar */}
                <RoleSwitcher />

                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}

                {/* Mobile Bottom Navigation Bar */}
                <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur md:hidden">
                    {mobileBottomLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === '/'
                                ? url === '/'
                                : url.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="size-5" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </AppContent>
        </AppShell>
    );
}
