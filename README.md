# Chinese Medicine Template


lsof -ti:3080 | xargs kill -9
rm -rf .next
npm run dev

npm install
npm run build

git add .
git commit -m "Update: describe your changes"
git push


curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_djRlq5PsWfKq75nViJDtyg3gzsBH/nWJg1rsYkt




Production-ready multi-site Traditional Chinese Medicine template with admin CMS, DB-first content, and EN/ZH locale support.

## What this template includes

- Multi-site architecture with host-based site resolution
- Admin dashboard (sites, users, content, blog, booking, media)
- DB-first storage with file fallback
- Clinic booking model:
  - consultation booking
  - follow-up visits
  - treatment planning
  - provider operations support
- Clone-safe docs and starter seed packs

## Local development

```bash
npm run dev -- -p 5001
```

Stop local dev quickly:

```bash
pkill -f "next dev"
```

Build:

```bash
npm run build
```

Health check:

```bash
curl http://localhost:3003/api/health
```

## Content Sync Guardrail Policy (Required)

- `Sync Current File to DB` is the default sync path and must stay scoped to one file.
- Non-overwrite import requests must include `includePaths`; locale-wide missing-mode import is blocked.
- Locale-wide content overwrite is allowed only through the `Overwrite Import` button flow.
- Production overwrite requires break-glass controls:
  - `ALLOW_PROD_OVERWRITE_IMPORT=true`
  - valid `PROD_IMPORT_GUARD_TOKEN`
- `Check Update From DB` and `Export Locale JSON` remain available for review/backup workflows.

## Default admin (file fallback seed)

- `admin@example.com`
- `admin123`

## Canonical locales

- `en` (default)
- `zh`

## Key docs

- `LOCALE_ROUTING_SOP.md`
- `DRHUANG_CLINIC_REPRODUCTION_GUIDE.md`
- `SITE_REPRODUCTION_TEMPLATE.md`
- `NEW_SITE_DUPLICATION_CHECKLIST.md`
- `TEMPLATE_QA_MATRIX.md`
- `TEMPLATE_RUNBOOK.md`
- `STAGING_PROMOTION_RUNBOOK.md`

## Starter seed packs

- `content/starter-packs/starter-basic/`
- `content/starter-packs/starter-pro/`

Use starter packs as booking data blueprints when launching a new site clone.

## Cross-site TCM services wording

These assets are designed for all TCM sites (not a single site only):

- Canonical service library: `content/shared/services-library/services.master.en.json`
- Site voice profiles: `content/shared/services-library/site-voice-profiles.en.json`
- Generator script: `scripts/content/generate-services-variants.mjs`

Example (merge generated wording into one site's `services.json`):

```bash
node scripts/content/generate-services-variants.mjs \
  --site dr-huang-clinic \
  --target content/dr-huang-clinic/en/pages/services.json \
  --out content/dr-huang-clinic/en/pages/services.generated.json
```

Recommended workflow:

1. Maintain medical-safe meanings in `services.master.en.json`.
2. Adjust tone/context in `site-voice-profiles.en.json`.
3. Generate per-site copy and review before replacing production content.

---

This repository is the active Chinese Medicine clinic template baseline.
