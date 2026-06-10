# Locale Routing SOP (Admin-Controlled Default Path)

## Purpose

This SOP defines how to control the default locale redirect (`/en` or `/zh`) by editing site settings in Admin, without editing JSON files or code for routine operations.

## Scope

- Project: `medical-clinic/chinese-medicine`
- Routes affected: requests without locale prefix (for example `/`, `/about`, `/services`)
- Locales: `en`, `zh`

## Current Behavior (After DB-First Middleware Change)

For non-locale paths, middleware resolves locale in this order:

1. Database mapping (`site_domains` -> `sites.default_locale`) **(source of truth)**
2. File fallback (`content/_site-domains.json` + `content/_sites.json`)
3. Global fallback (`defaultLocale` in i18n)

Notes:

- Host matching is normalized (`www.`, protocol, path, and port removed).
- Locale lookup cache TTL in middleware is ~60 seconds.
- Admin changes may take up to 60 seconds to appear on root redirect behavior.

## Required Production Environment Variables

Set these in Vercel project environment (Production):

- `APP_ENV=prod` (or `NEXT_PUBLIC_APP_ENV=prod`)
- One Supabase URL:
  - `SUPABASE_PROD_URL` or `SUPABASE_URL`
- One Supabase service role key:
  - `SUPABASE_PROD_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

If URL/key are missing, middleware falls back to local JSON mapping.

## Standard Operation (Admin)

1. Go to `Admin -> Sites -> [target site]`.
2. Confirm `Site is active`.
3. Set `Default Locale` (`en` or `zh`).
4. In `Domain Aliases`, ensure production hostname exists and is enabled (for example `tcm-network.com`).
5. Click `Save Changes`.
6. Wait 60-65 seconds.
7. Verify redirect.

## Verification Commands

Use manual redirect check:

```bash
curl -I --max-redirs 0 "https://www.tcm-network.com"
```

Expected result:

- `Location: /zh/` when default locale is `zh`
- `Location: /en/` when default locale is `en`

Optional full chain:

```bash
curl -I -L --max-redirs 5 "https://www.tcm-network.com"
```

## Safe Test + Rollback Procedure

Use when validating a production deploy:

1. Record current locale in Admin.
2. Switch to the opposite locale and save.
3. Wait 60-65 seconds.
4. Verify root redirect changed.
5. Restore original locale.
6. Wait 60-65 seconds.
7. Verify redirect returned to original.

## Troubleshooting

### Admin locale changed but redirect did not change

Check in order:

1. Domain alias exists and is enabled for the site (`Admin -> Sites -> Domain Aliases`).
2. Deployed version includes DB-first middleware logic.
3. Vercel env vars for Supabase URL + service role key are present in Production.
4. Wait at least 60 seconds to clear middleware cache TTL.
5. Verify host canonicalization:
   - test both `https://domain.com` and `https://www.domain.com`

### Redirect still goes to old locale after all checks

- Inspect external redirect rules in Vercel project settings.
- Confirm request is hitting this app (not another project/domain target).

## Operational Notes

- Admin is now the primary control plane for locale routing.
- Local JSON files remain fallback/config backup, not required for daily locale switching.
- For emergency recovery, JSON fallback still provides deterministic behavior if DB lookup fails.
