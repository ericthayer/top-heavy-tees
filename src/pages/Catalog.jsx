import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { COLORS, PRODUCTS, SIZES, STYLE_LABELS } from '../data/products.js';
import { useInventory } from '../context/InventoryContext.jsx';
import { CloseIcon } from '../components/Icons.jsx';

const SORTS = {
  featured: 'Featured',
  'price-asc': 'Price, low to high',
  'price-desc': 'Price, high to low',
  name: 'Name',
};

const ALL_STYLES = [...new Set(PRODUCTS.map((p) => p.style))];
const ALL_COLORS = Object.keys(COLORS).filter((id) => PRODUCTS.some((p) => p.colors.includes(id)));

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { totalOf, stockOf } = useInventory();

  const styles = params.get('style')?.split(',').filter(Boolean) ?? [];
  const color = params.get('color') ?? '';
  const size = params.get('size') ?? '';
  const inStock = params.get('instock') === '1';
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'featured';

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || (Array.isArray(value) && !value.length)) next.delete(key);
    else next.set(key, Array.isArray(value) ? value.join(',') : value);
    setParams(next, { replace: true });
  };

  const toggleStyle = (s) => set('style', styles.includes(s) ? styles.filter((x) => x !== s) : [...styles, s]);
  const activeCount = styles.length + (color ? 1 : 0) + (size ? 1 : 0) + (inStock ? 1 : 0);

  const results = useMemo(() => {
    const list = PRODUCTS.filter(
      (p) =>
        (!styles.length || styles.includes(p.style)) &&
        (!color || p.colors.includes(color)) &&
        (!size || stockOf(p.id, size) > 0) &&
        (!inStock || totalOf(p.id) > 0),
    );
    const byStock = (a, b) => (totalOf(a.id) === 0) - (totalOf(b.id) === 0);
    const sorters = {
      featured: (a, b) => byStock(a, b) || b.featured - a.featured,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [...list].sort(sorters[sort]);
  }, [styles, color, size, inStock, sort, stockOf, totalOf]);

  return (
    <div className="catalog">
      <div className="catalog__head">
        <div>
          <h1 className="page-title">Shirts</h1>
          <p className="page-lede">
            Every style below is stocked and ready to print. Pick one to see sizes and colors, or open it in the design studio.
          </p>
        </div>
        <div className="catalog__tools">
          <button type="button" className="btn btn--outline filters-toggle" aria-expanded={filtersOpen} aria-controls="filters" onClick={() => setFiltersOpen((o) => !o)}>
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
          <label className="sort">
            <span className="field-label">Sort</span>
            <span className="select">
              <select value={sort} onChange={(e) => set('sort', e.target.value === 'featured' ? '' : e.target.value)}>
                {Object.entries(SORTS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>
      </div>

      <div className="catalog__body">
        <aside id="filters" className={`filters${filtersOpen ? ' is-open' : ''}`} aria-label="Filters">
          <fieldset className="filter-group">
            <legend>Style</legend>
            {ALL_STYLES.map((s) => (
              <label key={s} className="check">
                <input type="checkbox" checked={styles.includes(s)} onChange={() => toggleStyle(s)} />
                <span>{STYLE_LABELS[s]}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend>Color</legend>
            <div className="filter-colors">
              {ALL_COLORS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`dot dot--lg${color === id ? ' is-active' : ''}`}
                  style={{ '--chip': COLORS[id].hex }}
                  aria-pressed={color === id}
                  aria-label={COLORS[id].name}
                  title={COLORS[id].name}
                  onClick={() => set('color', color === id ? '' : id)}
                />
              ))}
            </div>
            {color && <p className="filter-note">{COLORS[color].name}</p>}
          </fieldset>

          <fieldset className="filter-group">
            <legend>Size in stock</legend>
            <div className="filter-sizes">
              {SIZES.map((s) => (
                <button key={s} type="button" className="chip-btn" aria-pressed={size === s} onClick={() => set('size', size === s ? '' : s)}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="check toggle-row">
            <input type="checkbox" checked={inStock} onChange={(e) => set('instock', e.target.checked ? '1' : '')} />
            <span>Hide out-of-stock styles</span>
          </label>

          {activeCount > 0 && (
            <button type="button" className="link-btn" onClick={() => setParams({}, { replace: true })}>
              <CloseIcon size={16} />
              Clear all filters
            </button>
          )}
        </aside>

        <section className="catalog__results" aria-labelledby="results-count">
          <p id="results-count" className="results-count" aria-live="polite">
            {results.length} {results.length === 1 ? 'style' : 'styles'}
          </p>
          {results.length ? (
            <div className="product-grid">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <p>No shirts match these filters.</p>
              <button type="button" className="btn btn--outline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
