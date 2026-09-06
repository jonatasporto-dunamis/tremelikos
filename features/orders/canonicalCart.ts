import { supabaseAdmin } from '@/lib/supabase/server';
import type { CartItem } from '@/features/cart/CartContext';
import type { Product } from '@/types/database';

export interface OrderItemInput {
  id?: string;
  productId?: string;
  product?: Pick<Product, 'id'> & Partial<Product>;
  quantity: number;
  selectedOptionIds?: string[];
  extras?: Array<{ id?: string; name?: string; price?: number }>;
  removedIngredients?: string[];
  observations?: string;
}

interface OptionGroupRow {
  id: string;
  name: string;
  min_choices: number;
  max_choices: number;
  required: boolean;
  active: boolean;
}

interface ProductOptionGroupRow {
  product_id: string;
  option_group_id: string;
}

interface OptionRow {
  id: string;
  option_group_id: string;
  name: string;
  price_delta: number;
  available: boolean;
}

export interface CanonicalCartResult {
  items: CartItem[];
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) throw new Error('invalid_quantity');
  const normalized = Math.trunc(quantity);
  if (normalized < 1 || normalized > 99) throw new Error('invalid_quantity');
  return normalized;
}

function getProductId(item: OrderItemInput): string {
  const productId = item.productId || item.product?.id;
  if (!productId) throw new Error('product_id_required');
  return productId;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function loadCanonicalCartItems(params: {
  storeId: string;
  items: OrderItemInput[];
}): Promise<CanonicalCartResult> {
  if (!params.items.length) throw new Error('cart_empty');

  const productIds = unique(params.items.map(getProductId));

  const { data: products, error: productsErr } = await supabaseAdmin
    .from('products')
    .select('id, store_id, name, slug, description, base_price, active, available, featured, badge, sku, created_at, updated_at')
    .eq('store_id', params.storeId)
    .eq('active', true)
    .eq('available', true)
    .in('id', productIds);

  if (productsErr) throw new Error(`products: ${productsErr.message}`);

  const productsById = new Map((products || []).map((product: any) => [product.id, product as Product]));
  for (const productId of productIds) {
    if (!productsById.has(productId)) throw new Error(`product_unavailable:${productId}`);
  }

  const { data: productGroups, error: productGroupsErr } = await supabaseAdmin
    .from('product_option_groups')
    .select('product_id, option_group_id')
    .in('product_id', productIds);

  if (productGroupsErr) throw new Error(`product_option_groups: ${productGroupsErr.message}`);

  const links = (productGroups || []) as ProductOptionGroupRow[];
  const groupIds = unique(links.map((link) => link.option_group_id));

  let groups: OptionGroupRow[] = [];
  let options: OptionRow[] = [];

  if (groupIds.length > 0) {
    const [{ data: groupsData, error: groupsErr }, { data: optionsData, error: optionsErr }] = await Promise.all([
      supabaseAdmin
        .from('option_groups')
        .select('id, name, min_choices, max_choices, required, active')
        .eq('store_id', params.storeId)
        .eq('active', true)
        .in('id', groupIds),
      supabaseAdmin
        .from('options')
        .select('id, option_group_id, name, price_delta, available')
        .eq('available', true)
        .in('option_group_id', groupIds),
    ]);

    if (groupsErr) throw new Error(`option_groups: ${groupsErr.message}`);
    if (optionsErr) throw new Error(`options: ${optionsErr.message}`);
    groups = (groupsData || []) as OptionGroupRow[];
    options = (optionsData || []) as OptionRow[];
  }

  const activeGroupsById = new Map(groups.map((group) => [group.id, group]));
  const optionsById = new Map(options.map((option) => [option.id, option]));
  const groupIdsByProductId = new Map<string, Set<string>>();
  for (const link of links) {
    if (!activeGroupsById.has(link.option_group_id)) continue;
    const ids = groupIdsByProductId.get(link.product_id) || new Set<string>();
    ids.add(link.option_group_id);
    groupIdsByProductId.set(link.product_id, ids);
  }

  return {
    items: params.items.map((input, index) => {
      const productId = getProductId(input);
      const product = productsById.get(productId)!;
      const allowedGroupIds = groupIdsByProductId.get(productId) || new Set<string>();

      const selectedOptionIds = unique([
        ...(input.selectedOptionIds || []),
        ...((input.extras || []).map((extra) => extra.id).filter(Boolean) as string[]),
      ]);

      const selectedOptions: OptionRow[] = [];

      for (const optionId of selectedOptionIds) {
        const option = optionsById.get(optionId);
        if (!option || !allowedGroupIds.has(option.option_group_id)) {
          throw new Error(`invalid_option:${optionId}`);
        }
        selectedOptions.push(option);
      }

      for (const extra of input.extras || []) {
        if (extra.id || !extra.name) continue;
        const option = options.find(
          (candidate) =>
            allowedGroupIds.has(candidate.option_group_id) &&
            candidate.name.toLocaleLowerCase('pt-BR') === extra.name!.toLocaleLowerCase('pt-BR')
        );
        if (!option) throw new Error(`invalid_option:${extra.name}`);
        if (!selectedOptions.some((selected) => selected.id === option.id)) selectedOptions.push(option);
      }

      const groupsForProduct = Array.from(allowedGroupIds)
        .map((groupId) => activeGroupsById.get(groupId))
        .filter(Boolean) as OptionGroupRow[];

      for (const group of groupsForProduct) {
        const count = selectedOptions.filter((option) => option.option_group_id === group.id).length;
        const minimum = group.required ? Math.max(1, group.min_choices || 0) : group.min_choices || 0;
        if (count < minimum) throw new Error(`required_option_group:${group.id}`);
        if (group.max_choices > 0 && count > group.max_choices) throw new Error(`too_many_options:${group.id}`);
      }

      const removedFromOptions = selectedOptions
        .filter((option) => /remover|sem/i.test(activeGroupsById.get(option.option_group_id)?.name || ''))
        .map((option) => option.name);

      const extras = selectedOptions
        .filter((option) => !/remover|sem/i.test(activeGroupsById.get(option.option_group_id)?.name || ''))
        .map((option) => ({
          id: option.id,
          name: option.name,
          price: Number(option.price_delta || 0),
        }));

      return {
        id: input.id || `${product.id}-${index}`,
        product,
        quantity: normalizeQuantity(input.quantity),
        observations: input.observations,
        removedIngredients: unique([...(input.removedIngredients || []), ...removedFromOptions]),
        extras,
      };
    }),
  };
}
