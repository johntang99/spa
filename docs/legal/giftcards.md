# NY Gift-Card Legal Compliance Record (Phase 4B)

> Status: **template verification — requires client legal confirmation before launch.**
> Recorded: 2026-06-10

## Requirement
New York gift cards / gift certificates are governed by **NY General Business Law (GBL) §396-i**.
Key consumer protections for gift certificates sold to consumers:

- **No expiration of the underlying funds.** A gift certificate's value may not expire (an expiration
  date on the *certificate* is permitted only if the funds remain redeemable; in practice we sell
  non-expiring certificates to avoid any ambiguity).
- **Restrictions on fees.** Dormancy, service, and maintenance fees are heavily restricted /
  effectively prohibited for typical retail gift certificates.
- **Clear disclosure** of any terms at the point of sale.

> ⚠️ Statutes change. Re-verify §396-i (and any amendments / NY AG guidance) against the current
> statute text at launch time, and have the client's counsel confirm.

## How Spa Paradise complies (as built)
| Surface | Disclosure |
|---|---|
| **Gift-cards FAQ** (`faqs` collection, scope `gift`) | "Gift cards never expire and carry no fees." |
| **Terms of Service** (`pages/terms.json` → Gift Cards section, EN + ZH) | "do not expire and carry no dormancy, service, or maintenance fees, consistent with New York State law… remaining balance stays on the card… not redeemable for cash except where required by law." |
| **Certificate email** (Phase 4 commerce, deferred) | Must repeat: no expiration, no fees, remaining-balance carryover. **TODO when Stripe commerce is built.** |

## Open items before launch
- [ ] Client legal counsel reviews `pages/terms.json` gift-card language (EN + ZH).
- [ ] Re-verify GBL §396-i current text + date the verification here.
- [ ] When Stripe commerce is built (deferred), add the same no-expiry/no-fee disclosure to the
      branded certificate fulfillment email (EN + ZH templates).
