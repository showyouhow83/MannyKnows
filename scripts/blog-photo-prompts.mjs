// Photographic banner prompts, one per blog post that still needs an image.
//
// These are written to fight the "AI-generated" look, which comes from five
// things: no camera language, everything too perfect, readable screen text
// (the biggest tell — it's where generators garble letters), studio lighting,
// and posed subjects. Every prompt below names a camera/lens/aperture, asks
// for available light and real wear, keeps screens out of focus, and puts the
// person mid-task rather than smiling at the lens.
//
// Keep the set coherent: available light, muted natural color, shallow depth
// of field, Western Mass settings, people working — as if one photographer
// shot all of them over a season.

export const NEGATIVE =
  'Candid documentary photograph, available light only, visible skin texture, natural grain. ' +
  'Not a stock photo, not CGI, not an illustration, not a 3D render. No logos, no brand names, ' +
  'no readable text anywhere in the image.';

export const prompts = {
  // The five posts whose first banners came from the Gemini web UI. Those read
  // as AI images: rendered interfaces, invented brands, no people. Redone here
  // in the same photographic system as the rest — and it also retires the one
  // that carried a real client's branding on a model who isn't the owner.
  'why-your-website-isnt-bringing-clients':
    'Shot on a Sony A7 IV with a 35mm lens at f/1.8, lamplight only. A woman in her 30s sits on a couch at night in ' +
    'a modest living room, phone held low in one hand, thumb hovering, expression flat and unimpressed — the face ' +
    'of someone about to give up on a page and go back to the search results. Warm lamp on a side table, a mug, a ' +
    'folded throw blanket, TV dark. Her phone screen is angled away from the camera and out of focus. Real living ' +
    'room clutter, natural skin texture, no makeup retouching. Shallow depth of field, muted evening color.',

  'automate-these-five-tasks':
    'Shot on a Canon EOS R6 with a 35mm lens at f/2, available light from a desk lamp. A small-business owner in ' +
    'his 40s sits at a home-office desk late in the evening, retyping details from a stack of paper invoices into ' +
    'a laptop, one finger on the paper to keep his place. Sticky notes on the desk edge, a second pile of receipts, ' +
    'a cold coffee, a phone face-down beside him. Tired but focused, not looking at the camera. The laptop screen ' +
    'is out of focus with nothing readable. Warm pooled lamplight against a dim room, natural grain.',

  'google-business-profile-springfield':
    'Shot on a Fujifilm X-T5 with a 23mm lens at f/2.8, overcast daylight. A shop owner in her 40s stands on the ' +
    'sidewalk directly in front of her small storefront in a New England downtown, arms folded, looking up at her ' +
    'own sign with a considering expression — as if seeing it the way a stranger would. Red brick facades, a ' +
    'parking meter, bare street trees, a few passers-by blurred by motion. Her storefront sign is plain and ' +
    'unlettered. Real texture: worn awning, salt-marked sidewalk, fingerprints on the glass. Documentary framing.',

  'website-that-works-while-you-sleep':
    'Shot on a Canon EOS R5 with a 35mm lens at f/1.4, near-darkness. A man in his 40s asleep in bed, seen from ' +
    'the side across a nightstand, face relaxed and turned into the pillow. On the nightstand, a phone lies ' +
    'face-up, its screen lit with a notification, casting a soft cool glow across a glass of water and a paperback ' +
    'book. Focus on the glowing phone in the foreground; the sleeping figure softly out of focus behind. Nothing ' +
    'readable on the screen. Deep shadows, one small light source, natural grain, no other lighting.',

  'lead-engine-for-contractors':
    'Shot on a Nikon Z6 II with a 35mm lens at f/2, late afternoon light through a windshield. A contractor in his ' +
    '40s sits in the driver\'s seat of his parked work truck, reading something on his phone with a small ' +
    'satisfied smile, a clipboard of estimates on the passenger seat beside him. Plain unbranded work shirt, no ' +
    'logos anywhere on his clothing or the truck. Dusty dashboard, a travel mug in the holder, a tape measure. ' +
    'Warm low sun raking across his face and the dash. The phone screen is tilted away and out of focus.',

  'contractor-leads-without-angi-thumbtack':
    'Shot on a Canon EOS R6 with a 35mm lens at f/2. A painting contractor in his late 40s sits sideways in the ' +
    'open driver\'s door of his work van on a residential street in western Massachusetts, boots on the running ' +
    'board, taking a phone call while writing on a clipboard balanced on his knee. Late afternoon October light, ' +
    'long shadows, bare maples and a clapboard house behind him. His work shirt is wrinkled and flecked with dry ' +
    'paint, hands weathered, van interior cluttered with drop cloths and a coffee cup. He is looking down at the ' +
    'clipboard, not at the camera. Shallow depth of field.',

  'get-more-google-reviews':
    'Shot on a Sony A7 IV with a 50mm lens at f/1.8, natural window light. A Latina salon owner in her 30s stands ' +
    'at the front counter of a small neighborhood salon handing a plain white card to a departing client, both ' +
    'mid-laugh in an unposed moment. Warm daylight from a storefront window; mirrors and styling chairs softly out ' +
    'of focus behind them. A slightly cluttered counter, a card reader, hair clips in a jar, a worn appointment ' +
    'book. Genuine expressions, no retouching. Shallow depth of field.',

  // v2: the first take put a manufacturer badge on the van grille, a brand logo
  // on the jacket, and a second disembodied hand holding a phone in the
  // foreground. Hence: plain unmarked van shot from the side, one person only,
  // nothing in the foreground.
  'local-seo-service-business-map-pack':
    'Shot on a Fujifilm X-T5 with a 23mm lens at f/2.8. Exactly one person in the frame: a plumber in his 50s ' +
    'walking away from his parked white service van on a brick-lined main street of a small western Massachusetts ' +
    'mill town, glancing at his phone, canvas tool bag in his other hand. The van is plain and unmarked, seen from ' +
    'the side — no grille, no badges, no lettering. Plain unbranded work jacket. Overcast late-morning light, red ' +
    'brick storefronts and a church steeple behind him. The phone screen is tilted away from camera and out of ' +
    'focus. Salt-stained van panels, worn knee pads, breath faintly visible in cold air. Nothing in the immediate ' +
    'foreground — no other hands, no second phone. Mid-stride, looking down at the phone.',

  'meet-your-ai-team':
    'Shot on a Canon EOS R5 with a 35mm lens at f/1.8. A small-business owner in her 40s stands in the doorway of ' +
    'her closed shop at night, keys in hand, pausing to glance back at the dark interior before locking up. Street ' +
    'light outside and a warm glow from a single laptop left open on the counter inside. Empty chairs, stacked ' +
    'boxes, a broom against the wall. Her expression is calm and tired, not smiling at the camera. The laptop ' +
    'screen is a soft bloom of light with nothing readable on it. Cool blue night against warm interior light.',

  'online-store-shopify-western-mass':
    'Shot on a Nikon Z6 II with a 35mm lens at f/2.5, natural light from a window. A shop owner in her 30s packs a ' +
    'customer order in the cramped back room of a small retail store, folding a knit sweater into a cardboard ' +
    'mailer, tape gun and packing slips on a scarred wooden work table. Stacked inventory, a rolling rack, a ' +
    'laptop at the edge of the table with its screen turned away and out of focus. Late morning light through a ' +
    'dusty back window, dust visible in the beam. Her hands are the focus, mid-fold.',

  'small-business-website-cost-western-mass':
    'Shot on a Leica Q2 with a 28mm lens at f/2. Two people sit across from each other in a booth at a small New ' +
    'England diner: a business owner in his 50s in a work jacket, and a younger woman with a notebook, reviewing a ' +
    'single printed page between them. Coffee mugs, a pen, a folded newspaper. Morning light through a window with ' +
    'condensation, warm interior tones. He is pointing at the page; she is listening, mid-sentence. The page is ' +
    'angled so its content is not readable.',

  'stop-losing-customers-missed-calls':
    'Shot on a Canon EOS R6 with a 24mm lens at f/2.8, available light plus a work lamp. Low-angle view under a ' +
    'kitchen sink: an electrician\'s hands and forearms working a wrench on a pipe inside the cabinet, while just ' +
    'outside the cabinet on the tile floor his phone lies face-up, screen lit with an incoming call, ignored. ' +
    'Focus on the phone in the foreground; hands and cabinet softly out of focus behind. The phone screen glows ' +
    'but nothing on it is readable. Scuffed tile, a dropped rag, dust, scratched phone case.',

  'why-ai-isnt-working-for-your-business':
    'Shot on a Sony A7 IV with a 40mm lens at f/2, available light through venetian blinds. A business owner in ' +
    'his 40s sits at a cluttered back-office desk, leaning back with arms crossed, looking skeptically at an open ' +
    'laptop he has clearly stopped using. Sticky notes curling off the monitor edge, a printed spreadsheet, a cold ' +
    'cup of coffee, a filing cabinet with a jammed drawer. Grey afternoon light casting soft stripes. His ' +
    'expression is unconvinced, not theatrical — someone who tried something and put it down. Muted color.',

  // Aug 2026 medical cluster (the retired /websites-for-* pages became posts).
  // Same photographic system: one person mid-task, plain unbranded scrubs,
  // screens out of focus, nothing readable.
  'websites-for-dental-medical-practices':
    'Shot on a Sony A7 IV with a 35mm lens at f/1.8, available light only. Exactly one person in the frame: a ' +
    'dental front-desk coordinator in her 40s, in plain unbranded scrubs, standing at the reception counter of a ' +
    'small dental office in a western Massachusetts town at the end of the day, phone receiver tucked between ear ' +
    'and shoulder while she checks a paper appointment book with a pen. Late-afternoon light from a front window ' +
    'falls across the counter; the empty waiting room behind her is soft and out of focus, a few chairs, a plant, ' +
    'a wall clock without readable numbers. The desktop monitor beside her is angled away and unreadable. Real ' +
    'detail: a jar of pens, a stack of clipboards, a box of tissues, fingerprints on the counter glass, natural ' +
    'skin texture, no retouching. She is looking down at the book, not at the camera. Muted natural color, ' +
    'shallow depth of field, natural grain.',

  'dental-website-cost':
    'Shot on a Sony A7 IV with a 35mm lens at f/2, available light from a north-facing window. A dental practice ' +
    'office manager in her 40s sits at the front-desk computer of a small New England dental office after the ' +
    'last patient has left, one hand on a printed vendor proposal, the other resting on a calculator, brow ' +
    'slightly furrowed as she compares figures. Reception counter with a stack of new-patient forms, a plain ' +
    'appointment book, a coffee mug, a small potted plant, operatory door ajar in the background. The monitor is ' +
    'angled away and out of focus; the papers show only blurred columns, nothing readable. Plain unbranded ' +
    'scrubs, natural skin texture, no retouching. Late-afternoon light, muted color, shallow depth of field, ' +
    'natural grain.',

  'ai-agent-for-medical-practices':
    'Shot on a Sony A7 IV with a 35mm lens at f/1.8, available light only. Exactly one person in the frame: a ' +
    'dental front-desk receptionist in her 40s, plain scrubs with no logo, standing behind an empty reception ' +
    'counter at closing time, keys in one hand, reaching to switch off a desk lamp. Behind her the waiting room ' +
    'is dark, chairs empty, blinds half-drawn against blue dusk. On the counter, a phone with its handset in the ' +
    'cradle and a monitor turned slightly away, its screen a soft glow, nothing readable. Her expression is tired ' +
    'and unposed, eyes on the lamp, not the camera. Real wear: a coffee ring on the counter, a pen cup, a scuffed ' +
    'mouse pad, a stack of unbranded intake folders. Warm lamplight against cool window light, shallow depth of ' +
    'field, natural grain.',

  // v2: the first take put a car with a maker badge and a plate in the frame.
  // Hence: no vehicles at all, the street stays empty behind her.
  'dentist-near-me-local-seo-springfield':
    'Shot on a Fujifilm X-T5 with a 33mm lens at f/1.8, overcast daylight. A woman in her 30s stands on the ' +
    'sidewalk outside a small brick medical office building in a Western Massachusetts town, phone in one hand, ' +
    'looking up from the screen at the building entrance as if checking that this is the right door. Winter ' +
    'coat, tote bag on her shoulder, a puddle and salt marks on the pavement, a bare tree and an empty street ' +
    'behind her, no vehicles anywhere in the frame, red brick and a plain glass door with no lettering. Her phone screen is tilted away and out of ' +
    'focus, nothing readable. Natural skin texture, muted New England color, shallow depth of field, documentary ' +
    'framing, no signage anywhere.',

  // v3: takes one and two both put a laptop lid with a maker's logo in the
  // frame, whatever the prompt said. Hence: no laptop at all, phone only.
  'daycare-website-that-fills-enrollment':
    'Shot on a Sony A7 IV with a 35mm lens at f/1.8, lamplight only. A mother in her early 30s sits at a small ' +
    'kitchen table at night in a modest New England apartment, no computer anywhere in the frame, a phone in one ' +
    'hand, scrolling with a tired, deliberating expression, the other hand resting on a mug, a few printed ' +
    'sheets and a pen on the table. Behind her, softly out of focus, a high chair with a bib draped over it and a ' +
    'few toys on the floor, no child in the frame. Warm pooled light from a single pendant over the table, the ' +
    'rest of the room dim. The phone screen is angled away and out of focus with nothing readable. Real clutter, natural skin texture, no ' +
    'retouching. Shallow depth of field, muted evening color, natural grain.',
};

export const buildPrompt = (slug) => {
  const body = prompts[slug];
  if (!body) throw new Error(`No prompt for "${slug}". Known: ${Object.keys(prompts).join(', ')}`);
  return `${body} ${NEGATIVE}`;
};
