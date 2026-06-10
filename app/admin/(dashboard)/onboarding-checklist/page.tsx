import { PrintChecklistButton } from '@/components/admin/PrintChecklistButton';

const templateReadiness = [
  'Template doctor name, title, quote, and bio are generic enough for cloning.',
  'Template contact info (phone, email, address, map) is safe to overwrite during onboarding.',
  'Template images (logo, hero, about bio photo) are either generic or expected to be overridden.',
  'Services and conditions content has valid structure for both en and zh.',
  'No template-specific compliance claims that should not be copied to all sites.',
  'Template passes visual sanity check: home, services, conditions, about, contact.',
];

const postOnboardingQa = [
  'Home hero title matches new location in en and zh.',
  'Testimonials mention the new doctor (not template doctor) in en and zh.',
  'CTA/contact phone number is correct in en and zh.',
  'About hero/title and profile details match intake values.',
  'About bio is split into 3-4 readable paragraphs in en and zh.',
  'Blog author names are updated to the new doctor in index and article files.',
  'Contact page phone/email/address/map link are correct in en and zh.',
  'Contact map directions text is location-specific, not template fallback text.',
  'Services and conditions are meaning-preserving rewrites (not template copy), in en and zh.',
  'Services long descriptions render as readable multi-paragraph content.',
  'O5B report has no critical risk items left unapplied (or reviewed/approved intentionally).',
  'Final site quick pass: home/about/services/conditions/contact in both locales.',
];

const operationalChecks = [
  'If warnings exist, review Rewrite Studio and regenerate selected risky/weak items.',
  'If media overrides were uploaded, confirm logo + hero + about image display correctly.',
  'Export DB content to local only when local files are needed for offline/dev workflows.',
  'Record onboarding run ID/site ID and QA sign-off owner/date for traceability.',
];

function ChecklistSection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: string[];
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      <ul className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex items-start gap-3 text-sm text-gray-800">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border border-gray-400 text-[11px] font-semibold text-gray-500">
              □
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OnboardingChecklistPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
      <header className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Template Readiness + Post-Onboarding QA Checklist</h1>
            <p className="mt-2 text-sm text-gray-600">
              Use this checklist before selecting a template and after each onboarding run. Designed for quick print-and-sign workflows.
            </p>
          </div>
          <PrintChecklistButton />
        </div>
      </header>

      <ChecklistSection
        title="A) Template Readiness"
        subtitle="Complete before using a site as the base template for duplication."
        items={templateReadiness}
      />

      <ChecklistSection
        title="B) Post-Onboarding QA (Required)"
        subtitle="Complete immediately after onboarding for both locales (en + zh)."
        items={postOnboardingQa}
      />

      <ChecklistSection
        title="C) Operational Follow-Up"
        subtitle="Use when warnings exist or when handing off to another reviewer."
        items={operationalChecks}
      />

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Sign-off</h2>
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div className="rounded border border-gray-200 p-3">Site ID: ________________________</div>
          <div className="rounded border border-gray-200 p-3">Template: _____________________</div>
          <div className="rounded border border-gray-200 p-3">Reviewer: _____________________</div>
          <div className="rounded border border-gray-200 p-3">Date: _________________________</div>
        </div>
      </section>
    </div>
  );
}
