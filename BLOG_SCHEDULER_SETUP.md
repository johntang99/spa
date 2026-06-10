# Blog Scheduler Setup

This project now supports **draft / scheduled / published** blog posts with bilingual pairing support.

## What was added

- Blog post fields:
  - `status`
  - `publishAt`
  - `translationGroup`
  - `imageAlt`
  - `imageCredit`
  - `imageSource`
- Public blog filtering:
  - hides drafts
  - hides future scheduled posts until `publishAt`
- Manual admin actions:
  - **Auto-Schedule Weekly**
  - **Run Publisher Now**
- Publisher API:
  - `POST /api/admin/blog/publish-due`
- Weekly scheduling API:
  - `POST /api/admin/blog/schedule-series`

---

## Admin workflow

Go to:

- `/admin/blog-posts`

You can now:

1. Create EN + ZH posts
2. Give both the same `translationGroup`
3. Set cover image + attribution fields
4. Save as `draft`, `scheduled`, or `published`
5. Use **Auto-Schedule Weekly** to stagger the campaign
6. Use **Run Publisher Now** to publish anything already due

---

## Recommended article fields

Example:

```json
{
  "slug": "acupuncture-for-sciatica",
  "title": "Can Acupuncture Help Sciatica?",
  "excerpt": "A patient-friendly explanation of how acupuncture may support sciatica care.",
  "image": "https://...",
  "imageAlt": "Acupuncture consultation in a calm clinic room",
  "imageCredit": "Photo by ... on Unsplash",
  "imageSource": "https://unsplash.com/...",
  "category": "acupuncture",
  "author": "Dr. Huang",
  "publishDate": "2026-04-01",
  "publishAt": "2026-04-01T13:00:00.000Z",
  "status": "scheduled",
  "translationGroup": "acupuncture-for-sciatica",
  "featured": false,
  "contentMarkdown": "# Article title...",
  "relatedServices": ["acupuncture"],
  "relatedConditions": ["back-pain"]
}
```

---

## Weekly scheduling flow

### Option 1 — manual per post
Set each post to:

- `status = scheduled`
- `publishAt = desired ISO datetime`

### Option 2 — bulk weekly auto-schedule
From the admin blog screen:

- click **Auto-Schedule Weekly**
- enter first publish date
- enter interval days (usually `7`)
- choose whether to schedule draft-only posts or all posts

The scheduler groups EN/ZH by `translationGroup` and gives them the same publish date.

---

## Auto-publisher endpoint

### Admin-authenticated call

```bash
curl -X POST http://localhost:3010/api/admin/blog/publish-due \
  -H 'Content-Type: application/json' \
  --cookie 'admin-token=...'
```

### Cron-safe call with secret

Set env:

```bash
BLOG_PUBLISH_CRON_SECRET=your-secret-here
```

Then call:

```bash
curl -X POST https://your-domain.com/api/admin/blog/publish-due \
  -H 'Content-Type: application/json' \
  -H 'x-cron-secret: your-secret-here' \
  -d '{}'
```

This allows external schedulers to publish due posts without an interactive admin session.

---

## Recommended production schedule

Run the publisher:

- every hour, or
- every day at a fixed time

For weekly article publishing, **hourly** is usually more than enough.

---

## Suggested production scheduler options

### Option A — platform cron (recommended)
Use your hosting provider scheduler to POST:

- `/api/admin/blog/publish-due`

with:

- `x-cron-secret`

### Option B — external cron service
Use GitHub Actions, UptimeRobot, EasyCron, or another scheduler to hit the same endpoint.

### Option C — OpenClaw cron
You can also trigger this endpoint from your OpenClaw environment if you want assistant-managed automation.

---

## Important notes

- `draft` posts are hidden from the public blog
- `scheduled` posts stay hidden until `publishAt`
- `published` posts are visible immediately
- sitemap excludes future scheduled blog posts
- if `status=scheduled`, `publishAt` is required

---

## Best practice for bilingual publishing

For each EN/ZH pair:

- use the same `translationGroup`
- use localized `title`, `excerpt`, `contentMarkdown`
- use same weekly `publishAt`
- keep image metadata consistent unless language-specific imagery is needed

---

## Best practice for Unsplash images

For each article save:

- `image`
- `imageAlt`
- `imageCredit`
- `imageSource`

Recommended:

- import selected images into your own media system when possible
- keep attribution/source even if you later mirror the asset into local storage or Supabase
