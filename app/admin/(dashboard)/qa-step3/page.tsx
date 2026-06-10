import { Step3AgentRunner } from '@/components/admin/Step3AgentRunner';
import { getSession } from '@/lib/admin/auth';
import { isSuperAdmin } from '@/lib/admin/permissions';
import { getSites } from '@/lib/sites';

export default async function AdminStep3QaPage() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.user)) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">You do not have access to Step 3 QA.</p>
      </div>
    );
  }

  const sites = await getSites();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Step 3 QA Runner</h1>
        <p className="text-sm text-gray-600">
          Run `scripts/step3-agent.mjs` from admin and review the generated report output.
        </p>
      </div>
      <Step3AgentRunner
        sites={sites.map((site) => ({ id: site.id, name: site.name, enabled: site.enabled }))}
      />
    </div>
  );
}
