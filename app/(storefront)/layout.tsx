import { StoreProvider } from '@/features/cart/StoreContext';
import { CartProvider } from '@/features/cart/CartContext';
import { PromotionsProvider } from '@/features/promotions/PromotionsContext';
import { CartAbandonTracker } from '@/features/cart/CartAbandonTracker';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import CartBar from '@/components/storefront/CartBar';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <CartProvider>
        <PromotionsProvider>
          <CartAbandonTracker />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pb-24">{children}</main>
            <Footer />
            <CartBar />
          </div>
        </PromotionsProvider>
      </CartProvider>
    </StoreProvider>
  );
}
