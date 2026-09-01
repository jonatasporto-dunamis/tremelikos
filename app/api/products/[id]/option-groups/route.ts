import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('product_option_groups')
    .select(`
      position,
      option_groups (
        id, name, min_choices, max_choices, required,
        options ( id, name, price_delta, available, position )
      )
    `)
    .eq('product_id', params.id)
    .order('position');

  if (error) {
    return NextResponse.json({ groups: [] }, { status: 200 });
  }

  const groups = (data || [])
    .map((row: any) => row.option_groups)
    .filter(Boolean)
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      min_choices: g.min_choices,
      max_choices: g.max_choices,
      required: g.required,
      options: (g.options || [])
        .filter((o: any) => o.available)
        .sort((a: any, b: any) => a.position - b.position),
    }));

  return NextResponse.json({ groups });
}