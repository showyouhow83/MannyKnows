# public/art

Drop **`astronaut-rocket.png`** here — a transparent PNG, ~1000px wide is plenty.

It renders automatically as the floating hero mascot (top-right of the hero).
See `src/components/sections/HeroSection.astro` → `.astronaut-mascot`
(CSS `background-image: url('/art/astronaut-rocket.png')`), so until the file
exists nothing shows — no broken image. Add the file and it appears; adjust
size/position via the `.astronaut-mascot` rule.
