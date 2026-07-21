# buddytile.com

Customer-facing site for **Buddy Tile** — a registered trade name of Buddy Built LLC.

The rule: the customer sees the brand they hired; the machinery runs on Buddy Built.
This site is the Buddy Tile brand surface. Leads post into the Buddy Built platform
CRM (`buddybuilt.com/api/public/leads`, division: Buddy Tile). The platform lives in
the separate [buddybuilt](https://github.com/stanessy/buddybuilt) repo.

## Stack

Zero-dependency static site generator: `node build.js` renders `src/data.js`
(all copy/services/cities) through `build.js` templates into `site/` —
HTML with per-page meta, canonical, OpenGraph, JSON-LD (LocalBusiness/Service),
sitemap.xml, robots.txt. Fonts and images are self-hosted. Deploy = serve `site/`.

- `npm run build` — regenerate `site/`
- `npm run preview` — build + serve at http://localhost:4300

## Before launch

- Replace `WA reg #PENDING · OR CCB #PENDING` in `src/data.js` (legally required in ads)
- Confirm phone number + hello@buddytile.com mailbox exist
- Point buddytile.com DNS at the static host; keep `pay.buddytile.com` / `book.buddytile.com`
  reserved as CNAMEs so printed links never expose vendors
- Google Business Profile for Buddy Tile + submit sitemap.xml in Search Console
