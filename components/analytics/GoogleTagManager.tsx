'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import {
  captureClickIds,
  getConsent,
  trackPageView,
} from '@/features/analytics/events';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function GoogleTagManager() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    const consent = getConsent();
    if (consent) {
      window.gtag('consent', 'update', {
        ad_storage: consent.ad_storage,
        analytics_storage: consent.analytics_storage,
        ad_user_data: consent.ad_user_data,
        ad_personalization: consent.ad_personalization,
      });
    } else {
      window.gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
      });
    }
    // fbq stub
    if (META_PIXEL_ID && !window.fbq) {
      const stub: any = function (...args: unknown[]) {
        if (stub.callMethod) stub.callMethod.apply(stub, args);
        else stub.queue.push(args);
      };
      stub.push = stub;
      stub.loaded = false;
      stub.version = '2.0';
      stub.queue = [];
      window.fbq = stub;
    }
    captureClickIds();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (pathname?.startsWith('/admin')) return;
    trackPageView(pathname || '/', document.title);
  }, [pathname, ready]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      {META_PIXEL_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}