// All site content in one place — copy, services, cities, SEO strings.
// The customer sees Buddy Tile; Buddy Built is the chassis (see footer legal line).

const SITE = {
  name: 'Buddy Tile',
  domain: 'https://buddytile.com',
  tagline: 'Built for Your Home.',
  phone: process.env.BT_PHONE || '(360) 899-6336',
  email: 'hello@buddytile.com',
  // Platform API — the lead form posts straight into the Buddy Built CRM
  apiBase: 'https://buddybuilt.com',
  tileDivisionId: 1,
  accent: '#F6B015',
  navy: '#1C2E44',
  legalLine:
    'Buddy Tile is a registered trade name of Buddy Built LLC · WA reg #PENDING · OR CCB #PENDING',
  serviceAreaBlurb: 'Serving Vancouver, Portland, and the surrounding metro — Washington and Oregon.',
};

const SERVICES = [
  {
    slug: 'shower-remodel',
    name: 'Custom Tile Showers',
    h1: 'Custom Tile Shower Remodels',
    metaTitle: 'Custom Tile Shower Remodel | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Custom tile showers built right: Schluter waterproofing, curbless options, niches, benches, and glass. Free in-home estimates in Vancouver WA and Portland OR.',
    intro:
      'The shower is the hardest room in the house to get right — and the most expensive to get wrong. We build tile showers on proper waterproofing systems, not shortcuts: full Schluter or equivalent membranes, flood-tested pans, and tile set to TCNA standards.',
    bullets: [
      'Schluter / HydroBan waterproofing with flood test before tile',
      'Curbless and walk-in conversions',
      'Niches, benches, corner shelves, grab bars — planned before demo, not after',
      'Linear or center drains, heated floors, glass enclosures coordinated',
      'Demo to done in days, with daily progress photos to your phone',
    ],
    photo: 'hero-shower.jpg',
  },
  {
    slug: 'bathroom-tile',
    name: 'Bathroom Floor & Wall Tile',
    h1: 'Bathroom Floor & Wall Tile Installation',
    metaTitle: 'Bathroom Tile Installation | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Bathroom floor and wall tile installed flat, level, and sealed — large format, mosaics, and natural stone. Free estimates in Vancouver WA and Portland OR.',
    intro:
      'Bathroom tile lives in the wettest room in the house. We prep the substrate properly — self-leveling, uncoupling membranes where they belong — so your floor stays flat and your grout lines stay tight for decades.',
    bullets: [
      'Large-format porcelain, mosaics, and natural stone',
      'Substrate prep: self-level, Ditra, crack isolation',
      'Heated floor systems installed under the tile',
      'Baseboard, trim, and transitions finished clean',
    ],
    photo: 'work-full-bath.jpg',
  },
  {
    slug: 'kitchen-backsplash',
    name: 'Kitchen Backsplashes',
    h1: 'Kitchen Backsplash Installation',
    metaTitle: 'Kitchen Backsplash Installation | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Kitchen backsplashes installed in a day or two — subway, herringbone, zellige, and stone, with clean outlets and tight scribes. Free estimates.',
    intro:
      "A backsplash is the fastest way to change how a kitchen feels, and the easiest place to spot sloppy work. Our installers cut around outlets and windows so tight you'd think the tile grew there.",
    bullets: [
      'Subway, herringbone, stacked, zellige, mosaic — any pattern',
      'Outlets, windows, and hood scribes cut clean',
      'Most backsplashes done in 1–2 days',
      'Grout and sealant matched to your counters',
    ],
    photo: 'craft-setting.jpg',
  },
  {
    slug: 'heated-floors',
    name: 'Heated Tile Floors',
    h1: 'Heated Tile Floor Installation',
    metaTitle: 'Heated Tile Floors | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Electric radiant heat under new tile floors — programmable thermostats, even heat, no cold bathroom mornings. Installed with the tile in one project.',
    intro:
      "In the Northwest, a heated bathroom floor is the upgrade people say they'd do again first. We install electric radiant systems under the tile as one project — mat, thermostat, and floor — so there's one crew and one warranty.",
    bullets: [
      'Electric radiant mats sized to your room',
      'Programmable / smart thermostats',
      'Installed with membrane systems, not under them wrong',
      'Adds comfort and resale value for a modest add-on cost',
    ],
    photo: 'floor-tile.jpg',
  },
  {
    slug: 'waterproofing',
    name: 'Shower Waterproofing',
    h1: 'Shower Waterproofing Done Right',
    metaTitle: 'Shower Waterproofing (Schluter, Kerdi, HydroBan) | Buddy Tile',
    metaDescription:
      'Waterproofing is the part of a shower you never see and can never skip. Schluter Kerdi, GoBoard, and HydroBan systems installed and flood-tested.',
    intro:
      "Tile and grout are not waterproof — the membrane behind them is. Most shower failures we're called to fix were tiled beautifully over nothing. We build the system: membrane, pan, drain, seams, and a flood test before a single tile goes up.",
    bullets: [
      'Schluter Kerdi, GoBoard, HydroBan — matched to your build',
      'Flood-tested pans before tile, every time',
      'Fix-it work: we diagnose and rebuild failed showers',
      'Documentation and photos of the membrane before it disappears behind tile',
    ],
    photo: 'craft-tile-hands.jpg',
  },
  {
    slug: 'tile-repair',
    name: 'Tile Repair & Regrouting',
    h1: 'Tile Repair, Regrouting & Recaulking',
    metaTitle: 'Tile Repair & Regrouting | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Cracked tile, failing grout, moldy caulk — small tile problems fixed before they become water damage. Honest assessments, fast scheduling.',
    intro:
      "Not every job is a remodel. Cracked tiles, crumbling grout, and failed caulk let water where it shouldn't go — and small fixes now prevent subfloor surgery later. We'll tell you honestly whether it's a repair or a rebuild.",
    bullets: [
      'Single-tile replacement with color-matched grout',
      'Regrouting and recaulking wet areas',
      'Loose / hollow tile diagnosis',
      'Straight answers: repair when it can be, rebuild when it must be',
    ],
    photo: 'work-glass-shower.jpg',
  },
];

const CITIES = [
  { slug: 'vancouver', name: 'Vancouver', state: 'WA', blurb: 'Our home base. Same-week estimates across Clark County — Salmon Creek, Felida, Cascade Park, Camas, and Ridgefield.' },
  { slug: 'portland', name: 'Portland', state: 'OR', blurb: 'Full service across Portland — from Craftsman bathrooms in Sellwood to condo showers in the Pearl.' },
  { slug: 'beaverton', name: 'Beaverton', state: 'OR', blurb: 'Bathroom remodels and backsplashes across Beaverton, Cedar Hills, and Aloha.' },
  { slug: 'gresham', name: 'Gresham', state: 'OR', blurb: 'Serving Gresham, Troutdale, and Fairview with the same crews and the same standard.' },
  { slug: 'hillsboro', name: 'Hillsboro', state: 'OR', blurb: 'Tile work for Hillsboro and Orenco — fast scheduling for occupied homes.' },
  { slug: 'salem', name: 'Salem', state: 'OR', blurb: 'Weekly routes to Salem and Keizer — book ahead and we bundle your neighborhood.' },
];

const STEPS = [
  { title: 'Request an estimate', body: 'Two minutes online or one phone call. Tell us the room and what you have in mind.' },
  { title: 'In-home estimate, priced on the spot', body: 'We measure, sketch your Tile Plan, and price it before we leave — no "we\'ll get back to you."' },
  { title: 'Approve from your phone', body: 'Your estimate arrives by email. Review the scope and approve online in one tap — or sign a paper copy if you prefer.' },
  { title: 'We build it', body: 'Licensed crews, daily progress photos, and a final walkthrough you sign off on. The invoice only comes after you\'re happy.' },
];

const TRUST = [
  { title: 'Family Owned & Operated', body: 'A local family company — the owner answers the phone, not a call center.' },
  { title: 'Craftsmanship Guaranteed', body: 'Tile set to TCNA standards over flood-tested waterproofing — and we photograph the work you never see.' },
  { title: 'Free In-Home Estimates', body: 'Priced on the spot, approved online.' },
  { title: 'No Card Fees. Ever.', body: 'Pay however you like — we never add a processing fee.' },
  { title: 'Licensed, Bonded & Insured', body: 'Registered in Washington and Oregon.' },
  { title: 'One Warranty. One Number.', body: 'A Buddy Built company — the warranty outlives any one crew.' },
];

// Ballpark calculator pricing — customer-facing RANGES, derived from the price
// book. A ballpark is not an estimate: real numbers come from the in-home visit.
const BALLPARK = {
  disclaimerShort: 'Ballpark only — not a quote. Every bathroom hides surprises; your real number comes from a free in-home estimate.',
  projects: [
    {
      key: 'shower',
      label: 'Tile shower (walls + pan)',
      unit: 'shower size',
      sizes: [
        { key: 'small', label: 'Small (tub-to-shower, ~60 SF)', base: 620000 },
        { key: 'medium', label: 'Medium (walk-in, ~85 SF)', base: 820000 },
        { key: 'large', label: 'Large / curbless (~110+ SF)', base: 1050000 },
      ],
    },
    {
      key: 'floor',
      label: 'Bathroom floor tile',
      unit: 'square feet',
      perSqftCents: 1600,
      minCents: 90000,
    },
    {
      key: 'backsplash',
      label: 'Kitchen backsplash',
      unit: 'square feet',
      perSqftCents: 2800,
      minCents: 75000,
    },
  ],
  extras: [
    { key: 'niche', label: 'Recessed niche', cents: 27500 },
    { key: 'bench', label: 'Built-in bench', cents: 60000 },
    { key: 'heated', label: 'Heated floor', cents: 96600 },
    { key: 'glass', label: 'Glass shower door', cents: 180000 },
    { key: 'demo', label: 'Demo & haul away existing', cents: 63000 },
  ],
  premiumTileMultiplier: 1.18, // large format / stone bumps labor + materials
  rangeLow: 0.9,
  rangeHigh: 1.2,
};

module.exports = { SITE, SERVICES, CITIES, STEPS, TRUST, BALLPARK };
