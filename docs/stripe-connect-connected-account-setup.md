# Stripe Connect Setup (Create Connected Account Later)

This guide is for creating a Stripe connected account for a client (example: Spa Paradise) so Checkout branding and fees are separated per client.

## Why This Setup

- Each client gets their own Stripe branding on Checkout.
- Fees and payment activity are separated by connected account.
- Platform account (Baam/Harmonia) can stay unchanged.

## Current Code Expectation

The app already supports Connect routing with:

- Platform secret key (`STRIPE_SECRET_KEY`) for API calls
- Per-site connected account id (for Spa Paradise):
  - `STRIPE_CONNECTED_ACCOUNT_ID_SPA_PARADISE=acct_...`

Checkout sessions are created on the connected account when that env var is present.

## Part A: Sandbox/Test Setup First

1. In Stripe dashboard, switch to **Sandbox/Test mode**.
2. Go to **Connect**.
3. Choose business model: **Platform**.
4. Connected account type: **Standard**.
5. Create a test connected account.
6. Open that test account and set profile/branding (name/logo/colors) if you want test checkout branding to match client branding.
7. Copy the test connected account id (`acct_...`).

### Local test env values

Use real test values (not placeholders):

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # optional for checkout UI test, required for webhook flow test
STRIPE_CONNECTED_ACCOUNT_ID_SPA_PARADISE=acct_...
```

Then restart dev server and test checkout.

## Part B: Live Setup (When Ready)

1. Switch Stripe to **Live mode**.
2. Go to **Connect -> Accounts -> Create account**.
3. Choose:
   - Business model: **Platform**
   - Account type: **Standard**
4. Invite/create Spa Paradise live connected account.
5. Complete live onboarding (KYC, business info, bank account).
6. In that connected account, configure:
   - Business/public name (Spa Paradise)
   - Logo and brand color
   - Statement descriptor
7. Copy live connected account id (`acct_...`).

## SpaParadise Onboarding Checklist (Info Needed)

Use this when preparing SpaParadise for Stripe Standard connected account onboarding.

- **Business legal info**
  - Legal business name
  - DBA name (if different)
  - Business address
  - Business phone
  - Business website
  - Business type (LLC/corp/sole proprietor)
  - EIN (or local tax id)
- **Owner/representative identity info**
  - Full legal name
  - Date of birth
  - Home address
  - Email and phone
  - SSN (Stripe may request last 4 or full, depending on verification)
- **Bank payout details**
  - Account holder name (must match legal entity/owner)
  - Account type (checking/savings)
  - Routing number (ACH)
  - Account number
  - Bank country/currency (US / USD)
- **Possible verification docs (if Stripe asks)**
  - Government-issued ID
  - Business registration documents
  - Bank statement or voided check

### Security Best Practice

- Do **not** collect full bank details in your own forms or docs.
- Send Stripe onboarding link and let SpaParadise enter details directly in Stripe.

## Production Env

Set in production deployment environment:

```bash
STRIPE_CONNECTED_ACCOUNT_ID_SPA_PARADISE=acct_live_or_standard_connected_id
```

Keep platform key as your main Stripe secret key:

```bash
STRIPE_SECRET_KEY=sk_live_...
```

## Webhook Requirements (Live)

Your Stripe webhook endpoint should receive these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `charge.dispute.created`

Also make sure connected account events are included for the endpoint (not only platform account events).

## Quick Go-Live Checklist

- [ ] Connect enabled in live account
- [ ] Spa Paradise live connected account created and fully onboarded
- [ ] Spa Paradise branding configured in connected account
- [ ] `STRIPE_CONNECTED_ACCOUNT_ID_SPA_PARADISE` set in production env
- [ ] Live webhook configured with required events
- [ ] Deployed app with latest code
- [ ] One low-value real payment tested end-to-end
- [ ] Refund test confirms freeze/refund hook behavior

## Notes

- Gift cards currently work without Stripe Price IDs (inline `price_data` flow).
- Do not mix test keys with live connected account ids, or live keys with test connected account ids.
- Rotate exposed keys immediately if any secret values were accidentally shared in screenshots or chat.
