# Site Deletion SOP

**System:** BAAM Chinese Medicine
**Access Required:** super_admin
**Estimated Time:** 2–5 minutes (manual), <30 seconds (script)

> **WARNING:** Site deletion is irreversible. There is no undo. All content, media, and configuration for the site will be permanently removed from the database, storage bucket, and local filesystem.

---

## Pre-Deletion Checklist

Before deleting a site, confirm ALL of the following:

- [ ] The site is no longer serving production traffic (domain DNS removed or redirected)
- [ ] The site owner has been notified and has approved deletion
- [ ] You have exported/backed up any content you want to preserve (Supabase dashboard > Table Editor > Export CSV, or Admin CMS content export)
- [ ] You have noted the site ID (e.g., `tcm-hub`) — this is needed for every step

---

## Deletion Order

**Children first, parent last.** Foreign key dependencies require this order.

| Step | Layer | Table / Path | Why |
|------|-------|-------------|-----|
| 1 | DB | `content_entries` | Most rows — bulk content |
| 2 | DB | `media_assets` | Media URL records |
| 3 | DB | `site_domains` | Domain alias mappings |
| 4 | DB | `sites` | Parent record (delete last) |
| 5 | Storage | `{bucket}/{site-id}/` | Actual image files in Supabase Storage |
| 6 | Local | `public/uploads/{site-id}/` | Local image cache |
| 7 | Local | `content/{site-id}/` | Local content fallback files |
| 8 | JSON | `content/_sites.json` | Local site registry |
| 9 | JSON | `content/_site-domains.json` | Local domain registry |

---

## Method A: Manual Deletion (Supabase Dashboard + Terminal)

### Step 1 — Delete content_entries

1. Open Supabase Dashboard > Table Editor > `content_entries`
2. Filter: `site_id` = `{site-id}`
3. Confirm the row count matches expectations
4. Select all filtered rows > Delete

**Confirm:** "Are you deleting content for the correct site? This removes ALL page content."

### Step 2 — Delete media_assets

1. Table Editor > `media_assets`
2. Filter: `site_id` = `{site-id}`
3. Confirm the row count
4. Select all > Delete

**Confirm:** "Are you deleting media records for the correct site?"

### Step 3 — Delete site_domains

1. Table Editor > `site_domains`
2. Filter: `site_id` = `{site-id}`
3. Verify the domains listed are the ones to remove
4. Select all > Delete

**Confirm:** "Are these the correct domain mappings to remove?"

### Step 4 — Delete site record

1. Table Editor > `sites`
2. Filter: `id` = `{site-id}`
3. Verify site name matches
4. Delete the row

**Confirm:** "This is the master site record. Deleting it finalizes DB removal."

### Step 5 — Delete Storage bucket files

1. Supabase Dashboard > Storage > `{bucket}` (e.g., `chinesemedicine-media`)
2. Navigate into the `{site-id}/` folder
3. Verify the folder name is correct
4. Select all files > Delete
5. Verify the folder is now empty / gone

**Confirm:** "Are you deleting files from the correct site folder in storage?"

### Step 6 — Delete local uploads

```bash
# Verify first — list what will be deleted
ls public/uploads/{site-id}/

# Confirm, then delete
rm -rf public/uploads/{site-id}/
```

**Confirm:** "Is this the correct local uploads directory?"

### Step 7 — Delete local content directory

```bash
# Verify first
ls content/{site-id}/

# Confirm, then delete
rm -rf content/{site-id}/
```

**Confirm:** "Is this the correct local content directory?"

### Step 8 — Remove from _sites.json

1. Open `content/_sites.json`
2. Find and remove the object with `"id": "{site-id}"`
3. Save the file
4. Verify the JSON is still valid (no trailing commas)

### Step 9 — Remove from _site-domains.json

1. Open `content/_site-domains.json`
2. Find and remove ALL objects with `"siteId": "{site-id}"`
3. Save the file
4. Verify the JSON is still valid

---

## Method B: Script Deletion (Recommended)

Use the deletion script for a faster, safer process with built-in verification.

### Usage

```bash
node scripts/delete-site.mjs {site-id}

# Dry run (shows what would be deleted, changes nothing)
node scripts/delete-site.mjs {site-id} --dry-run
```

### Script behavior

1. Looks up the site in DB — aborts if not found
2. Shows a full inventory of what will be deleted (row counts, file counts)
3. Requires explicit `y` confirmation before each destructive step
4. Deletes in the correct order (children first)
5. Runs a verification pass after deletion to confirm everything is gone
6. Prints a final summary

---

## Post-Deletion Verification

After deletion, verify all layers are clean:

| Check | How | Expected |
|-------|-----|----------|
| DB sites | `SELECT * FROM sites WHERE id = '{site-id}'` | 0 rows |
| DB content | `SELECT count(*) FROM content_entries WHERE site_id = '{site-id}'` | 0 |
| DB media | `SELECT count(*) FROM media_assets WHERE site_id = '{site-id}'` | 0 |
| DB domains | `SELECT * FROM site_domains WHERE site_id = '{site-id}'` | 0 rows |
| Storage bucket | Navigate to `{bucket}/{site-id}/` in dashboard | Folder gone |
| Local uploads | `ls public/uploads/{site-id}/` | "No such file or directory" |
| Local content | `ls content/{site-id}/` | "No such file or directory" |
| _sites.json | Search for `{site-id}` | Not found |
| _site-domains.json | Search for `{site-id}` | Not found |
| Admin UI | Visit `/admin/sites` | Site not listed |
| Dev server | Restart dev server, visit site domain | 404 or default site |

---

## Emergency: Accidental Deletion Recovery

If a site is accidentally deleted:

1. **DB content** — If Supabase Point-in-Time Recovery (PITR) is enabled, restore from a backup. Otherwise, content is unrecoverable unless you exported it.
2. **Storage files** — Supabase Storage does not have automatic backups. Files are permanently deleted.
3. **Local files** — If you have git history or Time Machine backups, restore from there.
4. **Fastest recovery path** — If the template still exists, re-run the onboarding pipeline to recreate the site from the template. You will lose any customizations made after the original onboarding.

**Prevention:** Always run `--dry-run` first. Always back up before deleting production sites.

---

## Notes

- The admin UI (`/admin/sites`) currently supports editing and disabling sites but does NOT have a delete button. Deletion must be done via script or manually via the steps above.
- Template sites (e.g., `dr-huang-clinic`) should NEVER be deleted — they are required for onboarding new clients.
- If you only want to temporarily remove a site from the system, set `enabled: false` in the sites table instead of deleting. This preserves all data for later re-activation.
