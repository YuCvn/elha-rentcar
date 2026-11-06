import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Code2,
    Cpu,
    Layers,
    Play,
    Smartphone,
    Terminal,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ApiEndpoint {
    method: string;
    path: string;
    description: string;
}

interface AndroidGuideProps {
    apiEndpoints: ApiEndpoint[];
}

export default function AndroidGuide({ apiEndpoints }: AndroidGuideProps) {
    const [activeResponse, setActiveResponse] = useState<string>(
        '// Klik tombol "Test Live JSON" pada salah satu endpoint di atas untuk melihat respons API Android.',
    );
    const [loadingPath, setLoadingPath] = useState<string | null>(null);

    const testEndpoint = async (path: string) => {
        const resolvedPath = path
            .replace('{id}', '1')
            .replace('{booking_code}', 'ELH-202611-001');

        setLoadingPath(path);
        try {
            const res = await fetch(resolvedPath, {
                headers: { Accept: 'application/json' },
            });
            const json: unknown = await res.json();
            setActiveResponse(JSON.stringify(json, null, 2));
        } catch {
            setActiveResponse(
                '// Gagal memuat endpoint. Pastikan server aktif.',
            );
        } finally {
            setLoadingPath(null);
        }
    };

    return (
        <>
            <Head title="Integrasi Android & Mobile API" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white">
                    <Badge className="mb-2 bg-emerald-500 text-white">
                        Tidak Perlu Buat dari Awal!
                    </Badge>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Panduan Migrasi & Integrasi Aplikasi Android
                    </h1>
                    <p className="mt-1 max-w-3xl text-sm text-slate-300">
                        Project <strong>Elha RentCar</strong> ini sudah dibangun
                        menggunakan fondasi{' '}
                        <strong>
                            Hybrid-Ready (PWA + Capacitor + REST API v1)
                        </strong>
                        . Berikut adalah 3 jalur untuk menjadikannya aplikasi
                        Android tanpa membuat ulang dari awal:
                    </p>
                </div>

                {/* 3 Approaches */}
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="mb-3 flex items-center justify-between">
                            <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            >
                                Cara 1 • Instan (0% Koding Ulang)
                            </Badge>
                            <Smartphone className="size-5 text-emerald-500" />
                        </div>
                        <h2 className="text-lg font-bold">
                            PWA & Trusted Web Activity (.APK)
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            File <code>public/manifest.json</code>,{' '}
                            <code>public/sw.js</code>, dan Bottom Navigation Bar
                            Android sudah terpasang aktif di project ini.
                        </p>
                        <ul className="mt-4 space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                <span>
                                    Buka web ini di Chrome Android → Klik menu{' '}
                                    <strong>
                                        Install App / Tambahkan ke Layar Utama
                                    </strong>
                                    .
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                <span>
                                    Gunakan <strong>PWABuilder.com</strong>{' '}
                                    untuk mengunduh file <code>.apk</code> /{' '}
                                    <code>.aab</code> siap upload ke Google Play
                                    Store.
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="mb-3 flex items-center justify-between">
                            <Badge
                                variant="outline"
                                className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            >
                                Cara 2 • Hybrid Native (Reuse UI React)
                            </Badge>
                            <Layers className="size-5 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-bold">
                            CapacitorJS Android Wrapper
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            Membungkus komponen React TypeScript yang sudah ada
                            ke dalam container Android Studio asli dengan akses
                            Kamera, GPS, & Push Notification.
                        </p>
                        <div className="mt-4 rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-200">
                            <p>npm install @capacitor/core @capacitor/cli</p>
                            <p>
                                npx cap init &quot;Elha RentCar&quot;
                                com.elha.rentcar
                            </p>
                            <p>npm install @capacitor/android</p>
                            <p>
                                npx cap add android &amp;&amp; npx cap open
                                android
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xs">
                        <div className="mb-3 flex items-center justify-between">
                            <Badge
                                variant="outline"
                                className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            >
                                Cara 3 • Full Native (Reuse Backend 100%)
                            </Badge>
                            <Cpu className="size-5 text-purple-500" />
                        </div>
                        <h2 className="text-lg font-bold">
                            Flutter / React Native / Kotlin + Laravel API
                        </h2>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            Jika ingin membuat UI khusus dengan Flutter/Kotlin,
                            Anda{' '}
                            <strong>
                                tidak perlu membuat database & backend lagi
                            </strong>{' '}
                            karena REST API v1 sudah siap digunakan!
                        </p>
                        <ul className="mt-4 space-y-2 text-xs">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                                <span>
                                    Database Mobil & Booking terpusat (real-time
                                    antara Web Admin & HP Android).
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-purple-500" />
                                <span>
                                    Endpoint JSON <code>/api/v1/*</code> siap
                                    dikonsumsi dari aplikasi Android.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Live REST API Explorer */}
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs lg:col-span-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Code2 className="size-5 text-blue-600" />
                            <div>
                                <h2 className="text-lg font-bold">
                                    Daftar Endpoint REST API Android (v1)
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Klik tombol Test untuk menguji respons JSON
                                    secara langsung
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {apiEndpoints.map((ep) => (
                                <div
                                    key={ep.path}
                                    className="flex flex-col justify-between gap-3 rounded-xl border border-border p-3.5 sm:flex-row sm:items-center"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    ep.method === 'GET'
                                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                                                        : 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                                                }
                                            >
                                                {ep.method}
                                            </Badge>
                                            <code className="text-xs font-bold">
                                                {ep.path}
                                            </code>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {ep.description}
                                        </p>
                                    </div>

                                    {ep.method === 'GET' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={loadingPath === ep.path}
                                            onClick={() =>
                                                void testEndpoint(ep.path)
                                            }
                                            className="shrink-0 gap-1.5 text-xs"
                                        >
                                            <Play className="size-3.5 text-blue-600" />
                                            <span>
                                                {loadingPath === ep.path
                                                    ? 'Loading...'
                                                    : 'Test Live JSON'}
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col rounded-2xl border border-border bg-slate-950 p-5 text-slate-100 shadow-xs lg:col-span-6">
                        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="size-4 text-emerald-400" />
                                <span className="font-mono text-xs font-semibold text-emerald-400">
                                    Live JSON Response Inspector
                                </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                                Content-Type: application/json
                            </span>
                        </div>
                        <pre className="max-h-[420px] flex-1 overflow-auto rounded-xl bg-slate-900/90 p-4 font-mono text-xs leading-relaxed text-cyan-300">
                            {activeResponse}
                        </pre>
                    </div>
                </div>
            </div>
        </>
    );
}

AndroidGuide.layout = {
    breadcrumbs: [
        {
            title: 'Android & Mobile API',
            href: '/android-guide',
        },
    ],
};
