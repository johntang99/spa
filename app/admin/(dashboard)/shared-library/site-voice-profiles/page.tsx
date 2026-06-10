import { SharedLibraryEditor } from '@/components/admin/SharedLibraryEditor';
import { getSession } from '@/lib/admin/auth';
import {
  canWriteContent,
  filterSitesForUser,
  isSuperAdmin,
} from '@/lib/admin/permissions';
import { getSites } from '@/lib/sites';
import { redirect } from 'next/navigation';

export default async function AdminSiteVoiceProfilesPage({
  searchParams,
}: {
  searchParams?: { siteId?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  const sites = await getSites();
  const visibleSites = filterSitesForUser(sites, session.user);
  const requestedSiteId = searchParams?.siteId || '';
  const selectedSite =
    visibleSites.find((site) => site.id === requestedSiteId) || visibleSites[0];

  return (
    <SharedLibraryEditor
      mode="profiles"
      sites={visibleSites.map((site) => ({ id: site.id, name: site.name }))}
      initialSiteId={selectedSite?.id || ''}
      canWrite={canWriteContent(session.user)}
      isSuperAdmin={isSuperAdmin(session.user)}
    />
  );
}
