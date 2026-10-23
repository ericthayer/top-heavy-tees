# Top Heavy Tees — custom T-shirt store

A React storefront where shoppers upload their own artwork, place it on a shirt
from stock, check it with an automatic design review, and order through a mock
checkout.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the design check and the reducers
npm run build
```

## Pages

| Route | What it does |
| --- | --- |
| `/` | Hero with a live color preview, how it works, featured shirts, design-check preview |
| `/products` | Catalog with style, color, size and in-stock filters (kept in the URL) and sorting |
| `/products/:id` | Color swatches, front/back views, stock-aware sizes, size guide, add blank or open in the studio |
| `/design-studio` | Upload, place, check, mockups, add to cart |
| `/cart` | Quantities limited by stock, shipping and tax estimate |
| `/checkout` | Validated mock checkout and order confirmation (`?order=FP-…`) |

## Design studio

- **Upload**: PNG, JPG or SVG up to 15 MB, by drag and drop or file picker, with
  progress. SVGs are rasterized at 2400 px so every format uses the same canvas
  pipeline. Three sample files are built in for trying it out.
- **Placement**: an HTML5 canvas editor (`components/studio/DesignCanvas.jsx`).
  Drag to move (snaps to center), drag corners to resize, drag the round handle to
  rotate (snaps to 0/90°, Shift for 15° steps). Arrow keys, `+`/`-` and `[`/`]`
  work too. Presets: center chest, left chest, full front, upper back, full back.
  Front and back each hold their own artwork.
- **Mockups** (`lib/mockup.js`): generated automatically 650 ms after the design
  stops changing. The design is composited between the shirt base and its fabric
  shading, then a knit texture is overlaid. Views: front, back (when printed),
  a 3/4 angled view (the shirt is wrapped around a lit cylinder), and a lifestyle
  flat lay on concrete with a hang tag. Each downloads as a 1200 × 1400 PNG.
- **Design check** (`lib/suggestions.js`): rule-based, no API. It checks:
  - effective DPI at the printed size, with a "shrink to a sharp size" fix
  - contrast between the artwork's color palette and the shirt, suggesting the
    available shirt color with the most contrast
  - solid background boxes, with a one-click flood-fill background remover
  - transparent padding, with a one-click trim
  - placement: out of bounds, off center, small designs better on the left chest,
    sitting too low, accidental tilt, too wide for small sizes
  - file format and size

## Storefront polish

- **Product shots** (`lib/productShots.js`, `components/ProductShot.jsx`): every
  product image is rendered in the browser by the mockup engine (fabric texture,
  studio light, floor shadow), queued one at a time and cached. The vector
  drawing shows instantly and the render fades in over it.
- **Catalog cards** show the back of the shirt on hover.
- **Product pages** have a front, back, angled and flat-lay gallery, shipping
  promises and collapsible details.
- **Cart drawer** (`components/CartDrawer.jsx`) slides in after "Add to cart"
  and from the header, with a free-shipping meter.

## Data and state

- Brand: the "TH" mark lives in `src/components/Logo.jsx` (`LogoMark`, `Wordmark`)
  and `public/top-heavy-logo-icon.svg`; the favicon is the same mark.
- Products, colors, sizes, size guides and print fees: `src/data/products.js`.
  Shirt images are drawn by `lib/shirtSvg.js`, so every style renders in every
  color. The Organic Crew has zero stock to show the out-of-stock state.
- State: React Context + `useReducer` for the cart, design session, inventory and
  toasts. The pure reducers live in `context/*Reducer.js`.
- localStorage: cart, design session (with a smaller copy of each image if the
  original is large), units sold by the mock checkout (subtracted from stock),
  and recent orders.
