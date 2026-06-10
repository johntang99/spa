import { RewriteStudio } from '@/components/admin/RewriteStudio';
import { getSession } from '@/lib/admin/auth';
import { filterSitesForUser } from '@/lib/admin/permissions';
import { getSites } from '@/lib/sites';
import { redirect } from 'next/navigation';

export default async function AdminRewriteStudioPage() {
  const session = await getSession();
  if (!session) {
    redirect('/admin/login');
  }

  const sites = await getSites();
  const visibleSites = filterSitesForUser(sites, session.user);

  if (visibleSites.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">
          No site access found for your account.
        </p>
      </div>
    );
  }

  return (
    <RewriteStudio
      sites={visibleSites.map((site) => ({
        id: site.id,
        name: site.name,
        supportedLocales: site.supportedLocales,
        defaultLocale: site.defaultLocale,
      }))}
    />
  );
}
