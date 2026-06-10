# Article Scheduler Phase Plan

## Goal

Build a workflow for clinic sites like **Dr Huang Clinic** to:

- generate and manage **20 high-quality blog articles**
- support **English + Chinese** versions for each article
- attach a **high-quality cover image** (with source/credit tracking)
- publish **1 article per week automatically**
- manage everything from the existing **admin backend**

---

## Desired Outcome

At the end of this project, the app should support:

1. Creating or importing article drafts in both EN and ZH
2. Linking EN/ZH versions of the same article together
3. Scheduling future publish dates
4. Automatically publishing due posts weekly
5. Showing only published posts on the frontend
6. Storing image metadata cleanly
7. Managing the pipeline from admin without manual file shuffling

---

## Recommended Architecture

### Preferred approach: DB-backed scheduled publishing

Use the existing admin/content system and extend blog records with scheduling metadata.

### Core data additions

Each blog article should support:

- `status`: `draft | scheduled | published`
- `publishAt`: ISO datetime
- `translationGroup`: shared id for EN + ZH pair
- `locale`: `en | zh`
- `image`
- `imageAlt`
- `imageCredit`
- `imageSource`
- `featured`
- existing fields like `title`, `excerpt`, `contentMarkdown`, `relatedServices`, `relatedConditions`

---

# Phase 1 — Discovery and Technical Design

## Objective
Review current blog/admin/content architecture and define the cleanest implementation path.

## Tasks

- Review current blog admin pages and API routes
- Review how content is stored in DB vs JSON fallback
- Review frontend blog filtering logic
- Decide whether scheduler state lives in:
  - content DB
  - local JSON files
  - hybrid model
- Define bilingual post-linking strategy
- Define image metadata strategy
- Define publish visibility rules

## Deliverables

- confirmed technical approach
- schema change proposal
- API change list
- frontend change list
- admin UI change list

## Success Criteria

- We know exactly where scheduled status will be stored
- We know how EN/ZH posts are linked
- We know how auto-publish will run

---

# Phase 2 — Data Model and Backend Support

## Objective
Add the necessary fields and backend support for scheduled blog publishing.

## Tasks

- Extend blog post model/schema to support:
  - `status`
  - `publishAt`
  - `translationGroup`
  - image attribution fields
- Update content read/write logic
- Update admin content APIs for blog post persistence
- Add validation rules:
  - scheduled posts require `publishAt`
  - published posts must have required content fields
  - EN/ZH translation pairs can share a translation group

## Deliverables

- updated schema/types
- updated API handlers
- updated content read/write utilities

## Success Criteria

- Blog posts can be saved as draft/scheduled/published
- Blog posts can carry publish datetime and image attribution
- EN/ZH variants can be linked reliably

---

# Phase 3 — Frontend Publish Filtering

## Objective
Ensure only live posts appear publicly.

## Tasks

- Update blog list page to show only:
  - `published`, or
  - `scheduled` posts whose `publishAt <= now` if using a soft-live model
- Update blog detail page so future posts are hidden from public access
- Update featured-post logic to exclude future/unpublished posts
- Update sorting so publish timing behaves correctly
- Ensure sitemap/SEO behavior ignores future posts until live

## Deliverables

- blog page filtering updates
- detail page protection for future content
- featured article logic updated

## Success Criteria

- Future posts do not leak publicly
- Published posts appear normally
- Blog ordering remains correct

---

# Phase 4 — Admin Scheduling UI

## Objective
Allow editors to manage scheduled posts from admin.

## Tasks

- Add status selector in blog editor:
  - Draft
  - Scheduled
  - Published
- Add publish datetime picker
- Add EN/ZH translation group controls
- Add image fields:
  - image URL / media picker
  - alt text
  - image credit
  - image source link
- Add article queue view showing:
  - upcoming scheduled posts
  - publish date
  - locale
  - status
  - translation pair visibility

## Deliverables

- scheduling controls in admin
- article queue list / schedule view
- bilingual linkage UI

## Success Criteria

- Admin can schedule posts without editing JSON manually
- Admin can see upcoming weekly publishing queue
- Admin can manage EN + ZH versions together

---

# Phase 5 — Automatic Publisher Job

## Objective
Automatically publish scheduled posts at the correct time.

## Tasks

- Build a scheduler job or route-safe publisher script
- Job checks for:
  - `status = scheduled`
  - `publishAt <= now`
- Update due posts to `published`
- Publish both EN and ZH if both are scheduled for the same translation group
- Add logging for publish events
- Make publisher idempotent

## Delivery options

### Option A: app-hosted cron/job
If deployment supports scheduled jobs

### Option B: external cron hitting internal API
If easier operationally

### Option C: OpenClaw/Gateway cron
Useful if you want centralized automation from your assistant environment

## Deliverables

- auto-publish job
- publish logs
- safe re-run behavior

## Success Criteria

- Due scheduled articles publish automatically
- Re-running the job does not duplicate work
- EN/ZH pair publishing is consistent

---

# Phase 6 — Bulk Import Workflow for 20 Articles

## Objective
Make it easy to load the full article campaign at once.

## Tasks

- Define import format for bilingual articles
- Build bulk import support for:
  - title
  - excerpt
  - body markdown
  - category
  - image info
  - locale
  - translation group
  - scheduled publish date
- Auto-assign weekly schedule dates if desired
- Validate imported article completeness

## Deliverables

- import format spec
- import tool or admin bulk-import flow
- optional auto-stagger weekly scheduling

## Success Criteria

- 20 EN/ZH article pairs can be loaded efficiently
- Publish schedule can be assigned in one operation
- Imported posts are immediately visible in admin queue

---

# Phase 7 — Image Workflow (Unsplash-Compatible)

## Objective
Support beautiful article images with proper metadata handling.

## Tasks

- Define image sourcing workflow
- Prefer importing selected image into media storage rather than relying on fragile external URLs
- Store:
  - `image`
  - `imageAlt`
  - `imageCredit`
  - `imageSource`
- Add admin-friendly image picker support
- Optionally create helper for image ingestion/search workflow

## Notes

For operational quality, images should ideally be copied into your own media layer / storage instead of depending on third-party hotlinks.

## Deliverables

- image metadata model
- admin image support
- recommended import/storage workflow

## Success Criteria

- Every article can have a polished image
- Credits and source links are preserved
- Images remain stable over time

---

# Phase 8 — QA and Editorial Safety

## Objective
Ensure publishing workflow is reliable and medically appropriate.

## Tasks

- Test draft/scheduled/published transitions
- Test future visibility protection
- Test weekly publish automation
- Test EN/ZH paired publishing
- Test missing-translation cases
- Test image fallback behavior
- Review article templates for medical-safe wording and disclaimers

## Deliverables

- QA checklist
- scheduling test cases
- content safety checklist for blog generation

## Success Criteria

- No premature publishing
- No broken bilingual pair behavior
- No missing-image regressions
- Article output remains clinically safe and brand-consistent

---

# Phase 9 — Content Production Pipeline

## Objective
Operationalize the article generation workflow after the scheduler exists.

## Tasks

- Generate 20 article topics for Dr Huang Clinic
- Write EN versions
- Translate/adapt into ZH
- Choose image for each article
- Assign categories and internal links
- Assign publish dates weekly
- Load into scheduler queue

## Deliverables

- 20 EN articles
- 20 ZH articles
- 20 paired article records
- 20 images with metadata
- full 20-week publishing calendar

## Success Criteria

- Editorial queue is ready before week 1 starts
- Admin can see all scheduled posts clearly
- Publishing can run hands-off for months

---

# Suggested Implementation Order

1. **Phase 1** — discovery and design
2. **Phase 2** — data model/backend
3. **Phase 3** — frontend filtering
4. **Phase 4** — admin scheduling UI
5. **Phase 5** — auto-publisher job
6. **Phase 8** — QA
7. **Phase 6** — bulk import tools
8. **Phase 7** — image workflow enhancements
9. **Phase 9** — content production and scheduling

---

# MVP Scope

If we want the fastest usable version first, the MVP should include:

- scheduled/published/draft state
- publishAt field
- admin schedule control
- frontend hide future posts
- auto-publish job
- image metadata support

That is enough to manage 20 bilingual posts on a weekly cadence.

---

# Nice-to-Have Enhancements Later

- calendar-style content planner
- drag-and-drop queue ordering
- bulk reschedule tool
- duplicate article to another site
- built-in article generation wizard
- built-in image search/import helper
- content health dashboard

---

# My Recommendation

I can do this myself.

The best execution path is:

1. build the **scheduler system first**
2. then generate/import the **20 bilingual articles**
3. then attach images and schedule the entire series

That avoids doing content work before the publishing pipeline is ready.

---

# Proposed Next Step

Start **Phase 1 + Phase 2** immediately:

- inspect current admin blog code and APIs
- define the exact storage model
- implement the first backend/data changes for scheduled posts
