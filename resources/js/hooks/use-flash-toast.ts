import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        const removeFlashListener = router.on('flash', (event) => {
            const flash = (
                event.detail as unknown as {
                    flash?: { toast?: FlashToast };
                }
            )?.flash;
            const data = flash?.toast;

            if (!data) {
                return;
            }

            const duration = 1500;
            if (data.type === 'error') {
                toast.error(data.message, { duration });
            } else if (data.type === 'success') {
                toast.success(data.message, { duration });
            } else if (data.type === 'warning') {
                toast.warning(data.message, { duration });
            } else {
                toast.info(data.message, { duration });
            }
        });

        // Intercept HTTP exceptions (403, 422, etc.) to prevent full-screen white error modal
        const removeHttpExceptionListener = router.on(
            'httpException',
            (event) => {
                const response = event.detail.response;
                if (response?.status === 403) {
                    toast.error(
                        'Owner tidak bisa merubah ini. Akses Anda adalah Read-Only.',
                        { duration: 1500 },
                    );
                    return false;
                }
                if (response?.status === 422) {
                    toast.error(
                        'Tindakan tidak dapat diproses karena tidak memenuhi ketentuan.',
                        { duration: 2000 },
                    );
                    return false;
                }
            },
        );

        return () => {
            removeFlashListener();
            removeHttpExceptionListener();
        };
    }, []);
}
