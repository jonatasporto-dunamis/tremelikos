import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createSection, updateSection, softDeleteSection } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminSecoesPage() {
  const { data: sections } = await supabaseAdmin
    .from('sections')
    .select('*')
    .order('position');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Seções</h1>

      <form action={createSection} className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          name="name"
          placeholder="Nome da seção"
          required
          className="p-2 border border-gray-200 rounded-lg text-sm md:col-span-2"
        />
        <input
          name="position"
          type="number"
          placeholder="Posição"
          defaultValue={(sections?.length || 0) + 1}
          className="p-2 border border-gray-200 rounded-lg text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked className="accent-brand" />
          Ativa
        </label>
        <input
          name="description"
          placeholder="Descrição (opcional)"
          className="p-2 border border-gray-200 rounded-lg text-sm md:col-span-3"
        />
        <button type="submit" className="btn-primary text-sm">+ Nova seção</button>
      </form>

      <div className="space-y-2">
        {sections?.map((section) => (
          <form
            key={section.id}
            action={updateSection}
            className="bg-white rounded-xl border border-gray-100 p-3 flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="id" value={section.id} />
            <span className="text-xs text-gray-400 w-8">#{section.position}</span>
            <input
              name="name"
              defaultValue={section.name}
              className="p-2 border border-gray-200 rounded-lg text-sm flex-1 min-w-[200px]"
            />
            <input
              name="position"
              type="number"
              defaultValue={section.position}
              className="p-2 border border-gray-200 rounded-lg text-sm w-20"
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={section.active}
                className="accent-brand"
              />
              Ativa
            </label>
            <button type="submit" className="text-sm text-brand-text hover:underline">Salvar</button>
            <Link
              href={`#produtos-${section.id}`}
              className="text-sm text-gray-500 hover:underline"
            >
              Ver produtos
            </Link>
            <DeleteButton id={section.id} />
          </form>
        ))}
      </div>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={async () => { 'use server'; await softDeleteSection(id); }}>
      <button type="submit" className="text-sm text-red-500 hover:text-red-700">
        Excluir
      </button>
    </form>
  );
}