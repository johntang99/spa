# Staging Promotion Runbook

Use this runbook when promoting site changes from staging DB to production DB.

## 1) Pre-flight

- Confirm `APP_ENV=staging` in local/staging runtime.
- Verify site IDs and domain aliases are correct for staging.
- Export a backup snapshot from production first.

## 2) Validate in staging

- Verify page routes:
  - `/<locale>` home and key pages
  - blog listing and detail pages
- Verify admin save for:
  - page content
  - theme
  - navigation/header/footer
- Verify APIs:
  - `/api/health`
  - booking create/cancel/reschedule
  - contact form email flow

## 3) Promote content

- Export content from staging (per site + locale).
- Import to production using `missing` mode first.
- Use overwrite only for approved diffs.

## 4) Post-promotion smoke test

- Confirm domain-to-site routing for each promoted domain.
- Confirm locale routing (`/en`, `/zh`).
- Confirm media URLs and uploads resolve.
- Confirm booking and contact APIs behave normally.

## 5) Rollback

- Restore latest production export snapshot.
- Re-run smoke tests.
- Document incident and root cause in admin audit logs.
