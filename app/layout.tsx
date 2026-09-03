import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import GoogleTagManager from '@/components/analytics/GoogleTagManager';
import CookieConsentBanner from '@/components/analytics/CookieConsent';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import './globals.css';

const BASE = 'https://tremelikos.growthpulse.com.br';

// 10.2.7 — Montserrat via next/font/google com display: swap (evita FOUT/CLS)
const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "Tremeliko's Burguer | Hambúrguer na brasa, sabor de verdade",
    template: '%s — Tremeliko\'s Burguer',
  },
  description:
    "Faça seu pedido online no Tremeliko's Burguer. Hamburgueria artesanal em Jequié/BA. Delivery e retirada no balcão.",
  keywords: ['hamburguer', 'jequié', 'jequie', 'delivery', 'tremelikos', 'lanche', 'brasa', 'picanha', 'gourmet'],
  authors: [{ name: "Tremeliko's Burguer" }],
  alternates: {
    canonical: BASE,
  },
  openGraph: {
    title: "Tremeliko's Burguer | Hambúrguer na brasa, sabor de verdade",
    description: "Cardápio digital da hamburgueria artesanal em Jequié/BA.",
    type: 'website',
    locale: 'pt_BR',
    siteName: "Tremeliko's Burguer",
    url: BASE,
  },
  twitter: {
    card: 'summary_large_image',
    title: "Tremeliko's Burguer",
    description: "Hambúrguer na brasa, sabor de verdade.",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
};

const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: "Tremeliko's Burguer",
  image: `${BASE}/icon-512x512.png`,
  url: BASE,
  telephone: '+55-73-99154-2371',
  servesCuisine: 'Hambúrguer artesanal',
  priceRange: 'R$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua Gonçalves da Costa, 3',
    addressLocality: 'Jequié',
    addressRegion: 'BA',
    postalCode: '45208-089',
    addressCountry: 'BR',
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '18:30', closes: '23:00' },
  ],
  acceptsReservations: 'False',
  hasMenu: `${BASE}/`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <GoogleTagManager />
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}