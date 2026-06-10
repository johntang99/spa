# 2-Site Content Diversification Runbook

Goal: onboard 2 new medical sites that are both clinically safe and clearly distinct from:
- each other
- `tcm-network`
- `goshen-acupuncture`

This runbook is EN-first (English copy), focused on `services` and `conditions`, and designed to be repeatable.

## 1) Source Site Choice

Clone both new sites from `tcm-network`.

Why:
- It is the cleaner canonical baseline.
- Cloning from a rewritten derivative (like `goshen-acupuncture`) can compound similarity artifacts.

## 2) Clone Strategy

Create Site A and Site B from `tcm-network` using onboarding UI/API.

Recommended onboarding settings:
- `cloneFrom`: `tcm-network`
- `locales`: start with `en` only unless client requires `zh`
- `skipAi`: `true` for deterministic baseline, then run controlled rewrites per site

## 3) Rewrite Profiles (must differ)

Run rewrites separately per site with different voice profiles/instructions.

- Site A profile (`clinical-precise`)
  - Tone: concise, evidence-informed, practitioner-led
  - Sentence style: short-medium, direct, low flourish
  - Lexicon: clinical plain English

- Site B profile (`warm-community`)
  - Tone: empathetic, local-trust, patient-centered
  - Sentence style: medium-long, supportive framing
  - Lexicon: accessible, conversational but professional

Use aggressive mode for stronger divergence:
- `mode`: `aggressive`
- `provider`: `openai` or `claude`
- `sourceOfTruth`: `local`
- `targetPaths` (minimum):
  - `pages/services.json`
  - `pages/conditions.json`

Optional expansion (recommended for "all content"):
- `pages/home.json`
- `pages/about.json`
- `pages/contact.json`
- `pages/blog.json`
- `blog/*.json` (run in batches)

## 4) Rewrite Execution Sequence (per site)

For each site (`SITE_ID`):

1. Create rewrite job for `services` + `conditions` (aggressive).
2. Run job.
3. Approve all non-hard-block items.
   - Reject any with hard blocks:
     - `empty_rewrite`
     - `forbidden_terms_present`
4. Apply approved items.
5. Import JSON to DB (overwrite only rewritten paths).

Important: keep this order exactly to avoid drift between local files and DB.

## 5) Similarity Quality Gates

Use these pass/fail thresholds for EN `services` + `conditions`:

- Pairwise (Site A vs Site B):
  - `wordJaccard <= 0.62`
  - `sentenceOverlapPct <= 45`

- Against baselines (`tcm-network`, `goshen-acupuncture`):
  - `wordJaccard <= 0.62`
  - `sentenceOverlapPct <= 45`

If any check fails:
1. Run targeted micro-pass only on high-similarity blocks.
2. Re-measure.
3. Re-apply/import.

## 6) Automated Diversity Audit

Use the audit script:

```bash
node scripts/content/audit-site-diversity.mjs \
  --siteA <site-a-id> \
  --siteB <site-b-id> \
  --locale en \
  --baselines tcm-network,goshen-acupuncture \
  --maxWordJaccard 0.62 \
  --maxSentenceOverlapPct 45
```

Exit codes:
- `0`: pass
- `2`: threshold failure

## 7) Targeted Micro-Pass Rule

When thresholds fail, do not rewrite everything again.

Only rewrite high-similarity blocks, usually:
- `conditions[].description`
- `conditions[].tcmApproach`
- `servicesList.items[].shortDescription`
- `servicesList.items[].whatToExpect`
- `servicesList.items[].fullDescription`

Apply only approved target item IDs; leave all other items untouched.

## 8) Safety Rules (medical content)

Never allow:
- cure guarantees
- instant-results claims
- risk-free absolutes
- replacing practitioner judgment with deterministic claims

Keep:
- same clinical intent
- same treatment scope
- safe disclaimers and coordination language

## 9) Final Release Checklist

- [ ] Site A and Site B cloned from `tcm-network`
- [ ] EN rewrite applied for `services` + `conditions`
- [ ] JSON imported to DB after apply
- [ ] Diversity audit passes against each other and baselines
- [ ] Manual spot check: top 10 condition blocks read naturally and safely
- [ ] Build/type-check passes

## 10) Recommended Defaults

Use these defaults unless a project lead overrides:
- Rewrite mode: `aggressive`
- Min change ratio target: `>= 0.35`
- Max length delta: `<= 65%`
- Forbidden terms: `guaranteed cure`, `instant cure`, `miracle cure`, `risk-free cure`

This gives strong differentiation while preserving medical meaning and editorial safety.
