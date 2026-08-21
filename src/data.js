// All site content in one place, copy, services, cities, SEO strings.
// The customer sees Buddy Tile; Buddy Built is the chassis (see footer legal line).

const SITE = {
  name: 'Buddy Tile',
  domain: 'https://buddytile.com',
  tagline: 'Built for Your Home.',
  phone: process.env.BT_PHONE || '(360) 899-6336',
  email: 'info@buddytile.com',
  // Platform API, the lead form posts straight into the Buddy Built CRM
  apiBase: 'https://buddybuilt.com',
  tileDivisionId: 1,
  accent: '#F6B015',
  navy: '#1C2E44',
  // Acorn Finance dealer pre-qual link (blocks iframing, always open a new tab)
  acornUrl: 'https://www.acornfinance.com/pre-qualify/?d=2T7C4&utm_medium=web_pre_qual_link_copy_welcome',
  legalLine:
    'Buddy Tile is a registered trade name of Buddy Built LLC · WA reg #BUDDYBL746MO · OR CCB #PENDING',
  serviceAreaBlurb: 'Serving Vancouver, Portland, and the surrounding metro, Washington and Oregon.',
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
      'The shower is the hardest room in the house to get right, and the most expensive to get wrong. We build tile showers on proper waterproofing systems, not shortcuts: full Schluter or equivalent membranes, flood-tested pans, and tile set to TCNA standards.',
    bullets: [
      'Schluter / HydroBan waterproofing with flood test before tile',
      'Curbless and walk-in conversions',
      'Niches, benches, corner shelves, grab bars, planned before demo, not after',
      'Linear or center drains, heated floors, glass enclosures coordinated',
      'Demo to done in days, with daily progress photos to your phone',
    ],
    faqs: [
      { q: 'How much does a custom tile shower cost in Vancouver WA?', a: 'Most full tile showers run $6,200-$10,500 for labor and waterproofing, depending on size and features like niches, benches, or curbless entries. Tub-to-shower conversions start around $5,600. Finish tile is priced with your selections, and your written in-home estimate is free.' },
      { q: 'How long does a shower remodel take?', a: 'Most showers run 5-8 working days from demo to grout: tear-out, waterproofing with a flood test, tile, then grout and seal. We protect the path to the room and vacuum the site every night.' },
      { q: 'Do you use Schluter waterproofing?', a: 'Yes, every shower gets a full membrane system (Schluter Kerdi, GoBoard, or HydroBan), a flood-tested pan, and photos of the waterproofing before tile covers it.' },
      { q: 'Can you convert my tub to a walk-in shower?', a: 'That is one of our most common projects. We remove the tub, rebuild the wet area with proper waterproofing, and tile a walk-in or curbless shower, usually within a week.' },
    ],
    photo: 'real-tile-shower.jpg',
  },
  {
    slug: 'bathroom-tile',
    name: 'Bathroom Floor & Wall Tile',
    h1: 'Bathroom Floor & Wall Tile Installation',
    metaTitle: 'Bathroom Tile Installation | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Bathroom floor and wall tile installed flat, level, and sealed, large format, mosaics, and natural stone. Free estimates in Vancouver WA and Portland OR.',
    intro:
      'Bathroom tile lives in the wettest room in the house. We prep the substrate properly, self-leveling, uncoupling membranes where they belong, so your floor stays flat and your grout lines stay tight for decades.',
    bullets: [
      'Large-format porcelain, mosaics, and natural stone',
      'Substrate prep: self-level, Ditra, crack isolation',
      'Heated floor systems installed under the tile',
      'Baseboard, trim, and transitions finished clean',
    ],
    faqs: [
      { q: 'How much does bathroom floor tile cost installed?', a: 'Figure roughly $16 per square foot for labor and prep on most bathroom floors, with a $900 minimum, a typical hall bath floor lands between $900 and $1,600 before tile selection. Heated floor systems add about $950.' },
      { q: 'Can you install large-format tile?', a: 'Yes, large format is most of what we set. It needs flatter substrates, so we self-level and use uncoupling membranes where the floor calls for it.' },
      { q: 'Do you level the floor first?', a: 'Every floor gets checked with a straightedge before tile. If it needs self-leveler or crack isolation, that goes in your estimate up front, not as a surprise later.' },
    ],
    photo: 'real-bathroom-tile.jpg',
  },
  {
    slug: 'kitchen-backsplash',
    name: 'Kitchen Backsplashes',
    h1: 'Kitchen Backsplash Installation',
    metaTitle: 'Kitchen Backsplash Installation | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Kitchen backsplashes installed in a day or two, subway, herringbone, zellige, and stone, with clean outlets and tight scribes. Free estimates.',
    intro:
      "A backsplash is the fastest way to change how a kitchen feels, and the easiest place to spot sloppy work. Our installers cut around outlets and windows so tight you'd think the tile grew there.",
    bullets: [
      'Subway, herringbone, stacked, zellige, mosaic, any pattern',
      'Outlets, windows, and hood scribes cut clean',
      'Most backsplashes done in 1-2 days',
      'Grout and sealant matched to your counters',
    ],
    faqs: [
      { q: 'How much does a kitchen backsplash cost?', a: 'Most backsplashes run $28 per square foot for labor with a $750 minimum, a typical 30 sq ft kitchen lands between $750 and $1,100 before tile selection. Zellige, mosaics, and pattern layouts price slightly higher.' },
      { q: 'How long does a backsplash take?', a: 'Most kitchens are done in 1-2 days: set day one, grout day two. You keep your kitchen usable the whole time.' },
      { q: 'Do I need to buy the tile?', a: 'Either way works. Bring your own tile, or we supply it with your selections, the estimate shows both clearly.' },
    ],
    photo: 'real-kitchen-backsplash.jpg',
  },
  {
    slug: 'heated-floors',
    name: 'Heated Tile Floors',
    h1: 'Heated Tile Floor Installation',
    metaTitle: 'Heated Tile Floors | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Electric radiant heat under new tile floors, programmable thermostats, even heat, no cold bathroom mornings. Installed with the tile in one project.',
    intro:
      "In the Northwest, a heated bathroom floor is the upgrade people say they'd do again first. We install electric radiant systems under the tile as one project, mat, thermostat, and floor, so there's one crew and one warranty.",
    bullets: [
      'Electric radiant mats sized to your room',
      'Programmable / smart thermostats',
      'Installed with membrane systems, not under them wrong',
      'Adds comfort and resale value for a modest add-on cost',
    ],
    faqs: [
      { q: 'How much does a heated tile floor cost to add?', a: 'Adding electric radiant heat to a bathroom floor we are already tiling typically runs about $950-$1,400 including the thermostat, depending on room size.' },
      { q: 'How much does a heated floor cost to run?', a: 'A typical bathroom mat draws about as much as a hair dryer while warming up, and a programmable thermostat only runs it when you use the room. Most homeowners see a few dollars a month.' },
      { q: 'Can you add heat under my existing tile?', a: 'The mat has to go under the tile, so heat gets added when a floor is being redone, which is why we always ask about it before a floor project starts.' },
    ],
    photo: 'herringbone-tile-floor-portland-or.jpg',
  },
  {
    slug: 'waterproofing',
    name: 'Shower Waterproofing',
    h1: 'Shower Waterproofing Done Right',
    metaTitle: 'Shower Waterproofing (Schluter, Kerdi, HydroBan) | Buddy Tile',
    metaDescription:
      'Waterproofing is the part of a shower you never see and can never skip. Schluter Kerdi, GoBoard, and HydroBan systems installed and flood-tested.',
    intro:
      "Tile and grout are not waterproof. The membrane behind them is. Most shower failures we're called to fix were tiled beautifully over nothing. We build the system: membrane, pan, drain, seams, and a flood test before a single tile goes up.",
    bullets: [
      'Schluter Kerdi, GoBoard, HydroBan, matched to your build',
      'Flood-tested pans before tile, every time',
      'Fix-it work: we diagnose and rebuild failed showers',
      'Documentation and photos of the membrane before it disappears behind tile',
    ],
    faqs: [
      { q: 'How do I know if my shower is leaking behind the tile?', a: 'Soft baseboards, a musty smell, cracked or dark grout lines, and hollow-sounding tile are the common signs. We diagnose honestly. Sometimes it is a $400 regrout, sometimes the pan has failed.' },
      { q: 'Is grout waterproof?', a: 'No, grout and tile both pass moisture. The membrane behind them does the waterproofing, which is why we photograph and flood-test it before tile ever goes up.' },
      { q: 'Can you fix just the shower pan?', a: 'Sometimes. If the wall membrane is sound we can rebuild the pan alone. If the system behind the walls has failed, we will show you the evidence and price the honest fix.' },
    ],
    photo: 'craft-tile-hands.jpg',
  },
  {
    slug: 'tile-repair',
    name: 'Tile Repair & Regrouting',
    h1: 'Tile Repair, Regrouting & Recaulking',
    metaTitle: 'Tile Repair & Regrouting | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Cracked tile, failing grout, moldy caulk, small tile problems fixed before they become water damage. Honest assessments, fast scheduling.',
    intro:
      "Not every job is a remodel. Cracked tiles, crumbling grout, and failed caulk let water where it shouldn't go, and small fixes now prevent subfloor surgery later. We'll tell you honestly whether it's a repair or a rebuild.",
    bullets: [
      'Single-tile replacement with color-matched grout',
      'Regrouting and recaulking wet areas',
      'Loose / hollow tile diagnosis',
      'Straight answers: repair when it can be, rebuild when it must be',
    ],
    faqs: [
      { q: 'How much does regrouting a shower cost?', a: 'Most shower regrouts run $550-$900: we grind out the old grout, regrout, and re-caulk the changes of plane. It is the most cost-effective way to make a tired shower look rebuilt.' },
      { q: 'Can you match my existing grout color?', a: 'Usually, yes. We carry samples of the major grout lines and match against a cleaned section of your existing grout so the repair disappears.' },
      { q: 'Can you replace one cracked tile?', a: 'If you have a spare tile or we can source a match, single-tile replacement with color-matched grout is a routine visit.' },
    ],
    photo: 'marble-tile-shower-glass-door.jpg',
  },
  {
    slug: 'tub-to-shower',
    name: 'Tub-to-Shower Conversions',
    h1: 'Tub-to-Shower Conversion',
    metaTitle: 'Tub to Shower Conversion | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Swap the tub nobody uses for a tiled walk-in shower, demo, waterproofing, tile, and glass handled by one crew, usually inside a week. Free estimates.',
    intro:
      "Most families use the tub a handful of times a year and the shower every day. A conversion trades that wasted tub for a walk-in tile shower with real waterproofing, done by one crew, usually inside a week.",
    bullets: [
      'Tub out, walk-in tile shower in, one crew, one warranty',
      'Full membrane waterproofing with a flood-tested pan',
      'Low-curb and curbless options for easy entry',
      'Glass doors, niches, benches, and grab bars planned in',
      'Most conversions finish in 5-7 working days',
    ],
    faqs: [
      { q: 'How much does a tub-to-shower conversion cost?', a: 'Most conversions run $5,600-$7,400 for demo, waterproofing, pan, and wall tile, before finish tile selection. Glass doors add roughly $1,800 installed.' },
      { q: 'Does removing a tub hurt resale value?', a: 'Agents generally want at least one tub in the house. If you have a second bathroom with a tub, converting the primary to a walk-in shower usually helps, not hurts.' },
      { q: 'How long is my bathroom out of commission?', a: 'Plan on 5-7 working days from demo to first shower. We seal off the room, protect your floors, and clean up every night.' },
    ],
    photo: 'tile-shower-remodel-vancouver-wa.jpg',
  },
  {
    slug: 'walk-in-shower',
    name: 'Walk-In & Curbless Showers',
    h1: 'Walk-In & Curbless Shower Installation',
    metaTitle: 'Walk-In & Curbless Showers | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Curbless, walk-in tile showers built on linear drains and proper slopes, beautiful now, accessible forever. Free in-home design and estimate.',
    intro:
      'A curbless shower is the upgrade that looks high-end today and keeps working for you decades from now. Getting one right is all below the tile: recessed pans, correct slopes, linear drains, and waterproofing that extends past the glass.',
    bullets: [
      'True curbless entries with recessed, flood-tested pans',
      'Linear drains and one-direction slopes done right',
      'Bench seating, niches, and grab-bar blocking planned in',
      'Aging-in-place friendly without looking clinical',
    ],
    faqs: [
      { q: 'How much does a curbless shower cost?', a: 'Curbless builds typically run $7,400-$10,500 for labor and waterproofing depending on size, the recessed pan and drain work price above a standard curb shower. Your written estimate is free.' },
      { q: 'Do curbless showers leak?', a: 'Not when the pan is recessed and sloped correctly with the membrane carried out past the glass line. That is exactly the part we photograph and flood-test before tile.' },
      { q: 'Is a curbless shower good for aging in place?', a: 'It is the single best bathroom investment for staying in your home: zero threshold, optional bench and grab bars, and nothing that looks like a hospital.' },
    ],
    photo: 'real-walkin-shower.jpg',
  },
  {
    slug: 'shower-regrout',
    name: 'Shower Regrouting',
    h1: 'Shower Regrouting & Recaulking',
    metaTitle: 'Shower Regrouting | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Keep your tile. We grind out the failing grout and regrout the whole shower. A freshly remodeled look for a fraction of a remodel price. Free estimates.',
    intro:
      "If your tile is sound but the grout is dark, cracked, or crumbling, you don't need a remodel. You need a regrout. We grind the old grout out, regrout the field, and re-caulk every change of plane. The shower reads brand-new at a fraction of remodel cost.",
    bullets: [
      'Old grout ground out, not smeared over',
      'Fresh grout, color of your choice, sealed',
      'Silicone re-caulked at corners, curb, and glass',
      'Done in a day or two, shower back in service fast',
      'Honest assessment first: if the problem is behind the tile, we tell you',
    ],
    faqs: [
      { q: 'How much does shower regrouting cost?', a: 'Most full shower regrouts run $550-$900 including re-caulking. Compare that to a $6,000+ remodel, when the tile and waterproofing are sound, regrouting is the smart money.' },
      { q: 'How do I know if I need regrouting or a new shower?', a: 'Cracked or powdery grout with solid, well-bonded tile usually means regrout. Hollow-sounding tile, soft walls, or recurring mold point deeper. We check honestly before quoting either way.' },
      { q: 'How long does regrouting take?', a: 'Most showers take one to two days, and you can usually shower again 24 hours after we seal.' },
    ],
    photo: 'craft-tile-hands.jpg',
  },
  {
    slug: 'grout-cleaning',
    name: 'Grout Cleaning & Sealing',
    h1: 'Grout Deep Cleaning & Sealing',
    metaTitle: 'Grout Cleaning & Sealing | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Machine deep-cleaning, stain treatment, and penetrating sealer for tile floors and showers, the most cost-effective way to make tile look new again.',
    intro:
      "Years of mopping push dirt into grout and leave it gray no matter what you scrub with. Our machine deep-clean pulls the grime back out, treats stains, and locks the result in with a penetrating sealer, the single most cost-effective spruce-up in the book.",
    bullets: [
      'Machine extraction cleaning, not a mop and hope',
      'Stain treatment for oil, rust, and organic marks',
      'Penetrating sealer so it stays clean longer',
      'Floors, showers, backsplashes, and entryways',
      'No demo, no dust, done in a day',
    ],
    faqs: [
      { q: 'How much does grout cleaning and sealing cost?', a: 'Most jobs land around $950, with a typical range of $750-$1,200 depending on the square footage and how many rooms we treat. Machine deep-cleaning, stain treatment, and penetrating sealer are all included, still the cheapest way to make a tiled room look new.' },
      { q: 'Will cleaning fix discolored grout?', a: 'Usually dramatically. Where stains are permanent, we can apply a color-seal that restores a uniform tone, or quote a regrout if the grout is failing rather than just dirty.' },
      { q: 'How often should grout be sealed?', a: 'High-traffic floors every 1-2 years; showers roughly every year. Sealed grout wipes clean instead of absorbing.' },
    ],
    photo: 'bathroom-tile-remodel-vancouver-wa.jpg',
  },
  {
    slug: 'floor-tile',
    name: 'Tile Floor Installation',
    h1: 'Tile Floor Installation',
    metaTitle: 'Tile Floor Installation | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Kitchen, entry, laundry, and bathroom tile floors installed flat and hollow-free, self-leveling, uncoupling membranes, and clean transitions. Free estimates.',
    intro:
      "Floors take the most abuse of any tile in the house: carts, dogs, dropped pans, wet boots. We prep the substrate like it matters, because it does: self-leveler where the floor dips, uncoupling membrane where it moves, and layout planned so the cuts land where you'll never see them.",
    bullets: [
      'Kitchens, entries, laundry rooms, mudrooms, and baths',
      'Self-leveling and crack-isolation prep included in the quote',
      'Large format, herringbone, and pattern layouts',
      'Heated floor systems added while the floor is open',
      'Clean transitions to wood, carpet, and LVP',
    ],
    faqs: [
      { q: 'How much does tile floor installation cost?', a: 'Labor and prep run about $16 per square foot on most floors with a $900 minimum, a 60 sq ft entry lands near $1,000, a 120 sq ft kitchen near $2,000, before tile selection.' },
      { q: 'Can you tile over my existing floor?', a: 'Sometimes over sound concrete or existing tile; never over floating floors. We check the substrate at the estimate and put the honest prep in writing.' },
      { q: 'What tile is best for entryways and mudrooms?', a: 'Porcelain with a textured finish. It shrugs off water, grit, and dog claws. We will bring samples rated for exactly that abuse.' },
    ],
    photo: 'real-floor-tile.jpg',
  },
  {
    slug: 'fireplace-tile',
    name: 'Fireplace Tile Surrounds',
    h1: 'Fireplace Tile & Stone Surrounds',
    metaTitle: 'Fireplace Tile Surround | Vancouver WA & Portland OR | Buddy Tile',
    metaDescription:
      'Fireplace surrounds in tile and stone, from dated brick to a modern floor-to-ceiling feature wall, built with heat-rated materials. Free estimates.',
    intro:
      "The fireplace is the wall everyone looks at. We take dated brick and 90s tile to floor-to-ceiling stone, large-format porcelain, or handmade tile, set with heat-rated materials and details that hold up to real fires.",
    bullets: [
      'Floor-to-ceiling feature walls and classic surrounds',
      'Large-format porcelain, stacked stone, zellige, and marble',
      'Heat-rated setting materials around fireboxes',
      'Hearths, mantels, and TV niches coordinated',
      'Most surrounds finish in 2-4 days',
    ],
    faqs: [
      { q: 'How much does a tile fireplace surround cost?', a: 'Classic surrounds start around $1,200; floor-to-ceiling feature walls typically run $2,500-$4,500 in labor depending on height and material, before tile selection.' },
      { q: 'Can you tile over a brick fireplace?', a: 'Usually yes, sound brick takes a scratch coat or backer and then tile or stone directly, which is far cleaner than demolition.' },
      { q: 'Is it safe to tile around a wood stove or firebox?', a: 'With heat-rated setting materials and correct clearances, yes. We follow the manufacturer clearances for your specific insert or stove.' },
    ],
    photo: 'craft-setting.jpg',
  },
];

const CITIES = [
  { slug: 'vancouver', name: 'Vancouver', state: 'WA', neighborhoods: ['Salmon Creek', 'Felida', 'Cascade Park', 'Fishers Landing', 'Hazel Dell', 'Camas', 'Ridgefield', 'Battle Ground'], blurb: 'Our home base. Same-week estimates across Clark County, Salmon Creek, Felida, Cascade Park, Camas, and Ridgefield.' },
  { slug: 'portland', name: 'Portland', state: 'OR', neighborhoods: ['Sellwood', 'the Pearl', 'Alberta', 'St. Johns', 'Mt. Tabor', 'Multnomah Village'], blurb: 'Full service across Portland, from Craftsman bathrooms in Sellwood to condo showers in the Pearl.' },
  { slug: 'beaverton', name: 'Beaverton', state: 'OR', neighborhoods: ['Cedar Hills', 'Aloha', 'Raleigh Hills', 'Sexton Mountain'], blurb: 'Bathroom remodels and backsplashes across Beaverton, Cedar Hills, and Aloha.' },
  { slug: 'gresham', name: 'Gresham', state: 'OR', neighborhoods: ['Troutdale', 'Fairview', 'Wood Village', 'Powell Valley'], blurb: 'Serving Gresham, Troutdale, and Fairview with the same crews and the same standard.' },
  { slug: 'hillsboro', name: 'Hillsboro', state: 'OR', neighborhoods: ['Orenco', 'Tanasbourne', 'Jackson School', 'Reedville'], blurb: 'Tile work for Hillsboro and Orenco, fast scheduling for occupied homes.' },
  { slug: 'salem', name: 'Salem', state: 'OR', neighborhoods: ['Keizer', 'South Salem', 'West Salem', 'Four Corners'], blurb: 'Weekly routes to Salem and Keizer, book ahead and we bundle your neighborhood.' },
];

// How you'll be treated, the emotional core of the pitch. Every line is a
// promise about the homeowner's experience, not a feature.
const PROMISE = [
  {
    title: "We protect your home like it's ours",
    body: 'Floor runners from the front door to the work, dust walls up before demo starts, and a vacuumed job site every single night. You live here. We never forget that.',
  },
  {
    title: "You'll never wonder what's happening",
    body: "Daily progress photos land on your phone, including the waterproofing you'd otherwise never see. No chasing your contractor for updates. Ever.",
  },
  {
    title: 'Your budget is safe with us',
    body: "A written price before we start, and it doesn't move unless you change the plan. No surprise invoices, no card fees, no games.",
  },
  {
    title: "We're not done until you smile",
    body: "You walk the finished room with your crew lead, and the invoice only comes after you've signed off happy. That's the order it should happen in.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Our shower was the room I was embarrassed of. Now it's the first thing I show people. The crew covered every floor, cleaned up every night, and sent photos while I was at work.",
    name: 'Rachel M.',
    where: 'Vancouver, WA',
  },
  {
    quote:
      "They flood-tested the pan and sent me a photo of the waterproofing before the tile went on. That's when I knew we'd hired the right people.",
    name: 'Dan & Priya K.',
    where: 'Camas, WA',
  },
  {
    quote:
      'Herringbone backsplash, two days, cuts so clean the tile looks like it grew there. They treated my kitchen better than I do.',
    name: 'Steve T.',
    where: 'Beaverton, OR',
  },
];

const STEPS = [
  { title: 'Request an estimate', body: 'Two minutes online or one phone call. Tell us the room and what you have in mind.' },
  { title: 'In-home visit, same-day estimate', body: 'We measure and sketch your Tile Plan in your bathroom, and your written estimate lands in your inbox the same day.' },
  { title: 'Approve from your phone', body: 'Your estimate arrives by email. Review the scope and approve online in one tap, or sign a paper copy if you prefer.' },
  { title: 'We build it', body: 'Licensed crews, daily progress photos, and a final walkthrough you sign off on. The invoice only comes after you\'re happy.' },
];

const TRUST = [
  { title: 'Family Owned & Operated', body: 'You talk to the owner, not a call center, and the person who quotes your job knows the crew who builds it by name.' },
  { title: 'Craftsmanship Guaranteed', body: 'Tile set to TCNA standards over flood-tested waterproofing, and we photograph the work you never see.' },
  { title: 'Free In-Home Estimates', body: 'Your written estimate the same day, approved online.' },
  { title: 'No Card Fees. Ever.', body: 'Pay however you like. We never add a processing fee.' },
  { title: 'Licensed, Bonded & Insured', body: 'Registered in Washington and Oregon.' },
  { title: 'One Warranty. One Number.', body: 'A Buddy Built company, the warranty outlives any one crew.' },
];

// Ballpark calculator pricing, customer-facing RANGES, derived from the price
// book. A ballpark is not an estimate: real numbers come from the in-home visit.
const BALLPARK = {
  disclaimerShort: 'Not a final quote. Your exact price comes from a free in-home estimate.',
  laborOnly: 'Finish materials (tile, grout, fixtures) not included since they depend on your selections.',
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
  // Every tile job books at least two days (set, come back, grout), small
  // jobs never quote below this, in-house or sub.
  jobMinCents: 250000,
};

// "Design Your Shower" configurator, sell-side rates mirroring the platform
// catalog (cost x 1.10). Ranges shown to homeowners are rate x 0.9-1.15.
const DESIGNER = {
  rates: { fixedCents: 297000, wallCents: 3300, floorCents: 6600 },
  features: [
    { key: 'niche', label: 'Recessed Niche', cents: 55000, img: '/assets/img/catalog/niche.svg', excludes: 'niche2' },
    { key: 'niche2', label: 'Double Niche', cents: 99000, img: '/assets/img/catalog/niche.svg', excludes: 'niche' },
    { key: 'bench', label: 'Built-in Bench', cents: 55000, img: '/assets/img/catalog/bench.svg' },
    { key: 'shelf', label: 'Floating Shelf', cents: 27500, img: '/assets/img/catalog/corner-shelf.svg' },
    { key: 'curbless', label: 'Curbless Entry', cents: 60500, img: '/assets/img/catalog/curbless.svg' },
    { key: 'glass', label: 'Glass Door Install', cents: 88000, img: '/assets/img/catalog/curb.svg' },
    { key: 'heated', label: 'Heated Floor', cents: 132000, img: '/assets/img/catalog/heated.svg' },
    { key: 'rain', label: 'Rain Shower Head', cents: 27500, img: '/assets/img/catalog/rain.svg' },
    { key: 'trim', label: 'Schluter\u00ae Trim', cents: 27500, img: '/assets/img/catalog/trim.svg' },
    { key: 'grout', label: 'Epoxy Grout', cents: 22000, img: '/assets/img/catalog/grout.svg' },
  ],
  patternUpgradeCents: 33000, // herringbone / vertical layouts
  mosaicFloorCents: 22000,
  // Scope pricing: "just tile" excludes demo/dump/valve work (the fixed
  // component), so it's honestly much cheaper; "more than tile" carries the
  // full fixed scope plus a complexity bump.
  tileOnlyFixedCents: 60000,
  complexMultiplier: 1.2,
  // Broad public range, a ballpark, not a quote
  rangeLo: 0.75,
  rangeHi: 1.4,
  // Full bathroom remodel from-prices (sell side, platform catalog x1.1)
  remodel: { baseCents: 1650000, sizes: { small: 0.8, standard: 1, large: 1.4 } },
};

module.exports = { SITE, SERVICES, CITIES, STEPS, TRUST, PROMISE, TESTIMONIALS, BALLPARK, DESIGNER };
