'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct, setProductSections, setProductOptionGroups, publishProduct } from '../../actions';
import ProductImageUploader from '@/components/admin/ProductImageUploader';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  badge: string | null;
  active: boolean;
  available: boolean;
  featured: boolean;
  sku: string | null;
}

interface Section { id: string; name: string; }
interface OptionGroup { id: string; name: string; }

interface Props {
  product: Product;
  allSections: Section[];
  allGroups: OptionGroup[];
  selectedSectionIds: string[];
  selectedGroupIds: string[];
  coverPath?: string | null;
}

export default function ProductEditForm({
  product,
  allSections,
  allGroups,
  selectedSectionIds: initialSectionIds,
  selectedGroupIds: initialGroupIds,
  coverPath: initialCoverPath = null,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [coverPath, setCoverPath] = useState<string | null>(initialCoverPath);
  const [sectionIds, setSectionIds] = useState<string[]>(initialSectionIds);
  const [groupIds, setGroupIds] = useState<string[]>(initialGroupIds);

  const handleSaveProduct = (formData: FormData) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await updateProduct(formData);
        setFeedback({ type: 'success', text: 'Produto atualizado.' });
        router.refresh();
      } catch (e: any) {
        setFeedback({ type: 'error', text: e?.message || 'Erro ao salvar' });
      }
    });
  };

  const handleSaveSections = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await setProductSections(product.id, sectionIds);
        setFeedback({ type: 'success', text: 'Seções atualizadas.' });
        router.refresh();
      } catch (e: any) {
        setFeedback({ type: 'error', text: e?.message || 'Erro' });
      }
    });
  };

  const handleSaveGroups = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await setProductOptionGroups(product.id, groupIds);
        setFeedback({ type: 'success', text: 'Grupos atualizados.' });
        router.refresh();
      } catch (e: any) {
        setFeedback({ type: 'error', text: e?.message || 'Erro' });
      }
    });
  };

  const handlePublish = () => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await publishProduct(product.id);
        setFeedback({ type: 'success', text: 'Produto publicado — cardápio invalidado.' });
        router.refresh();
      } catch (e: any) {
        setFeedback({ type: 'error', text: e?.message || 'Erro' });
      }
    });
  };

  const handleImageChange = async (path: string | null) => {
    setFeedback(null);
    try {
      // upsert na tabela product_images com is_cover=true
      if (path) {
        // marca outras como não-capa
        await fetch(`/api/admin/product-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, path, isCover: true }),
        });
      } else {
        // remove
        await fetch(`/api/admin/product-images?productId=${product.id}`, { method: 'DELETE' });
      }
      setCoverPath(path);
      setFeedback({ type: 'success', text: path ? 'Imagem definida como capa.' : 'Imagem removida.' });
      router.refresh();
    } catch (e: any) {
      setFeedback({ type: 'error', text: e?.message || 'Erro' });
    }
  };

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`p-3 rounded-lg text-sm ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form action={handleSaveProduct} className="bg-white rounded-xl border border-app-border p-4 space-y-3 max-w-2xl">
        <h2 className="font-semibold text-ink">Dados básicos</h2>
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="slug" value={product.slug} />
        <Field label="Nome" name="name" defaultValue={product.name} required />
        <Field label="Descrição" name="description" defaultValue={product.description || ''} textarea />
        <Field label="Preço base (R$)" name="base_price" type="number" step="0.01" defaultValue={String(product.base_price)} required />
        <Field label="Selo" name="badge" defaultValue={product.badge || ''} />
        <Field label="SKU" name="sku" defaultValue={product.sku || ''} />
        <div className="flex flex-wrap gap-4 pt-1">
          <Checkbox label="Ativo" name="active" defaultChecked={product.active} />
          <Checkbox label="Disponível" name="available" defaultChecked={product.available} />
          <Checkbox label="Destaque" name="featured" defaultChecked={product.featured} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={isPending} className="btn-primary disabled:opacity-50">
            {isPending ? 'Salvando...' : 'Salvar dados'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            📢 Publicar agora
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-app-border p-4 max-w-2xl">
        <h2 className="font-semibold text-ink mb-3">Imagem de capa</h2>
        <ProductImageUploader
          value={coverPath}
          onChange={handleImageChange}
          productId={product.id}
        />
      </div>

      <div className="bg-white rounded-xl border border-app-border p-4 max-w-2xl">
        <h2 className="font-semibold text-ink mb-2">Seções</h2>
        <p className="text-xs text-ink-muted mb-3">Selecione em quais seções o produto aparece</p>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {allSections.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sectionIds.includes(s.id)}
                onChange={(e) => setSectionIds((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))}
                className="accent-brand"
              />
              {s.name}
            </label>
          ))}
        </div>
        <button type="button" onClick={handleSaveSections} disabled={isPending} className="mt-3 btn-primary text-sm disabled:opacity-50">
          Salvar seções
        </button>
      </div>

      <div className="bg-white rounded-xl border border-app-border p-4 max-w-2xl">
        <h2 className="font-semibold text-ink mb-2">Grupos de adicionais</h2>
        <p className="text-xs text-ink-muted mb-3">Ex: Ponto da carne, Adicionais, Remover</p>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {allGroups.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={groupIds.includes(g.id)}
                onChange={(e) => setGroupIds((prev) => e.target.checked ? [...prev, g.id] : prev.filter((x) => x !== g.id))}
                className="accent-brand"
              />
              {g.name}
            </label>
          ))}
        </div>
        <button type="button" onClick={handleSaveGroups} disabled={isPending} className="mt-3 btn-primary text-sm disabled:opacity-50">
          Salvar grupos
        </button>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, type = 'text', required, textarea, step }: {
  label: string; name: string; defaultValue?: string; type?: string; required?: boolean; textarea?: boolean; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} required={required} rows={3} className="w-full p-2 border border-app-border rounded-lg text-sm" />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} required={required} step={step} className="w-full p-2 border border-app-border rounded-lg text-sm" />
      )}
    </div>
  );
}

function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-brand" />
      {label}
    </label>
  );
}
