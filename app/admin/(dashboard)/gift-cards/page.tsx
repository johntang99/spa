import { GiftCardsManager } from '@/components/admin/GiftCardsManager';
import { getSites } from '@/lib/sites';
import { getSession } from '@/lib/admin/auth';
import { filterSitesForUser } from '@/lib/admin/permissions';

export default async function AdminGiftCardsPage({
  searchParams,
}: {
  searchParams?: { siteId?: string; locale?: string };
}) {
  const session = await getSession();
  const sites = await getSites();
  const visibleSites = session ? filterSitesForUser(sites, session.user) : sites;
  const requestedSiteId = searchParams?.siteId || '';
  const selectedSite = visibleSites.find((site) => site.id === requestedSiteId) || visibleSites[0];
  const selectedSiteId = selectedSite?.id || '';
  const selectedLocale = searchParams?.locale || selectedSite?.defaultLocale || 'en';

  return (
    <GiftCardsManager
      sites={visibleSites}
      selectedSiteId={selectedSiteId}
      selectedLocale={selectedLocale}
    />
  );
}
