import { shirtDataUrl } from '../lib/shirtSvg.js';

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const COLORS = {
  white: { id: 'white', name: 'White', hex: '#FFFFFF' },
  heather: { id: 'heather', name: 'Heather grey', hex: '#B8BBC1' },
  black: { id: 'black', name: 'Black', hex: '#1C1C20' },
  navy: { id: 'navy', name: 'Navy', hex: '#1F2A48' },
  red: { id: 'red', name: 'Cherry red', hex: '#C42E3B' },
  royal: { id: 'royal', name: 'Royal blue', hex: '#2B50B3' },
  forest: { id: 'forest', name: 'Forest', hex: '#2E5A45' },
  sand: { id: 'sand', name: 'Sand', hex: '#D8C6A3' },
  maroon: { id: 'maroon', name: 'Maroon', hex: '#682031' },
  pink: { id: 'pink', name: 'Petal pink', hex: '#F3B9C8' },
  mustard: { id: 'mustard', name: 'Mustard', hex: '#D6A137' },
  sage: { id: 'sage', name: 'Sage', hex: '#A7B79C' },
};

export const STYLE_LABELS = {
  crew: 'Crew neck',
  vneck: 'V-neck',
  boxy: 'Boxy',
  longsleeve: 'Long sleeve',
  ringer: 'Ringer',
  pocket: 'Pocket',
  tank: 'Tank',
};

/** Print fees added to a shirt's base price, per printed side. */
export const PRINT_FEES = { front: 8, back: 6 };
export const XXL_UPCHARGE = 2;

/** Garment measurements in inches: chest width (pit to pit) and body length. */
export const SIZE_GUIDES = {
  classic: {
    label: 'Classic fit',
    rows: { S: [18, 28], M: [20, 29], L: [22, 30], XL: [24, 31], XXL: [26, 32] },
  },
  boxy: {
    label: 'Boxy fit',
    rows: { S: [21, 26.5], M: [23, 27.5], L: [25, 28.5], XL: [27, 29.5], XXL: [29, 30.5] },
  },
  slim: {
    label: 'Slim fit',
    rows: { S: [17.5, 27.5], M: [19.5, 28.5], L: [21.5, 29.5], XL: [23.5, 30.5], XXL: [25.5, 31.5] },
  },
  tank: {
    label: 'Tank fit',
    rows: { S: [17, 27], M: [19, 28], L: [21, 29], XL: [23, 30], XXL: [25, 31] },
  },
};

const RAW_PRODUCTS = [
  {
    id: 'everyday-crew',
    name: 'Everyday Crew',
    style: 'crew',
    fit: 'classic',
    price: 22,
    colors: ['white', 'black', 'heather', 'navy', 'red', 'royal', 'forest'],
    stock: { S: 24, M: 40, L: 36, XL: 18, XXL: 9 },
    featured: true,
    fabric: '100% ring-spun cotton, 5.3 oz',
    summary: 'A mid-weight crew with a classic fit.',
    description:
      'Our most-printed shirt. Soft ring-spun cotton that holds ink well, a ribbed collar that keeps its shape, and side seams so it hangs straight after washing.',
  },
  {
    id: 'heavyweight-box',
    name: 'Heavyweight Box Tee',
    style: 'boxy',
    fit: 'boxy',
    price: 32,
    colors: ['black', 'white', 'sand', 'forest', 'maroon', 'sage'],
    stock: { S: 6, M: 14, L: 12, XL: 8, XXL: 3 },
    featured: true,
    fabric: '100% combed cotton, 7.5 oz',
    summary: 'Thick cotton, dropped shoulders, wide body.',
    description:
      'Structured cotton with a dense knit, dropped shoulders and a shorter, wider body. The thick collar stays flat, and large prints sit smooth across the front.',
  },
  {
    id: 'soft-vneck',
    name: 'Soft V-Neck',
    style: 'vneck',
    fit: 'slim',
    price: 26,
    colors: ['heather', 'black', 'navy', 'pink', 'white'],
    stock: { S: 6, M: 5, L: 2, XL: 3, XXL: 0 },
    featured: false,
    fabric: '50% polyester, 25% cotton, 25% rayon',
    summary: 'Tri-blend jersey with a slim fit.',
    description:
      'Light tri-blend jersey that drapes instead of boxing out. A shallow V and a slim cut. Prints take on a soft, slightly vintage look on this fabric.',
  },
  {
    id: 'long-sleeve-crew',
    name: 'Long Sleeve Crew',
    style: 'longsleeve',
    fit: 'classic',
    price: 30,
    colors: ['white', 'black', 'navy', 'heather', 'forest'],
    stock: { S: 10, M: 18, L: 16, XL: 10, XXL: 4 },
    featured: true,
    fabric: '100% cotton, 6.1 oz',
    summary: 'Mid-weight cotton with ribbed cuffs.',
    description:
      'The Everyday Crew with full-length sleeves and ribbed cuffs. Warm enough for spring evenings, light enough to layer under a jacket.',
  },
  {
    id: 'retro-ringer',
    name: 'Retro Ringer',
    style: 'ringer',
    fit: 'classic',
    price: 27,
    colors: ['white', 'heather', 'sand', 'red', 'navy'],
    stock: { S: 7, M: 12, L: 9, XL: 4, XXL: 2 },
    featured: true,
    fabric: '100% cotton, 5.5 oz',
    summary: 'Contrast collar and sleeve bands.',
    description:
      'A crew with ribbed bands in a contrasting color at the collar and sleeves. Light shirts get navy bands, dark shirts get off-white bands.',
  },
  {
    id: 'pocket-tee',
    name: 'Pocket Tee',
    style: 'pocket',
    fit: 'classic',
    price: 25,
    colors: ['white', 'black', 'heather', 'mustard', 'navy', 'sage'],
    stock: { S: 8, M: 15, L: 13, XL: 7, XXL: 5 },
    featured: false,
    fabric: '100% ring-spun cotton, 5.3 oz',
    summary: 'A chest pocket on the left side.',
    description:
      'The Everyday Crew with a sewn-on chest pocket. Small designs look good just above or beside the pocket; large designs print over it.',
  },
  {
    id: 'muscle-tank',
    name: 'Muscle Tank',
    style: 'tank',
    fit: 'tank',
    price: 21,
    colors: ['white', 'black', 'heather', 'red', 'royal'],
    stock: { S: 9, M: 12, L: 10, XL: 6, XXL: 0 },
    featured: false,
    fabric: '100% cotton, 4.5 oz',
    summary: 'Sleeveless, with deep armholes.',
    description:
      'Light cotton with deep armholes and a scoop neck. The print area is a little narrower than on our tees: 10 by 15 inches.',
  },
  {
    id: 'organic-crew',
    name: 'Organic Crew',
    style: 'crew',
    fit: 'classic',
    price: 28,
    colors: ['sand', 'white', 'sage', 'black'],
    stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    featured: false,
    fabric: '100% certified organic cotton, 5.5 oz',
    summary: 'Organic cotton, classic fit.',
    description:
      'Grown without synthetic pesticides and knit in a certified mill. Same fit as the Everyday Crew with a slightly heavier hand. Restocking soon.',
  },
];

// Placeholder images are generated from the shirt renderer in each product's
// first color.
export const PRODUCTS = RAW_PRODUCTS.map((p) => ({
  ...p,
  image: shirtDataUrl({ style: p.style, color: COLORS[p.colors[0]].hex }),
}));

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function totalStock(product) {
  return Object.values(product.stock).reduce((a, b) => a + b, 0);
}

export function unitPrice(product, size, sides = []) {
  const print = sides.reduce((sum, s) => sum + (PRINT_FEES[s] ?? 0), 0);
  return product.price + (size === 'XXL' ? XXL_UPCHARGE : 0) + print;
}
