## Clinic Starter Packs

These seed packs are designed for fast cloning of medical clinic sites.

- `starter-basic.json`: Small clinic launch baseline.
- `starter-pro.json`: Expanded clinic operations baseline.

### How to use

1. Create site and user in admin first.
2. Import site/content/media in safe order (`missing` mode first).
3. Open the seed file and copy the objects into:
   - `content/<siteId>/<locale>/site.json`
   - `content/<siteId>/<locale>/navigation.json`
   - `content/<siteId>/<locale>/header.json`
   - `content/<siteId>/<locale>/footer.json`
   - `content/<siteId>/<locale>/seo.json`
   - `content/<siteId>/booking/services.json`
   - `content/<siteId>/booking/settings.json`
4. Re-run content import for that site.

### Notes

- Packs are intentionally template-safe (no personal PII).
- Keep locale pair aligned with project defaults (`en`, `zh`).
- For production, validate domain/locale/user mappings in admin and DB.
