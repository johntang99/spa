// S26 reviewedBy — E-E-A-T credit line on resource pages. Resolves a team member's
// credential from the team collection.
import type { SectionCtx } from './index';

export default function ReviewedBy({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const member = (ctx.team || []).find((m: any) => m.id === data.teamRef) || (ctx.team || [])[0];
  if (!member) return null;
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);
  return (
    <section className={`section on-${ctx.mode || 'light'}`} style={{ paddingTop: 0 }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <p className="small reveal" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 16, color: 'var(--text-secondary)' }}>
          {tr('Reviewed by', '审阅')} <strong>{member.name}</strong>, {member.credential}
          {data.dateReviewed ? ` · ${tr('Reviewed', '审阅日期')} ${data.dateReviewed}` : ''}
        </p>
      </div>
    </section>
  );
}
