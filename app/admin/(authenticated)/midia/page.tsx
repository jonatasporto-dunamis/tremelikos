import { supabaseAdmin } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminMidiaPage() {
  // Lista imagens do bucket product-images via product_images table (fonte de verdade)
  const { data: images } = await supabaseAdmin
    .from('product_images')
    .select('product_id, path, alt_text, is_cover, created_at, products(name, active, available)')
    .order('created_at', { ascending: false })
    .limit(100);

  // qualidade — alerta se resolução < 600×600 ou tamanho > 500KB
  // (não temos client-side dims aqui; usamos heurística pelo nome)
  const list = (images || []) as any[];
  const totalSize = list.length;
  const coversCount = list.filter((i) => i.is_cover).length;
  const orphans = list.filter((i) => !i.products).length;
  const unused = list.filter((i) => !i.products?.active).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mídia e aparência</h1>
      <p className="text-sm text-gray-500 mb-6">Biblioteca de imagens e textos institucionais.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Imagens cadastradas" value={totalSize} />
        <Stat label="Capas" value={coversCount} />
        <Stat label="Sem produto" value={orphans} tone={orphans > 0 ? 'warning' : 'default'} />
        <Stat label="Produto inativo" value={unused} tone={unused > 0 ? 'warning' : 'default'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Biblioteca de imagens</h2>
          <p className="text-xs text-gray-500 mt-1">
            Adicione novas imagens direto na página de cada produto. Recomendações: 1200×1200, WebP, até 500KB.
          </p>
        </div>
        {list.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">
            Nenhuma imagem cadastrada ainda. Vá em <Link href="/admin/produtos" className="text-brand-text hover:underline">Produtos</Link> para adicionar.
          </p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3">
            {list.map((img) => (
              <li key={img.path} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="relative aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/image?path=${encodeURIComponent(img.path)}`}
                    alt={img.alt_text || img.products?.name || 'Imagem'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {img.is_cover && (
                    <span className="absolute top-1 left-1 text-[10px] bg-brand text-white px-1.5 py-0.5 rounded">
                      CAPA
                    </span>
                  )}
                </div>
                <div className="p-2 text-xs">
                  <p className="font-medium text-gray-900 truncate">{img.products?.name || '(sem produto)'}</p>
                  <p className="text-gray-500 truncate" title={img.path}>{img.path.split('/').pop()}</p>
                  {!img.products?.active && (
                    <p className="text-amber-700 mt-0.5">Produto inativo</p>
                  )}
                  <Link
                    href={`/admin/produtos/${img.product_id}`}
                    className="text-brand-text hover:underline mt-1 inline-block"
                  >
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="font-semibold text-gray-900 mb-2">Textos institucionais</h2>
        <p className="text-sm text-gray-500 mb-3">
          Edite logo, descrição, política e cores em <Link href="/admin/configuracoes/loja" className="text-brand-text hover:underline">Loja</Link>.
        </p>
        <p className="text-sm text-gray-500">
          Para cores e identidade visual, edite o <code className="bg-gray-100 px-1 rounded">tailwind.config.ts</code> + <code className="bg-gray-100 px-1 rounded">app/globals.css</code>.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' }) {
  return (
    <div className={`bg-white border rounded-xl p-3 ${tone === 'warning' ? 'border-amber-300' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${tone === 'warning' ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
