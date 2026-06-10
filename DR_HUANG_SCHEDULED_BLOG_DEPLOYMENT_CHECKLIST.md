# Dr Huang Scheduled Blog Deployment Checklist

## Purpose

This document explains how to safely deploy and verify the **scheduled bilingual blog system** for **Dr Huang Clinic**.

It also documents:

- how the scheduling system is coded
- where scheduled posts live
- how publishing works
- what to check if future posts appear too early
- how to debug issues in production

---

# 1. Current System Design

## Important rule

**Old published articles stay in `blog/`.**

**Future scheduled articles stay in `blog-scheduled/`.**

This is the safety boundary that prevents future posts from appearing early on the public blog.

---

## Live vs scheduled folders

### Published / visible blog posts

Located in:

- `content/dr-huang-clinic/en/blog/`
- `content/dr-huang-clinic/zh/blog/`

These are the posts the public site reads.

### Future scheduled blog posts

Located in:

- `content/dr-huang-clinic/en/blog-scheduled/`
- `content/dr-huang-clinic/zh/blog-scheduled/`

These should **not** be shown on the public blog until they are published.

---

## Why this design was chosen

Originally, keeping future scheduled posts in `blog/` depended on frontend filtering logic.

That is fragile because:

- cached deployments may serve old code
- content loaders may expose all files in the directory
- DB/file mismatches may still surface hidden content

By moving future posts into `blog-scheduled/`, the system becomes much safer:

- public blog only reads `blog/`
- future posts are physically outside the live content path
- publishing becomes an explicit promotion step

---

# 2. How the Publishing System Works

## Scheduling

When a blog post is scheduled, it should have fields like:

```json
{
  "status": "scheduled",
  "publishAt": "2026-10-05T13:00:00.000Z",
  "publishDate": "2026-10-05",
  "translationGroup": "acupuncture-for-acid-reflux-gerd"
}
```

But the key protection is not the metadata alone.

The key protection is:

- scheduled files live in `blog-scheduled/`
- not in `blog/`

---

## Auto-publish behavior

The publisher endpoint:

- reads due posts from `blog-scheduled/`
- checks whether `publishAt <= now`
- converts them to published content
- writes them into `blog/`
- removes the scheduled file copy

This is the core publish route:

- `app/api/admin/blog/publish-due/route.ts`

---

## Manual / automated scheduling

The project includes a scheduling route:

- `app/api/admin/blog/schedule-series/route.ts`

This route can assign weekly publish dates to article groups.

However, after scheduling, future posts should remain in `blog-scheduled/`, not `blog/`.

---

# 3. Files and Code Areas Involved

## Main code files

### Blog schedule helpers
- `lib/blog.ts`

Contains:
- blog status handling
- visibility checks
- publish-time normalization

### Blog list page
- `app/[locale]/blog/page.tsx`

This page loads blog posts and displays them publicly.

### Blog detail page
- `app/[locale]/blog/[slug]/page.tsx`

This renders individual blog posts.

### Sitemap
- `app/sitemap.ts`

This should exclude future unpublished content.

### Publisher route
- `app/api/admin/blog/publish-due/route.ts`

This promotes scheduled posts into live blog content when due.

### Scheduler route
- `app/api/admin/blog/schedule-series/route.ts`

This bulk-assigns weekly dates.

---

# 4. Deployment Checklist

## Before deploying

### A. Confirm old published articles are still in `blog/`
For Dr Huang, these old indexed articles should remain in:

- `content/dr-huang-clinic/en/blog/`
- `content/dr-huang-clinic/zh/blog/`

Do **not** move or alter their historical publish dates.

### B. Confirm future posts are in `blog-scheduled/`
All future bilingual campaign posts should be in:

- `content/dr-huang-clinic/en/blog-scheduled/`
- `content/dr-huang-clinic/zh/blog-scheduled/`

### C. Confirm live blog folder contains only already-public content
Check that `blog/` does **not** contain future scheduled article files.

### D. Confirm build passes
Run:

```bash
npm run build
```

Expected result:
- build completes successfully

---

## Deploy code/content

Deploy the latest commit that contains:

- hidden `blog-scheduled/` folder structure
- updated publish route
- restored old publish dates

Recommended commit reference for hidden scheduled folder fix:

- `c9267e0` — `Hide scheduled Dr Huang posts until publish time`

Also ensure later corrections are included if newer commits exist in your deployment branch.

---

## After deployment

### A. Check public blog page
Visit:

- `https://www.drhuangclinic.com/en/blog`
- `https://www.drhuangclinic.com/zh/blog`

Verify:
- only old published articles are visible
- future scheduled article titles do **not** appear

### B. Check specific future slugs
Open future slugs directly and confirm they are not publicly available until due.

Examples:

- `/en/blog/acupuncture-for-anxiety-practical-guide`
- `/en/blog/acupuncture-for-menopause-symptom-support`
- `/en/blog/acupuncture-for-acid-reflux-gerd`

Expected behavior before publish time:
- should not be publicly visible
- ideally return 404 or remain unavailable

### C. Check sitemap
Visit:

- `/sitemap.xml`

Verify future scheduled posts are not included.

---

# 5. Cron / Auto-Publish Setup

## Env var
Set:

```bash
BLOG_PUBLISH_CRON_SECRET=your-secret-here
```

## Publisher endpoint
Use:

```bash
POST /api/admin/blog/publish-due
```

With header:

```bash
x-cron-secret: your-secret-here
```

### Example curl

```bash
curl -X POST https://www.drhuangclinic.com/api/admin/blog/publish-due \
  -H 'Content-Type: application/json' \
  -H 'x-cron-secret: your-secret-here' \
  -d '{}'
```

## Recommended schedule
Run publisher:

- every hour, or
- every day at a fixed time

Hourly is usually more than enough for weekly blog publishing.

---

# 6. Debug Checklist for Future Issues

## Problem: future posts appear on the public blog

### Check 1: Are future posts still in `blog/`?
If yes:
- move them to `blog-scheduled/`
- redeploy

### Check 2: Is production actually running the updated code?
If local repo is fixed but website still shows future posts:
- production likely has old code or stale build
- redeploy the latest branch/commit
- clear any deployment cache if relevant

### Check 3: Is the DB still holding stale blog entries?
If DB-backed content is enabled, old scheduled data may still be present.

Check whether DB rows still reference:
- `blog/...` for future content

Instead, future content should exist in:
- `blog-scheduled/...`

### Check 4: Is sitemap exposing future posts?
If yes:
- confirm production sitemap logic is current
- confirm future posts are not still present in live `blog/`

### Check 5: Is the blog list page loading the wrong directory or stale data?
Inspect:
- `app/[locale]/blog/page.tsx`
- `lib/content.ts`

Public listing should only load visible posts from `blog/`, not scheduled storage.

---

## Problem: due posts are not publishing

### Check 1: Confirm cron is calling the endpoint
Test manually:

```bash
curl -X POST https://your-domain.com/api/admin/blog/publish-due \
  -H 'Content-Type: application/json' \
  -H 'x-cron-secret: your-secret-here' \
  -d '{}'
```

### Check 2: Confirm `publishAt` is valid ISO datetime
Example valid value:

```json
"publishAt": "2026-10-05T13:00:00.000Z"
```

### Check 3: Confirm file is in `blog-scheduled/`
If a scheduled file is still sitting in `blog/`, that is the wrong storage path.

### Check 4: Confirm file status is `scheduled`
If status is not `scheduled`, the publisher may ignore it.

### Check 5: Confirm server time / timezone assumptions
The system currently uses ISO publish times.
Be consistent about UTC vs local time when scheduling.

---

## Problem: old published articles changed unexpectedly

### Check 1: verify `publishDate`
For old indexed articles, confirm their historical `publishDate` values are preserved.

### Check 2: confirm no `publishAt`
Old published articles should not carry future publish times.

### Check 3: confirm they are not marked `scheduled`
Old published articles should not have:

```json
"status": "scheduled"
```

### Check 4: sync DB and file state
If DB-backed content is enabled, restoring files alone is not enough.
Push the corrected content through the content API or admin save flow so DB matches file state.

---

# 7. Recommended Operational Rules Going Forward

## Rule 1
**Never store future public articles in `blog/`.**

## Rule 2
**Only old published/live posts belong in `blog/`.**

## Rule 3
**All future posts go into `blog-scheduled/`.**

## Rule 4
**Publishing should be a promotion step, not just a metadata change.**

## Rule 5
**When old indexed posts already exist, never rewrite their publish dates.**

## Rule 6
**If DB-backed content is enabled, always sync both file + DB state.**

---

# 8. Suggested Team Workflow

## For editors
1. Create EN + ZH post pair
2. Use same `translationGroup`
3. Add image metadata
4. Save as scheduled content
5. Store in `blog-scheduled/`

## For operations
1. Deploy latest code
2. Verify public blog hides future posts
3. Verify cron secret is configured
4. Test publisher endpoint manually once
5. Monitor first scheduled publish day

## For debugging
1. Check file location first
2. Check DB sync second
3. Check deployed code version third
4. Check cache/redeploy fourth

---

# 9. Final Notes

The most important lesson from this rollout is simple:

> **Directory separation is safer than relying on visibility flags alone.**

When future content lives in the same public content folder as published content, it is too easy for it to leak through:
- old code
- stale caches
- DB/file mismatches
- incomplete filters

Using `blog-scheduled/` makes the system much more robust.

---

# 10. Recommended Immediate Post-Deploy Verification

After production deploy, verify these three things in order:

## 1. Public blog page
- future posts do not appear

## 2. Direct future slug
- returns unavailable / hidden behavior before publish date

## 3. Manual publish test in staging or dev
- move one due test post from `blog-scheduled/` to `blog/`
- verify it appears only after publishing

---

# 11. Reference Commits

Useful project checkpoints:

- `da6d42c` — Add blog scheduling MVP foundations
- `ae15eb3` — Finish blog scheduling workflow and automation
- `1fca3ee` — Add Dr Huang bilingual blog campaign and schedule
- `04ac79f` — Restore indexed Dr Huang posts and unschedule legacy translations
- `2276b3f` — Restore original publish dates for indexed Dr Huang posts
- `c9267e0` — Hide scheduled Dr Huang posts until publish time

Use the latest correct branch state when deploying.
