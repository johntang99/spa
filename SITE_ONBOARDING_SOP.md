# Site Onboarding SOP

**System:** BAAM Chinese Medicine
**Access Required:** super_admin
**Estimated Time:** ~30–50 seconds (with AI), ~15 seconds (skip AI)

> **Pipeline B** clones a master template site and customizes it for a new client in 7 automated steps (O1–O7). The result is a fully functional client site with unique content, branding, and SEO.

---

## Prerequisites

Before onboarding a new client, confirm ALL of the following:

- [ ] Master template site (`dr-huang-clinic`) is fully synced to Supabase (content, media, storage)
- [ ] You have the client's business information ready (name, address, phone, services, etc.)
- [ ] The dev server is running (`npm run dev` on port 3003)
- [ ] You have super_admin access to the Admin dashboard

### Required Environment Variables (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` | Supabase REST API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for DB + Storage operations |
| `SUPABASE_STORAGE_BUCKET` or `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Storage bucket name (e.g., `chinesemedicine-media`) |
| `ANTHROPIC_API_KEY` | Claude API key (required for AI content; skippable) |

### Required Supabase Tables

| Table | Purpose |
|-------|---------|
| `sites` | Site registry (id, name, domain, enabled, locales) |
| `content_entries` | All CMS content (site_id, locale, path, data) |
| `media_assets` | Media file records (site_id, path, url) |
| `site_domains` | Domain-to-site mapping (site_id, domain, environment) |

---

## Method A: Admin Onboarding UI (Recommended)

### Step 1 — Open Onboarding Wizard

1. Navigate to `/admin/onboarding` in the browser
2. You must be logged in as a **super_admin** — regular admins will see an access denied message

### Step 2 — Fill in the Intake Form

The form has 11 sections. **Sections 1–7 are required** (expanded by default). **Sections 8–11 are optional** (collapsed by default).

#### Section 1: Identity & Template
| Field | Notes |
|-------|-------|
| **Business Name** | Required. Auto-generates Site ID, domain, and email fields |
| **Site ID** | Auto-derived slug (e.g., "Golden Lotus Acupuncture" → `golden-lotus-acupuncture`). Editable. |
| **Clone From** | Template to clone from. Default: first enabled site in the system |

**Confirm:** "Is the Site ID correct? It becomes the permanent identifier for this client across DB, storage, and filesystem."

#### Section 2: Business Info
| Field | Notes |
|-------|-------|
| Owner Name | e.g., "Dr. Wei Chen" |
| Owner Title | e.g., "L.Ac., NCCAOM, MSTCM" |
| Owner Languages | Checkboxes: English, Chinese |
| Founded Year | Numeric |
| Years Experience | e.g., "8+" |
| Owner Certifications | Comma-separated |
| Owner Specializations | Comma-separated |
| Owner Credentials | Repeatable list: Credential, Institution, Year, Location |
| Team Members | Repeatable list: Name, Title, Role, Languages, Specializations |

#### Section 3: Location & Contact
| Field | Notes |
|-------|-------|
| Address | Street address |
| City / State / Zip | State is 2-char (e.g., "CA") |
| Phone | Also populates Emergency Phone |
| Email | Auto-generated as `info@{slug}.com` |
| Appointments Email | Auto-generated as `appointments@{slug}.com` |

#### Section 4: Hours
One text field per day (Mon–Sun). Defaults pre-filled:
- Mon–Fri: `9:00 AM - 5:00 PM`
- Saturday: `9:00 AM - 1:00 PM`
- Sunday: `Closed`

#### Section 5: Modalities (Services)
Checkbox grid with Select All / Deselect All per category. All 8 selected by default:

| Category | Services |
|----------|----------|
| Core Modalities | Acupuncture, Chinese Herbal Medicine, Cupping Therapy, Moxibustion |
| Manual Therapies | Tui Na Medical Massage, Gua Sha |
| Wellness & Lifestyle | Chinese Dietary Therapy, Lifestyle & Wellness Counseling |

**Confirm:** "Are the correct services selected? Unchecked services will be removed from all pages."

#### Section 6: Brand
5 preset variants with color swatches:

| Variant | Primary | Secondary |
|---------|---------|-----------|
| Teal & Gold | `#0D6E6E` | `#C9A84C` |
| Blue & Silver | `#2563EB` | `#94A3B8` |
| Green & Cream | `#2D6A4F` | `#DDA15E` |
| Purple & Rose | `#6D28D9` | `#EC4899` |
| Navy & Copper | `#1E3A5F` | `#B87333` |

Optional: Primary color hex override (auto-generates dark/light/50/100 shades).

#### Section 7: Locales & Domain
| Field | Notes |
|-------|-------|
| Supported Locales | English always enabled; Chinese (zh) toggle |
| Default Locale | Dropdown of selected locales |
| Production Domain | e.g., `goldenlotus.com` (auto-derived) |
| Dev Domain | e.g., `golden-lotus.local` (auto-derived) |

#### Sections 8–11 (Optional)

| Section | Key Fields |
|---------|-----------|
| **Content Tone** | Voice (Warm/Clinical/Casual), target demographic, USPs |
| **Social Media** | Facebook, Instagram, Google, YouTube, WeChat |
| **Insurance & Booking** | Accepts insurance, membership plan, booking URL |
| **Stats** | Repeatable: icon, number, label (4 defaults pre-filled) |

### Step 3 — Review & Generate

1. Review all filled fields
2. **Optional:** Check "Skip AI content generation" for faster processing (uses template copy as-is)
3. Click **"Generate Site"**

**Confirm:** "Is all information correct? The pipeline will start immediately."

### Step 4 — Monitor Pipeline Progress

The UI displays a live progress tracker via Server-Sent Events (SSE):

| Step | Name | What Happens | Duration |
|------|------|-------------|----------|
| O1 | Clone | Creates site record, clones content + media + storage + local files | ~15s |
| O2 | Brand | Applies color palette + font pairing from selected variant | <1s |
| O3 | Prune | Removes disabled services from all pages | ~3s |
| O4 | Replace | Deep string replacement (NAP) + structural file updates | ~5s |
| O5 | AI Content | Claude generates unique copy + SEO (skipped if checkbox checked) | ~15–25s |
| O6 | Cleanup | Deletes entries for unsupported locales | <1s |
| O7 | Verify | Checks required paths, contamination, service count, domains | <1s |

Each step shows: running → done (with duration) or error (pipeline aborts).

### Step 5 — Review Results

On success, the Done panel displays:
- Green success banner with business name
- Stats grid: **Entries**, **Services**, **Locales**, **Domains**
- **Errors** (red) — must be fixed before site is usable
- **Warnings** (amber) — informational, site is still functional

Action buttons:
- **View in Content Editor** → `/admin/content?siteId={id}&locale=en`
- **Preview Site** → `http://{devDomain}:3003/en` (new tab)
- **Onboard Another Client** → resets the form

---

## Post-Onboarding Steps

### Step 6 — Set Up Local Dev Domain

Add the `.local` domain to `/etc/hosts` so you can preview the site locally:

```bash
# Add hosts entry
sudo sh -c 'echo "127.0.0.1 {alias}.local" >> /etc/hosts'

# Flush DNS cache (macOS)
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder

# Test — should load the new client's site
open http://{alias}.local:3003/en
```

### Step 7 — Run Verification Script

```bash
node scripts/verify-site.mjs {site-id}
```

This checks all 9 layers against the template:

| Layer | Check | Expected |
|-------|-------|----------|
| DB | `sites` row exists | ✓ |
| DB | `content_entries` count matches template | ✓ (will differ after O2–O7 customization) |
| DB | `media_assets` count matches template | ✓ |
| DB | `site_domains` ≥ 2 rows | ✓ |
| DB | No URL contamination in media | ✓ |
| Storage | Files in `{bucket}/{site-id}/` | ✓ (count matches template) |
| Local | `public/uploads/{site-id}/` exists | ✓ |
| Local | `content/{site-id}/` exists | ✓ |
| JSON | Entry in `_sites.json` | ✓ |
| JSON | Entry in `_site-domains.json` | ✓ |

> **Note:** After O2–O7 steps, `content_entries` count may differ from the template (services pruned, locales cleaned up). This is expected.

### Step 8 — Visual Spot-Check

Open the site in a browser and verify:

- [ ] Homepage loads with correct business name and tagline
- [ ] Hero section shows correct branding (colors, fonts)
- [ ] About page shows correct owner bio, credentials
- [ ] Contact page shows correct phone, address, hours
- [ ] Footer shows correct hours, social links, copyright year
- [ ] Services page only shows enabled services
- [ ] SEO titles are client-specific (view page source)
- [ ] Language switcher works (if multiple locales enabled)
- [ ] No template business name visible anywhere

---

## Pipeline Details: What O1 Clone Creates

O1 is the most critical step — it creates the full data foundation across 4 layers:

```
┌─────────────────────────────────────────────────────┐
│                    O1: CLONE                        │
│                                                     │
│  DB Layer                                           │
│  ├── sites          → 1 new row                     │
│  ├── content_entries → ~68 rows (cloned from tpl)   │
│  ├── media_assets   → ~66 rows (URLs remapped)      │
│  └── site_domains   → 2 rows (prod + dev)           │
│                                                     │
│  Storage Layer                                      │
│  └── {bucket}/{site-id}/ → ~66 files copied         │
│                                                     │
│  Local Filesystem                                   │
│  ├── public/uploads/{site-id}/ → images copied      │
│  └── content/{site-id}/        → fallback files     │
│                                                     │
│  JSON Registry                                      │
│  ├── content/_sites.json       → entry appended     │
│  └── content/_site-domains.json → entries appended  │
└─────────────────────────────────────────────────────┘
```

### URL Remapping in Media Assets

Media URLs use Supabase Storage bucket paths (not `/uploads/`):
```
Before: chinesemedicine-media/dr-huang-clinic/hero.jpg
After:  chinesemedicine-media/tcm-hub/hero.jpg
```

The clone step chains two `.replace()` calls to handle both path formats:
1. `.replace(/uploads/{template}/, /uploads/{new}/)`
2. `.replace(/{template}/, /{new}/)` — catches Storage bucket paths

### Idempotency

All O1 operations are idempotent — safe to re-run:
- DB upserts use `ON CONFLICT` merge-duplicates
- Storage copy ignores "already exists" errors
- File copy uses `errorOnExist: false`
- JSON registry checks for existing entries before appending

---

## Troubleshooting

### Pipeline fails at O1 with Supabase error
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Check that the template site exists in the `sites` table
- Verify Supabase project is accessible

### No images on the new site
- Run `node scripts/verify-site.mjs {site-id}` — check Storage and uploads
- Verify `SUPABASE_STORAGE_BUCKET` is set in `.env.local`
- Check Supabase Storage dashboard for `{site-id}/` folder

### Template business name still visible
- O7 verification reports contamination as warnings
- Re-run the pipeline or manually fix in Content Editor
- Check the replacement pairs in the API route — the template string may need updating

### Dev domain doesn't resolve
- Check `/etc/hosts` has the `127.0.0.1 {alias}.local` entry
- Flush DNS: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`
- Verify `site_domains` table has the dev domain row

### "Cannot find module" error after onboarding
- Delete `.next` cache: `rm -rf .next`
- Restart the dev server: `npm run dev`

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [SITE_DELETION_SOP.md](SITE_DELETION_SOP.md) | How to delete a client site (reverse of this process) |
| [BAAM_MASTER_PLAN_V3_COMPLETE.md](BAAM_MASTER_PLAN_V3_COMPLETE.md) | Full system architecture and pipeline reference |
| `scripts/verify-site.mjs` | Automated post-onboarding verification |
| `scripts/delete-site.mjs` | Interactive site deletion with confirmations |

---

## Notes

- **Template sites** (e.g., `dr-huang-clinic`) must NEVER be modified by the onboarding pipeline. Always clone FROM them, never INTO them.
- The Admin UI (`/admin/sites`) supports editing and disabling sites but does NOT have a delete button. See [SITE_DELETION_SOP.md](SITE_DELETION_SOP.md) for deletion.
- If you only want to temporarily disable a site, set `enabled: false` in the `sites` table instead of deleting.
- The "Skip AI" option is useful for test onboarding — it runs in ~15 seconds instead of ~50 seconds.
- Each onboarding costs approximately **$0.13** in Claude API usage (when AI is enabled).
