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
};

export const buildPrompt = (slug) => {
  const body = prompts[slug];
  if (!body) throw new Error(`No prompt for "${slug}". Known: ${Object.keys(prompts).join(', ')}`);
  return `${body} ${NEGATIVE}`;
};
