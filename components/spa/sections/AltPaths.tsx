// S20 altPaths — alternative ways to book: call/text, WeChat (auto on zh), external
// scheduler (only when site_settings.externalBookingUrl is set).
import type { SectionCtx } from './index';

export default function AltPaths({ data, ctx }: { data: any; ctx: SectionCtx }) {
  const si = ctx.siteInfo || {};
  const tr = (en: string, zh: string) => (ctx.locale === 'zh' ? zh : en);
  const showWechat = data.showWechat ?? (ctx.locale === 'zh' && !!si.wechatId);
  const showExternal = data.showExternal ?? !!si.externalBookingUrl;
  const phoneHref = `tel:${(si.phone || '').replace(/[^0-9]/g, '')}`;

  return (
    <section className={`section on-${ctx.mode || 'light'}`}>
      <div className="container" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.showCall !== false && (
          <a className="btn btn-outline" href={phoneHref}>{tr('Call or text', '致电或短信')} {si.phone}</a>
        )}
        {showWechat && <a className="btn btn-outline" href="#wechat">{tr('WeChat', '微信预约')}</a>}
        {showExternal && si.externalBookingUrl && (
          <a className="btn btn-outline" href={si.externalBookingUrl} target="_blank" rel="noopener noreferrer">
            {tr('Book on our scheduler', '前往预约系统')}
          </a>
        )}
      </div>
    </section>
  );
}
