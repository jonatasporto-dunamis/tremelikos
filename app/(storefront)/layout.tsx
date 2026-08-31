import { StoreProvider } from '@/features/cart/StoreContext';
import { CartProvider } from '@/features/cart/CartContext';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import CartBar from '@/components/storefront/CartBar';
import CookieConsentBanner from '@/components/analytics/CookieConsent';
import GoogleTagManager from '@/components/analytics/GoogleTagManager';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pb-24">{children}</main>
          <Footer />
          <CartBar />
          <CookieConsentBanner />
        </div>
        <GoogleTagManager />
      </CartProvider>
    </StoreProvider>
  );
}
