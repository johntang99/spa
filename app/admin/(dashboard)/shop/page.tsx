import { getSites } from '@/lib/sites';
import { getSession } from '@/lib/admin/auth';
import { filterSitesForUser } from '@/lib/admin/permissions';
import { ShopManager } from '@/components/admin/ShopManager';

export default async function AdminShopPage({
  searchParams,
}: {
  searchParams?: { siteId?: string; locale?: string };
}) {
  const session = await getSession();
  const sites = await getSites();
  const visibleSites = session ? filterSitesForUser(sites, session.user) : sites;
  const requestedSiteId = searchParams?.siteId || '';
  const selectedSite = visibleSites.find((s) => s.id === requestedSiteId) || visibleSites[0];
  const selectedSiteId = selectedSite?.id || '';

  return (
    <ShopManager
      sites={visibleSites}
      selectedSiteId={selectedSiteId}
    />
  );
}
