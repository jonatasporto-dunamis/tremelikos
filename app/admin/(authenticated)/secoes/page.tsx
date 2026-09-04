import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createSection } from '../actions';
import SectionsList from './SectionsList';

export const dynamic = 'force-dynamic';

export default async function AdminSecoesPage() {
  const [{ data: sections }, { data: counts }] = await Promise.all([
    supabaseAdmin.from('sections').select('*').order('position'),
    supabaseAdmin.from('section_products').select('section_id'),
  ]);

  const countMap = new Map<string, number>();
  for (const r of counts || []) {
    countMap.set(r.section_id, (countMap.get(r.section_id) || 0) + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-4">Seções</h1>

      <form action={createSection} className="bg-white border border-app-border rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          name="name"
          placeholder="Nome da seção"
          required
          className="p-2 border border-app-border rounded-lg text-sm md:col-span-2"
        />
        <input
          name="position"
          type="number"
          placeholder="Posição"
          defaultValue={(sections?.length || 0) + 1}
          className="p-2 border border-app-border rounded-lg text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked className="accent-brand" />
          Ativa
        </label>
        <input
          name="description"
          placeholder="Descrição (opcional)"
          className="p-2 border border-app-border rounded-lg text-sm md:col-span-3"
        />
        <button type="submit" className="btn-primary text-sm">+ Nova seção</button>
      </form>

      <SectionsList
        sections={(sections || []).map((s) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          active: s.active,
          productCount: countMap.get(s.id) || 0,
        }))}
      />

      <p className="text-xs text-ink-muted mt-3">
        <Link href="/" target="_blank" rel="noopener" className="hover:underline">
          👀 Ver ordem atual no cardápio ↗
        </Link>
      </p>
    </div>
  );
}
