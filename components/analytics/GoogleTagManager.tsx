'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackViewMenu } from '@/features/analytics/events';

export default function GoogleTagManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname === '/') {
      trackViewMenu();
    }
  }, [pathname, searchParams]);

  return null;
}
