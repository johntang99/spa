// System S catalog helpers — single price source. All prices/counts derive from the
// services catalog (content/<site>/<locale>/collections/services.json), never duplicated.

export interface Tier { minutes: number; price: number }
export interface Service {
  id: string; categoryId: string; name: string; slug: string; short: string;
  image?: string; tiers: Tier[]; badge?: string | null; goalTags?: string[];
  intensity?: number; enabled: boolean; order: number;
}
export interface Category { id: string; name: string; intro?: string; image?: string; order: number }
export interface Catalog { categories: Category[]; services: Service[]; addons: Array<{ id: string; name: string; price: number; appliesTo: any }> }

export const fmtPrice = (n: number) => `$${n}`;

/** Enabled services in a category, ordered. */
export function servicesInCategory(catalog: Catalog, categoryId: string): Service[] {
  return (catalog.services || [])
    .filter((s) => s.enabled && s.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);
}

export function serviceCount(catalog: Catalog, categoryId: string): number {
  return servicesInCategory(catalog, categoryId).length;
}

/** Lowest tier price across a category's enabled services. */
export function priceFrom(catalog: Catalog, categoryId: string): number | null {
  const prices = servicesInCategory(catalog, categoryId).flatMap((s) => s.tiers.map((t) => t.price));
  return prices.length ? Math.min(...prices) : null;
}

export function getService(catalog: Catalog, id: string): Service | undefined {
  return (catalog.services || []).find((s) => s.id === id && s.enabled);
}

/** Book deep-link with service + duration prefill. */
export function bookHref(locale: string, serviceId?: string, minutes?: number): string {
  const params = new URLSearchParams();
  if (serviceId) params.set('service', serviceId);
  if (minutes) params.set('duration', String(minutes));
  const qs = params.toString();
  return `/${locale}/book${qs ? `?${qs}` : ''}`;
}

/** Resolve a serviceCards `source` block to a list of services. */
export function resolveServiceSource(
  catalog: Catalog,
  source: { mode: 'refs' | 'category' | 'tag'; refs?: string[]; category?: string; tag?: string; limit?: number }
): Service[] {
  let list: Service[] = [];
  const enabled = (catalog.services || []).filter((s) => s.enabled);
  if (source.mode === 'refs') list = (source.refs || []).map((id) => enabled.find((s) => s.id === id)).filter(Boolean) as Service[];
  else if (source.mode === 'category') list = enabled.filter((s) => s.categoryId === source.category);
  else if (source.mode === 'tag') list = enabled.filter((s) => s.badge === source.tag || (s.goalTags || []).includes(source.tag!));
  list = list.sort((a, b) => a.order - b.order);
  return source.limit ? list.slice(0, source.limit) : list;
}
