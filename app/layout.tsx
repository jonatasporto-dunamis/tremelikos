import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Tremeliko's Burguer | Hambúrguer na brasa, sabor de verdade",
  description:
    "Faça seu pedido online no Tremeliko's Burguer. Hamburgueria artesanal em Jequié/BA. Delivery e retirada.",
  keywords: ['hamburguer', 'jequie', 'delivery', 'tremelikos', 'lanche', 'brasa'],
  openGraph: {
    title: "Tremeliko's Burguer",
    description: 'Hambúrguer na brasa, sabor de verdade.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
