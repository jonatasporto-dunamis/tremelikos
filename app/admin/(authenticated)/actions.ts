'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerAuthClient } from '@/lib/supabase/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await getServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');
  const { data: profile } = await supabaseAdmin
    .from('admin_profiles')
    .select('role, active, store_id')
    .eq('user_id', user.id)
    .single();
  if (!profile || !profile.active) throw new Error('Sem permissão');
  return { user, profile };
}

async function logAudit(
  userId: string,
  storeId: string,
  action: string,
  entity: string,
  entityId: string,
  payload: Record<string, unknown>
) {
  await supabaseAdmin.from('audit_logs').insert({
    store_id: storeId,
    actor_id: userId,
    action,
    entity,
    entity_id: entityId,
    payload,
  });
}

// =================== STORES ===================
export async function updateStore(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const id = String(formData.get('id'));
  const payload = {
    name: String(formData.get('name') || ''),
    description: String(formData.get('description') || ''),
    phone: String(formData.get('phone') || ''),
    whatsapp: String(formData.get('whatsapp') || ''),
    address: String(formData.get('address') || ''),
    city: String(formData.get('city') || ''),
    state: String(formData.get('state') || ''),
    zip_code: String(formData.get('zip_code') || ''),
    minimum_order: Number(formData.get('minimum_order') || 0),
  };
  const { error } = await supabaseAdmin
    .from('stores')
    .update(payload)
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'update', 'store', id, payload);
  revalidatePath('/');
  revalidatePath('/admin/configuracoes');
}

// =================== BUSINESS HOURS ===================
export async function updateBusinessHours(entries: Array<{ weekday: number; opens_at: string | null; closes_at: string | null; closed: boolean }>) {
  const { user, profile } = await requireAdmin();
  for (const entry of entries) {
    const { error } = await supabaseAdmin
      .from('business_hours')
      .upsert(
        {
          store_id: profile.store_id,
          weekday: entry.weekday,
          opens_at: entry.opens_at,
          closes_at: entry.closes_at,
          closed: entry.closed,
        },
        { onConflict: 'store_id,weekday' }
      );
    if (error) throw new Error(error.message);
  }
  await logAudit(user.id, profile.store_id, 'update', 'business_hours', profile.store_id, { entries });
  revalidatePath('/');
}

// =================== PRODUCTS ===================
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createProduct(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('Nome obrigatório');
  const base_price = Number(formData.get('base_price') || 0);
  const payload = {
    store_id: profile.store_id,
    name,
    slug: slugify(name),
    description: String(formData.get('description') || ''),
    base_price,
    active: formData.get('active') === 'on',
    available: formData.get('available') === 'on',
    featured: formData.get('featured') === 'on',
    badge: String(formData.get('badge') || '') || null,
  };
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'create', 'product', data.id, payload);
  revalidatePath('/admin/produtos');
  revalidatePath('/');
  redirect('/admin/produtos');
}

export async function updateProduct(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const id = String(formData.get('id'));
  const payload = {
    name: String(formData.get('name') || '').trim(),
    description: String(formData.get('description') || ''),
    base_price: Number(formData.get('base_price') || 0),
    active: formData.get('active') === 'on',
    available: formData.get('available') === 'on',
    featured: formData.get('featured') === 'on',
    badge: String(formData.get('badge') || '') || null,
  };
  const { error } = await supabaseAdmin
    .from('products')
    .update(payload)
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'update', 'product', id, payload);
  revalidatePath('/admin/produtos');
  revalidatePath('/');
  revalidatePath(`/produto/${formData.get('slug') || ''}`);
}

export async function toggleProductAvailable(id: string, available: boolean) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('products')
    .update({ available })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'toggle_available', 'product', id, { available });
  revalidatePath('/admin/produtos');
  revalidatePath('/');
}

export async function toggleProductFeatured(id: string, featured: boolean) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('products')
    .update({ featured })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'toggle_featured', 'product', id, { featured });
  revalidatePath('/admin/produtos');
  revalidatePath('/');
}

export async function softDeleteProduct(id: string) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('products')
    .update({ active: false, available: false })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'delete', 'product', id, {});
  revalidatePath('/admin/produtos');
  revalidatePath('/');
}

/** 10.3.4 — publica produto, atualiza updated_at e invalida cache da home e do detail */
export async function publishProduct(id: string) {
  const { user, profile } = await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('slug, store_id')
    .single();
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'publish', 'product', id, {});
  revalidatePath('/admin/produtos');
  revalidatePath('/');
  if (data?.slug) {
    revalidatePath(`/produto/${data.slug}`);
  }
  return data;
}


// =================== SECTIONS ===================
export async function createSection(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('Nome obrigatório');
  const { data, error } = await supabaseAdmin
    .from('sections')
    .insert({
      store_id: profile.store_id,
      name,
      slug: slugify(name),
      description: String(formData.get('description') || ''),
      position: Number(formData.get('position') || 0),
      active: formData.get('active') === 'on',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'create', 'section', data.id, { name });
  revalidatePath('/admin/secoes');
  revalidatePath('/');
  redirect('/admin/secoes');
}

export async function updateSection(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const id = String(formData.get('id'));
  const { error } = await supabaseAdmin
    .from('sections')
    .update({
      name: String(formData.get('name') || ''),
      description: String(formData.get('description') || ''),
      position: Number(formData.get('position') || 0),
      active: formData.get('active') === 'on',
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'update', 'section', id, {});
  revalidatePath('/admin/secoes');
  revalidatePath('/');
}

export async function reorderSections(orderedIds: string[]) {
  const { user, profile } = await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    await supabaseAdmin
      .from('sections')
      .update({ position: i })
      .eq('id', orderedIds[i]);
  }
  await logAudit(user.id, profile.store_id, 'reorder', 'section', profile.store_id, { orderedIds });
  revalidatePath('/admin/secoes');
  revalidatePath('/');
}

export async function setProductSections(productId: string, sectionIds: string[]) {
  const { user, profile } = await requireAdmin();
  await supabaseAdmin.from('section_products').delete().eq('product_id', productId);
  if (sectionIds.length > 0) {
    const rows = sectionIds.map((sid, idx) => ({
      section_id: sid,
      product_id: productId,
      position: idx,
    }));
    const { error } = await supabaseAdmin.from('section_products').insert(rows);
    if (error) throw new Error(error.message);
  }
  await logAudit(user.id, profile.store_id, 'set_sections', 'product', productId, { sectionIds });
  revalidatePath('/admin/produtos');
  revalidatePath('/');
}

export async function softDeleteSection(id: string) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('sections')
    .update({ active: false })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'delete', 'section', id, {});
  revalidatePath('/admin/secoes');
  revalidatePath('/');
}

export interface BulkUpdatePayload {
  productIds: string[];
  /** se definido, sobrescreve o preço base */
  setPrice?: number | null;
  /** se definido, aplica ajuste percentual (ex.: 10 = +10%, -5 = -5%) */
  priceAdjustPercent?: number | null;
  /** se definido, aplica ajuste fixo em reais (ex.: 1.50) */
  priceAdjustFixed?: number | null;
  /** se true, arredonda para .00/.50/.90 (padrão cardápio) */
  roundPrice?: boolean;
  /** se definido, muda disponibilidade (true/false) */
  setAvailable?: boolean | null;
  /** se definido, adiciona/remove produto da(s) seção(ões) */
  setSectionIds?: string[] | null;
  /** estratégia para setSectionIds: 'replace' remove vínculos antigos, 'add' adiciona */
  sectionMode?: 'replace' | 'add' | 'remove';
}

function roundToNicePrice(price: number): number {
  if (price < 0) return 0;
  const cents = Math.round(price * 100);
  const last = cents % 100;
  if (last < 25) return Math.floor(cents / 100);
  if (last < 75) return (Math.floor(cents / 100) + 0.5);
  return Math.ceil(cents / 100);
}

export async function bulkUpdateProducts(payload: BulkUpdatePayload): Promise<{
  updated: number;
  sectionsUpdated: number;
  errors: string[];
}> {
  const { user, profile } = await requireAdmin();
  if (!payload.productIds || payload.productIds.length === 0) {
    throw new Error('Nenhum produto selecionado');
  }
  const errors: string[] = [];
  let updated = 0;
  let sectionsUpdated = 0;

  // 1) preço
  const touchesPrice =
    payload.setPrice !== undefined && payload.setPrice !== null
      ? 'set'
      : payload.priceAdjustPercent !== undefined && payload.priceAdjustPercent !== null
        ? 'pct'
        : payload.priceAdjustFixed !== undefined && payload.priceAdjustFixed !== null
          ? 'fix'
          : null;

  if (touchesPrice) {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, base_price, name')
      .in('id', payload.productIds);
    for (const p of products || []) {
      let newPrice = p.base_price;
      if (touchesPrice === 'set') newPrice = Number(payload.setPrice);
      else if (touchesPrice === 'pct')
        newPrice = p.base_price * (1 + Number(payload.priceAdjustPercent) / 100);
      else if (touchesPrice === 'fix')
        newPrice = p.base_price + Number(payload.priceAdjustFixed);
      if (payload.roundPrice) newPrice = roundToNicePrice(newPrice);
      newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
      const { error } = await supabaseAdmin
        .from('products')
        .update({ base_price: newPrice })
        .eq('id', p.id);
      if (error) errors.push(`${p.name}: ${error.message}`);
      else {
        updated++;
        await logAudit(user.id, profile.store_id, 'bulk_price', 'product', p.id, {
          from: p.base_price,
          to: newPrice,
        });
      }
    }
  }

  // 2) disponibilidade
  if (payload.setAvailable !== undefined && payload.setAvailable !== null) {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ available: payload.setAvailable })
      .in('id', payload.productIds);
    if (error) errors.push(`Disponibilidade: ${error.message}`);
    else {
      updated += payload.productIds.length;
      await logAudit(
        user.id,
        profile.store_id,
        'bulk_available',
        'product',
        '',
        { productIds: payload.productIds, available: payload.setAvailable }
      );
    }
  }

  // 3) seção
  if (payload.setSectionIds && payload.setSectionIds.length > 0 && payload.sectionMode) {
    for (const productId of payload.productIds) {
      if (payload.sectionMode === 'replace') {
        await supabaseAdmin.from('section_products').delete().eq('product_id', productId);
      }
      if (payload.sectionMode === 'replace' || payload.sectionMode === 'add') {
        // pula os que já têm vínculo se for 'add'
        let toInsert = payload.setSectionIds;
        if (payload.sectionMode === 'add') {
          const { data: existing } = await supabaseAdmin
            .from('section_products')
            .select('section_id')
            .eq('product_id', productId);
          const existingIds = new Set((existing || []).map((r) => r.section_id));
          toInsert = toInsert.filter((sid) => !existingIds.has(sid));
        }
        if (toInsert.length > 0) {
          const rows = toInsert.map((sid, idx) => ({
            product_id: productId,
            section_id: sid,
            position: idx,
          }));
          const { error } = await supabaseAdmin.from('section_products').insert(rows);
          if (error) errors.push(`Seção do produto ${productId}: ${error.message}`);
          else sectionsUpdated++;
        }
      } else if (payload.sectionMode === 'remove') {
        const { error } = await supabaseAdmin
          .from('section_products')
          .delete()
          .eq('product_id', productId)
          .in('section_id', payload.setSectionIds);
        if (error) errors.push(`Remover seção de ${productId}: ${error.message}`);
        else sectionsUpdated++;
      }
    }
    await logAudit(
      user.id,
      profile.store_id,
      'bulk_sections',
      'product',
      '',
      {
        productIds: payload.productIds,
        sectionIds: payload.setSectionIds,
        mode: payload.sectionMode,
      }
    );
  }

  revalidatePath('/admin/produtos');
  revalidatePath('/admin/produtos/edicao-em-massa');
  revalidatePath('/');
  return { updated, sectionsUpdated, errors };
}

// =================== OPTION GROUPS ===================
export async function createOptionGroup(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('Nome obrigatório');
  const { data, error } = await supabaseAdmin
    .from('option_groups')
    .insert({
      store_id: profile.store_id,
      name,
      min_choices: Number(formData.get('min_choices') || 0),
      max_choices: Number(formData.get('max_choices') || 1),
      required: formData.get('required') === 'on',
      active: true,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'create', 'option_group', data.id, { name });
  revalidatePath('/admin/opcoes');
}

export async function createOption(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const option_group_id = String(formData.get('option_group_id'));
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('Nome obrigatório');
  const { data, error } = await supabaseAdmin
    .from('options')
    .insert({
      option_group_id,
      name,
      price_delta: Number(formData.get('price_delta') || 0),
      available: formData.get('available') === 'on',
      position: Number(formData.get('position') || 0),
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'create', 'option', data.id, { option_group_id, name });
  revalidatePath('/admin/opcoes');
}

export async function setProductOptionGroups(productId: string, groupIds: string[]) {
  const { user, profile } = await requireAdmin();
  await supabaseAdmin.from('product_option_groups').delete().eq('product_id', productId);
  if (groupIds.length > 0) {
    const rows = groupIds.map((gid, idx) => ({
      product_id: productId,
      option_group_id: gid,
      position: idx,
    }));
    const { error } = await supabaseAdmin.from('product_option_groups').insert(rows);
    if (error) throw new Error(error.message);
  }
  await logAudit(user.id, profile.store_id, 'set_option_groups', 'product', productId, { groupIds });
  revalidatePath('/admin/produtos');
}

// =================== PROMOTIONS ===================
export async function createPromotion(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  const type = String(formData.get('type')) as 'fixed_percent' | 'fixed_amount' | 'product_price';
  const value = Number(formData.get('value') || 0);
  const starts_at = String(formData.get('starts_at') || '') || null;
  const ends_at = String(formData.get('ends_at') || '') || null;
  const weekdaysRaw = String(formData.get('weekdays') || '');
  const weekdays = weekdaysRaw
    ? weekdaysRaw.split(',').map((s) => Number(s)).filter((n) => !isNaN(n))
    : [];
  const priority = Number(formData.get('priority') || 0);
  const productIds = (formData.getAll('product_ids') as string[]).filter(Boolean);

  const { data, error } = await supabaseAdmin
    .from('promotions')
    .insert({
      store_id: profile.store_id,
      name,
      type,
      value,
      starts_at,
      ends_at,
      weekdays,
      priority,
      active: formData.get('active') === 'on',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  if (productIds.length > 0) {
    const { error: linkErr } = await supabaseAdmin
      .from('promotion_products')
      .insert(productIds.map((pid) => ({ promotion_id: data.id, product_id: pid })));
    if (linkErr) throw new Error(linkErr.message);
  }

  await logAudit(user.id, profile.store_id, 'create', 'promotion', data.id, { name, type, value });
  revalidatePath('/admin/promocoes');
  revalidatePath('/api/promotions');
  revalidatePath('/');
  redirect('/admin/promocoes');
}

export async function togglePromotionActive(id: string, active: boolean) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('promotions')
    .update({ active })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'toggle_active', 'promotion', id, { active });
  revalidatePath('/admin/promocoes');
  revalidatePath('/api/promotions');
  revalidatePath('/');
}

// =================== COUPONS ===================
export async function createCoupon(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const code = String(formData.get('code') || '').trim().toUpperCase();
  if (!code) throw new Error('Código obrigatório');
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert({
      store_id: profile.store_id,
      code,
      type: String(formData.get('type')) as 'fixed_percent' | 'fixed_amount',
      value: Number(formData.get('value') || 0),
      minimum_order: Number(formData.get('minimum_order') || 0),
      starts_at: String(formData.get('starts_at') || '') || null,
      ends_at: String(formData.get('ends_at') || '') || null,
      max_uses: formData.get('max_uses') ? Number(formData.get('max_uses')) : null,
      active: formData.get('active') === 'on',
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'create', 'coupon', data.id, { code });
  revalidatePath('/admin/cupons');
  redirect('/admin/cupons');
}

export async function toggleCouponActive(id: string, active: boolean) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin
    .from('coupons')
    .update({ active })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'toggle_active', 'coupon', id, { active });
  revalidatePath('/admin/cupons');
}

// =================== STORE OVERRIDES (11.6.2) ===================

export async function createStoreOverride(formData: FormData) {
  const { user, profile } = await requireAdmin();
  const date = String(formData.get('date') || '');
  const status = String(formData.get('status') || 'closed');
  const opens_at = String(formData.get('opens_at') || '') || null;
  const closes_at = String(formData.get('closes_at') || '') || null;
  const reason = String(formData.get('reason') || '') || null;
  if (!date) throw new Error('Data é obrigatória');
  const { error } = await supabaseAdmin.from('store_overrides').upsert(
    { store_id: profile.store_id, date, status, opens_at, closes_at, reason },
    { onConflict: 'store_id,date' }
  );
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'create', 'store_override', '', { date, status });
  revalidatePath('/admin/configuracoes/loja');
  revalidatePath('/');
}

export async function deleteStoreOverride(id: string) {
  const { user, profile } = await requireAdmin();
  const { error } = await supabaseAdmin.from('store_overrides').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit(user.id, profile.store_id, 'delete', 'store_override', id, {});
  revalidatePath('/admin/configuracoes/loja');
  revalidatePath('/');
}