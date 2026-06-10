import type { SiteConfig, User } from '@/lib/types';

function normalizeSiteId(siteId: string) {
  return siteId.trim().toLowerCase();
}

export function isSuperAdmin(user: User) {
  return user.role === 'super_admin';
}

export function canAccessSite(user: User, siteId: string) {
  const normalizedSiteId = normalizeSiteId(siteId);
  if (!normalizedSiteId) return false;
  if (isSuperAdmin(user)) return true;
  const uniqueSites = new Set(user.sites.map((entry) => normalizeSiteId(entry)));
  return uniqueSites.has(normalizedSiteId);
}

export function filterSitesForUser(sites: SiteConfig[], user: User) {
  if (isSuperAdmin(user)) return sites;
  const allowed = new Set(user.sites.map((entry) => normalizeSiteId(entry)));
  return sites.filter((site) => allowed.has(normalizeSiteId(site.id)));
}

export function requireRole(user: User, roles: User['role'][]) {
  if (!roles.includes(user.role)) {
    throw new Error('Forbidden');
  }
}

export function requireSiteAccess(user: User, siteId: string) {
  if (!canAccessSite(user, siteId)) {
    throw new Error('Forbidden');
  }
}

export function canWriteContent(user: User) {
  return ['super_admin', 'site_admin', 'editor'].includes(user.role);
}

export function canManageBookings(user: User) {
  return ['super_admin', 'site_admin'].includes(user.role);
}

export function canManageMedia(user: User) {
  return ['super_admin', 'site_admin', 'editor'].includes(user.role);
}
