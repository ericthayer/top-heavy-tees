import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ProductShot from '../components/ProductShot.jsx';
import { ClockIcon, TruckIcon } from '../components/Icons.jsx';
import Swatches from '../components/Swatches.jsx';
import SizePicker from '../components/SizePicker.jsx';
import QtyStepper from '../components/QtyStepper.jsx';
import SizeGuideButton from '../components/SizeGuide.jsx';
import ProductCard from '../components/ProductCard.jsx';
import NotFound from './NotFound.jsx';
import { COLORS, PRODUCTS, SIZES, STYLE_LABELS, PRINT_FEES, getProduct, unitPrice } from '../data/products.js';
import { getPrintArea } from '../lib/shirtSvg.js';
import { money } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useInventory } from '../context/InventoryContext.jsx';
import { useDesign } from '../context/DesignContext.jsx';

const VIEWS = [
  { id: 'front', label: 'Front', side: 'front', view: 'studio' },
  { id: 'back', label: 'Back', side: 'back', view: 'studio' },
  { id: 'angled', label: 'Angled', side: 'front', view: 'angled' },
  { id: 'flatlay', label: 'Flat lay', side: 'front', view: 'flatlay' },
];

export default function ProductDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const product = getProduct(id);
  const navigate = useNavigate();
  const { add, openDrawer } = useCart();
  const { availableOf, totalOf } = useInventory();
  const { dispatch } = useDesign();

  const initialColor = product?.colors.includes(params.get('color')) ? params.get('color') : product?.colors[0];
  const [colorId, setColorId] = useState(initialColor);
  const [viewId, setViewId] = useState('front');
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    setColorId(product.colors.includes(params.get('color')) ? params.get('color') : product.colors[0]);
    setSize(['M', 'L', 'S', 'XL', 'XXL'].find((s) => availableOf(product.id, s) > 0) ?? null);
    setQty(1);
    setViewId('front');
    // Reset only when navigating to a different product.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return <NotFound title="We couldn’t find that shirt" text="It may have been renamed or removed from the catalog." />;

  const color = COLORS[colorId];
  const view = VIEWS.find((v) => v.id === viewId) ?? VIEWS[0];
  const out = totalOf(product.id) === 0;
  const available = size ? availableOf(product.id, size) : 0;
  const area = getPrintArea(product.style, 'front');
  const related = PRODUCTS.filter((p) => p.id !== product.id && totalOf(p.id) > 0).slice(0, 4);

  const addBlank = () => {
    add({
      productId: product.id,
      name: product.name,
      style: product.style,
      colorId,
      colorName: color.name,
      size,
      qty,
      unitPrice: unitPrice(product, size),
      custom: null,
    });
    openDrawer();
    setQty(1);
  };

  const customize = () => {
    dispatch({ type: 'setProduct', productId: product.id, colorId });
    if (size) dispatch({ type: 'setSize', size });
    navigate('/design-studio');
  };

  return (
    <div className="pdp">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/products">Shirts</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp__grid">
        <div className="pdp__gallery">
          <div className="pdp__stage">
            <ProductShot
              style={product.style}
              color={color.hex}
              side={view.side}
              view={view.view}
              width={1200}
              alt={`${product.name} in ${color.name}, ${view.label.toLowerCase()} view`}
            />
            {out && <span className="badge badge--out badge--lg">Out of stock</span>}
          </div>
          <div className="pdp__views" role="group" aria-label="Views">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" className="pdp__view" aria-pressed={viewId === v.id} onClick={() => setViewId(v.id)}>
                <ProductShot style={product.style} color={color.hex} side={v.side} view={v.view} width={240} alt="" />
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pdp__info">
          <p className="pdp__style">{STYLE_LABELS[product.style]}</p>
          <h1 className="pdp__name">{product.name}</h1>
          <p className="pdp__price">
            {money(product.price)} <span>blank, plus {money(PRINT_FEES.front)} per printed side</span>
          </p>
          <p className="pdp__desc">{product.description}</p>

          <Swatches colorIds={product.colors} value={colorId} onChange={setColorId} name="pdp-color" legend="Color" />

          <SizePicker
            value={size}
            onChange={setSize}
            stockFor={(s) => availableOf(product.id, s)}
            name="pdp-size"
            extra={<SizeGuideButton fit={product.fit} />}
          />

          {out ? (
            <div className="notice notice--warn">
              <p>
                <strong>Out of stock in every size.</strong> We’re restocking soon. You can still try designs on it in the studio.
              </p>
            </div>
          ) : (
            <div className="pdp__buy">
              <QtyStepper value={qty} onChange={setQty} max={Math.max(1, available)} />
              <button type="button" className="btn btn--outline btn--lg" onClick={addBlank} disabled={!size || available < qty}>
                Add blank to cart
              </button>
            </div>
          )}

          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={customize}>
            Design this shirt
          </button>
          <p className="pdp__hint">Opens the design studio with {color.name.toLowerCase()} selected.</p>

          <ul className="promises">
            <li>
              <TruckIcon size={20} />
              Free standard shipping over $75
            </li>
            <li>
              <ClockIcon size={20} />
              Printed within two business days
            </li>
          </ul>

          <div className="accordion">
            <details open>
              <summary>Details</summary>
              <dl className="spec-list">
                <div>
                  <dt>Fabric</dt>
                  <dd>{product.fabric}</dd>
                </div>
                <div>
                  <dt>Fit</dt>
                  <dd>{product.fit[0].toUpperCase() + product.fit.slice(1)}</dd>
                </div>
                <div>
                  <dt>Print area</dt>
                  <dd>
                    {area.inchesW} × {area.inchesH} in, front and back
                  </dd>
                </div>
                <div>
                  <dt>Sizes</dt>
                  <dd>{SIZES.join(', ')} (XXL +$2)</dd>
                </div>
                <div>
                  <dt>Care</dt>
                  <dd>Machine wash cold, inside out. Tumble dry low.</dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>Printing</summary>
              <p>
                Your artwork is printed directly into the fabric, so any number of colors costs the same. Each side holds a design up to{' '}
                {area.inchesW} × {area.inchesH} in. On dark shirts we lay down a white base first so colors stay bright.
              </p>
            </details>
            <details>
              <summary>Shipping</summary>
              <p>
                Every shirt is printed to order within two business days. Standard shipping arrives 5–7 business days after you order and is free
                over $75. Express arrives in 3–4.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section section--tight" aria-labelledby="related-heading">
          <h2 id="related-heading" className="section__title">
            Other styles in stock
          </h2>
          <div className="product-grid product-grid--four">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
