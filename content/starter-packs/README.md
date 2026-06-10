# Clinic Starter Packs

This folder provides reusable seed packs for new medical clinic clients.

- `starter-basic.json`: small local clinic setup.
- `starter-pro.json`: expanded clinic operations setup.

## How to use

1. Create the new site in admin (`/admin/sites`) with the target `siteId`.
2. Create users in admin (`/admin/users`) and assign roles/sites.
3. Copy the selected pack's booking/services/settings values into:
   - `content/<siteId>/booking/services.json`
   - `content/<siteId>/booking/settings.json`
4. Import bookings/settings/services from JSON via:
   - `POST /api/admin/booking/import` (or use admin button).
5. Run content import in safe mode (`missing`) and validate routes `/en` and `/zh`.

These packs are intentionally content-light and operations-heavy, so each clinic can customize pages while keeping a proven operations baseline.
