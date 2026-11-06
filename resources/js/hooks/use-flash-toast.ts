import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const page = usePage<{ flash?: { toast?: FlashToast } }>();
    const flashToast = page.props.flash?.toast;

    useEffect(() => {
        if (flashToast) {
            const duration = 1500;
            if (flashToast.type === 'error') {
                toast.error(flashToast.message, { duration });
            } else if (flashToast.type === 'success') {
                toast.success(flashToast.message, { duration });
            } else if (flashToast.type === 'warning') {
                toast.warning(flashToast.message, { duration });
            } else {
                toast.info(flashToast.message, { duration });
            }
        }
    }, [flashToast]);

    useEffect(() => {
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
            removeHttpExceptionListener();
        };
    }, []);
}
