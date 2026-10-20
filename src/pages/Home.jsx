import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ShirtImage from '../components/ShirtImage.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { SuggestionCard } from '../components/studio/SuggestionCard.jsx';
import { COLORS, PRODUCTS } from '../data/products.js';
import { getPrintArea } from '../lib/shirtSvg.js';
import { SUNRISE_DATA_URL } from '../lib/samples.js';

const HERO_COLORS = ['white', 'heather', 'royal', 'red', 'forest', 'black'];

const STEPS = [
  { title: 'Upload your artwork', text: 'PNG, JPG or SVG up to 15 MB. Transparent PNGs and SVGs give the cleanest edges.' },
  { title: 'Place it on a shirt', text: 'Drag, resize and rotate it on the front or back of any style we have in stock.' },
  { title: 'Check the mockup', text: 'The studio flags anything that won’t print well and shows your shirt from three angles.' },
  { title: 'We print and ship', text: 'Each shirt is printed to order within two business days, then ships in 3–5.' },
];

const EXAMPLES = [
  {
    id: 'ex-res',
    severity: 'error',
    title: 'Your image may appear pixelated at this size',
    detail: 'At 10 in wide it prints at about 72 DPI. Aim for 150 or more.',
    action: { label: 'Shrink to 4.8 in wide' },
  },
  {
    id: 'ex-contrast',
    severity: 'warning',
    title: 'Dark design on a dark shirt',
    detail: 'About 70% of your artwork is close to navy in tone, so it will be hard to see.',
    action: { label: 'Switch to Heather grey' },
  },
  {
    id: 'ex-place',
    severity: 'tip',
    title: 'Center chest placement works best for this design size',
    detail: 'It’s 1.4 in off center. Designs this wide look balanced when centered.',
    action: { label: 'Center it' },
  },
];

export default function Home() {
  const [colorId, setColorId] = useState('white');
  const featured = PRODUCTS.filter((p) => p.featured).slice(0, 4);
  const heroDesign = useMemo(() => {
    const pa = getPrintArea('crew', 'front');
    const w = pa.w * 0.8;
    return { href: SUNRISE_DATA_URL, cx: pa.x + pa.w / 2, cy: pa.y + pa.h * 0.06 + w / 2, w, h: w, rotation: 0 };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          {/* Top-heavy stack: the first line is big and heavy, the second small and light. */}
          <h1 className="hero__title">
            <span className="hero__tier hero__tier--top">Wear what</span>
            <span className="hero__tier hero__tier--base">you made.</span>
          </h1>
          <p className="hero__lede">
            Top Heavy Tees prints your artwork on shirts we keep in stock. Upload a design, place it, and see a realistic mockup before
            you order. Every shirt is printed one at a time and ships in 3–5 business days.
          </p>
          <div className="hero__ctas">
            <Link className="btn btn--primary btn--lg" to="/design-studio">
              Start designing
            </Link>
            <Link className="btn btn--outline btn--lg" to="/products">
              Browse shirts
            </Link>
          </div>
        </div>
        <figure className="hero__stage">
          <div className="hero__shirt">
            <ShirtImage
              style="crew"
              color={COLORS[colorId].hex}
              design={heroDesign}
              loading="eager"
              alt={`Everyday Crew in ${COLORS[colorId].name} with a sunrise badge printed on the chest`}
            />
          </div>
          <figcaption className="hero__caption">
            <span>
              Everyday Crew in <strong>{COLORS[colorId].name.toLowerCase()}</strong>
            </span>
            <span className="hero__swatches" role="group" aria-label="Preview shirt color">
              {HERO_COLORS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`dot dot--lg${id === colorId ? ' is-active' : ''}`}
                  style={{ '--chip': COLORS[id].hex }}
                  aria-label={COLORS[id].name}
                  aria-pressed={id === colorId}
                  onClick={() => setColorId(id)}
                />
              ))}
            </span>
          </figcaption>
        </figure>
      </section>

      <section className="section steps" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="section__title">
          How it works
        </h2>
        <ol className="steps__list">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__num" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="step__title">{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="featured-heading">
        <div className="section__head">
          <h2 id="featured-heading" className="section__title">
            Shirts in stock
          </h2>
          <Link to="/products" className="text-link">
            See all {PRODUCTS.length} styles
          </Link>
        </div>
        <div className="product-grid product-grid--four">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="check-band" aria-labelledby="check-band-heading">
        <div className="check-band__inner">
          <div className="check-band__copy">
            <h2 id="check-band-heading">The studio checks your file as you work</h2>
            <p>
              Low resolution, a background box, a design that disappears into the fabric: the studio spots these before you pay, explains each
              one in plain language, and fixes most of them in one click.
            </p>
            <Link to="/design-studio" className="btn btn--light btn--lg">
              Try it with your artwork
            </Link>
          </div>
          <ul className="suggestions check-band__examples" aria-label="Example suggestions">
            {EXAMPLES.map((s) => (
              <SuggestionCard key={s.id} s={s} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
