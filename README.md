# Portsmouth Scaffolding Landing Page (Static)

A mobile-first, GitHub Pages-compatible lead-generation site for erected scaffolding quotes.

## Files
- `index.html` — landing page + quote form
- `thank-you.html` — confirmation page
- `privacy.html` / `terms.html` — legal pages
- `assets/styles.css` — styling
- `assets/app.js` — all config, validation, tracking capture, submission logic
- `robots.txt` / `sitemap.xml` — basic SEO crawl files

## Deploy on GitHub Pages
1. Push this repo to GitHub.
2. In **Settings → Pages**, select branch (`main` or your branch) and root folder (`/`).
3. Save and wait for publish.
4. Update `https://example.com` placeholders in:
   - `index.html` canonical URL
   - `robots.txt`
   - `sitemap.xml`

## Edit business config (phone, radius, webhook)
Open `assets/app.js` and edit the `CONFIG` object at the top:
- `BUSINESS_NAME`
- `PHONE_NUMBER_DISPLAY`
- `PHONE_NUMBER_TEL`
- `WHATSAPP_NUMBER`
- `SERVICE_RADIUS_MILES`
- `WEBHOOK_URL`
- `TOWER_HIRE_ALLOWED`
- `SHOW_BADGES`

## Webhook setup
- Set `WEBHOOK_URL` in `assets/app.js` to your Make/Zapier/webhook endpoint.
- Payload is JSON and includes:
  - Form fields
  - `photos` metadata (name/size/type)
  - attribution: `utm_*`, `gclid`, `referrer`, `landing_page_url`, `timestamp`
- If `WEBHOOK_URL` is blank, form falls back to a `mailto:` draft for manual handling.

## Local testing
From repo root:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

Test checklist:
- Valid UK phone and postcode are required.
- Postcode auto-formats to uppercase spaced format.
- Tower hire-only = `Yes` blocks submission when `TOWER_HIRE_ALLOWED` is `false`.
- Honeypot (`company`) must stay empty.
- Second submit within 30 seconds is blocked.
- Up to 3 images preview correctly.
- Success redirects to `/thank-you.html`.

## Billable lead definition (recommended)
A lead is billable when all conditions are met:
1. In service area (Portsmouth + configured radius).
2. Valid UK phone number.
3. Enquiry is for **erected scaffolding** (not tower hire-only).
4. Timeframe selected (not blank).

You can enforce/score this logic downstream in your webhook automation before selling or dispatching.
