# Acu-Flushing Chinese SEO Launch Report & GSC Guide

> **Site:** acu-flushing (Flushing Acupuncture & TCM)
> **Domain:** acuflushing.com (or configured production domain)
> **Date:** April 2026
> **Scope:** Chinese-character SEO pages launch, redirect verification, GSC setup

---

## 1. What Was Deployed

### 9 New Chinese-Character SEO Pages

| URL Slug | Page Type | Target Keyword |
|---|---|---|
| `/zh/法拉盛中医针灸` | seo-local-landing | 法拉盛中医针灸 |
| `/zh/法拉盛针灸治腰痛` | seo-condition | 法拉盛针灸治腰痛 |
| `/zh/法拉盛失眠针灸` | seo-condition | 法拉盛失眠针灸 |
| `/zh/法拉盛针灸治焦虑` | seo-condition | 法拉盛针灸治焦虑 |
| `/zh/法拉盛中药` | seo-service | 法拉盛中药 |
| `/zh/法拉盛拔罐` | seo-service | 法拉盛拔罐 |
| `/zh/法拉盛艾灸` | seo-service | 法拉盛艾灸 |
| `/zh/法拉盛推拿` | seo-service | 法拉盛推拿 |
| `/zh/法拉盛针灸费用` | seo-resource | 法拉盛针灸费用 |

### 9 Permanent Redirects (308)

| Old URL | New URL |
|---|---|
| `/zh/acupuncture-flushing-ny` | `/zh/法拉盛中医针灸` |
| `/zh/acupuncture-for-back-pain-flushing-ny` | `/zh/法拉盛针灸治腰痛` |
| `/zh/acupuncture-for-insomnia-flushing-ny` | `/zh/法拉盛失眠针灸` |
| `/zh/acupuncture-for-anxiety-flushing-ny` | `/zh/法拉盛针灸治焦虑` |
| `/zh/chinese-herbal-medicine-flushing-ny` | `/zh/法拉盛中药` |
| `/zh/cupping-therapy-flushing-ny` | `/zh/法拉盛拔罐` |
| `/zh/moxibustion-flushing-ny` | `/zh/法拉盛艾灸` |
| `/zh/tui-na-massage-flushing-ny` | `/zh/法拉盛推拿` |
| `/zh/acupuncture-cost-flushing-ny` | `/zh/法拉盛针灸费用` |

### Other Changes
- `seo.json` (zh) — all page metadata translated to Chinese
- Homepage "Why Choose Us" section translated to Chinese
- hreflang tags pairing English ↔ Chinese SEO pages
- Sitemap updated with Chinese URLs, old redirected URLs excluded

---

## 2. Google Search Console (GSC) — Step-by-Step

### 2.1 Verify Site Ownership (if not already done)

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **URL prefix**: `https://www.acupunctureflushing.com` (your production domain)
4. Verify via one of:
   - **HTML tag** — add `<meta name="google-site-verification" content="...">` to layout
   - **DNS record** — add TXT record to domain
   - **Google Analytics** — if already connected

### 2.2 Submit Updated Sitemap

1. In GSC, go to **Sitemaps** (left sidebar)
2. Enter: `sitemap.xml`
3. Click **Submit**
4. Wait for Google to process (usually 1-2 days)
5. Verify the status shows "Success" and the URL count includes the new Chinese pages

### 2.3 Request Indexing for New Chinese Pages

Google will discover pages via sitemap, but you can speed it up:

1. In GSC, go to **URL Inspection** (top search bar)
2. Enter each new Chinese URL one by one:
   ```
   https://www.acupunctureflushing.com/zh/法拉盛中医针灸
   https://www.acupunctureflushing.com/zh/法拉盛针灸治腰痛
   https://www.acupunctureflushing.com/zh/法拉盛失眠针灸
   https://www.acupunctureflushing.com/zh/法拉盛针灸治焦虑
   https://www.acupunctureflushing.com/zh/法拉盛中药
   https://www.acupunctureflushing.com/zh/法拉盛拔罐
   https://www.acupunctureflushing.com/zh/法拉盛艾灸
   https://www.acupunctureflushing.com/zh/法拉盛推拿
   https://www.acupunctureflushing.com/zh/法拉盛针灸费用
   ```
3. For each URL, click **Request Indexing**
4. Google allows ~10 requests per day — do the core landing page first

**Priority order for indexing requests:**
1. `法拉盛中医针灸` (core landing — highest value)
2. `法拉盛针灸治腰痛` (back pain — high search volume)
3. `法拉盛失眠针灸` (insomnia — high search volume)
4. `法拉盛针灸治焦虑` (anxiety)
5. `法拉盛针灸费用` (cost — commercial intent)
6. Remaining service pages

### 2.4 Verify Redirects in GSC

1. Go to **URL Inspection**
2. Enter an old URL: `https://www.acupunctureflushing.com/zh/acupuncture-flushing-ny`
3. GSC should show:
   - "URL is not on Google" (if not yet crawled) or
   - "Page with redirect" with the redirect target
4. If Google still shows the old URL as indexed, it will automatically transfer to the new URL over the next crawl cycle

### 2.5 Check for Crawl Errors

1. Go to **Pages** (left sidebar, under Indexing)
2. Look for errors related to:
   - Old zh URLs returning 404 (shouldn't happen — they redirect)
   - New Chinese URLs not being indexed
   - "Redirect" status for old URLs (this is expected and good)
3. If you see "Crawled - currently not indexed" for Chinese pages, wait 1-2 weeks — this is normal for new pages

### 2.6 Monitor hreflang

1. Go to **International Targeting** (if available) or check via URL Inspection
2. For each Chinese page, verify GSC recognizes the hreflang alternate:
   - `法拉盛中医针灸` ↔ `acupuncture-flushing-ny` (en)
3. Common hreflang issues:
   - Missing return tag (en page must also link back to zh page)
   - Canonical URL mismatch
   - hreflang pointing to a redirected URL

---

## 3. GSC Monitoring Schedule

### Week 1 (Days 1-7 after deploy)

- [ ] Submit sitemap
- [ ] Request indexing for all 9 Chinese pages
- [ ] Verify redirects work for all 9 old URLs
- [ ] Check **Coverage** report for any new errors

### Week 2-3 (Days 8-21)

- [ ] Check **Pages** report — new Chinese URLs should appear as "Indexed"
- [ ] Check **Performance** report — filter by page, look for any Chinese query impressions
- [ ] Verify old URLs show "Page with redirect" status (not "Indexed")

### Month 1 (Days 22-30)

- [ ] Review **Performance > Search Results** filtered by:
  - Country: United States
  - Language: Chinese (Simplified)
  - Pages containing: `法拉盛`
- [ ] Check which Chinese queries are getting impressions
- [ ] Identify queries with impressions but low CTR — optimize title/description
- [ ] Compare Chinese page performance vs English page performance

### Monthly Ongoing

- [ ] Review top Chinese queries — are we ranking for target keywords?
- [ ] Check for new Chinese query opportunities in **Performance > Queries**
- [ ] Monitor **Core Web Vitals** for Chinese pages
- [ ] Check **Links** report for any backlinks to old URLs (they redirect, so OK)

---

## 4. GSC Performance Filters for Chinese SEO

### Filter: Chinese Pages Only

In GSC **Performance** report:
1. Click **+ New** filter
2. Select **Page**
3. Filter: "URLs containing" → `法拉盛`
4. This shows all Chinese SEO page performance

### Filter: Chinese Queries

1. Click **+ New** filter
2. Select **Query**
3. Filter: "Query containing" → common Chinese terms:
   - `针灸` (acupuncture)
   - `中医` (TCM)
   - `法拉盛` (Flushing)
   - `拔罐` (cupping)
   - `失眠` (insomnia)
   - `腰痛` (back pain)

### Key Metrics to Track

| Metric | What to Watch |
|---|---|
| **Impressions** | Are Chinese pages appearing in search? Should start within 2-4 weeks |
| **Clicks** | Actual traffic from Chinese queries |
| **CTR** | If impressions are high but CTR is low, optimize title/description |
| **Position** | Average position for target keywords — aim for top 10 within 3 months |
| **Queries** | Which Chinese queries trigger your pages — discover new keyword opportunities |

---

## 5. Expected Timeline

| Timeframe | Expected Result |
|---|---|
| **Days 1-3** | Sitemap submitted, indexing requested |
| **Days 3-7** | Google starts crawling new Chinese pages |
| **Week 2-3** | First Chinese pages appear in index |
| **Month 1** | Most pages indexed, first impressions for Chinese queries |
| **Month 2-3** | Ranking stabilization, initial traffic from Chinese searches |
| **Month 3-6** | Meaningful Chinese organic traffic, keyword rankings established |

### Ranking Factors Specific to Chinese Local SEO

1. **Page language consistency** — all signals in Chinese (done)
2. **Local relevance** — 法拉盛 in URL, title, H1, content (done)
3. **Google Business Profile** — ensure GBP also has Chinese description
4. **Reviews in Chinese** — encourage Chinese-speaking patients to leave reviews
5. **Backlinks from Chinese directories** — local Chinese community sites, WeChat articles
6. **Citation consistency** — NAP (Name, Address, Phone) consistent across Chinese directories

---

## 6. Next Steps After Launch

### Immediate (This Week)
- [ ] Deploy to production
- [ ] Submit sitemap to GSC
- [ ] Request indexing for all 9 pages
- [ ] Update Google Business Profile with Chinese description

### Short-term (Month 1)
- [ ] Monitor GSC for indexing status
- [ ] Add Chinese-language reviews to GBP
- [ ] Submit site to Chinese business directories (see list below)
- [ ] Create 2-3 Chinese blog posts targeting long-tail keywords

### Medium-term (Month 2-3)
- [ ] Analyze GSC data — which Chinese queries are performing?
- [ ] Create additional Chinese pages based on query data:
  - `法拉盛针灸师` (if practitioner queries detected)
  - `法拉盛中医诊所` (if clinic queries detected)
  - `法拉盛妇科中医` (if gynecology queries detected)
- [ ] Build Chinese-language backlinks

### Chinese Business Directories to Submit

| Directory | URL | Priority |
|---|---|---|
| 大众点评 (US) | dianping.com | High |
| 华人黄页 | huarenyellowpage.com | High |
| 58同城海外 | 58.com (overseas section) | Medium |
| 华人头条 | 52hrtt.com | Medium |
| Local Chinese community WeChat groups | N/A — manual outreach | High |
| Yelp (Chinese content) | yelp.com | Already listed |
| Google Business Profile | business.google.com | Already listed |

---

*Last updated: April 2026*
*Next review: May 2026 (after 30 days of GSC data)*
