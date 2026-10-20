import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COLORS, PRODUCTS, getProduct, unitPrice } from '../data/products.js';
import { getPrintArea } from '../lib/shirtSvg.js';
import { prepareUpload, removeBackground, trimTransparent, refreshImage } from '../lib/imageUtils.js';
import { applyPreset, fitToArea, heightRatio, initialPlacement } from '../lib/placement.js';
import { evaluateDesign } from '../lib/suggestions.js';
import { makeCartPreview } from '../lib/mockup.js';
import { sampleFile } from '../lib/samples.js';
import { money } from '../lib/format.js';
import { useDesign } from '../context/DesignContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useInventory } from '../context/InventoryContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import DesignCanvas from '../components/studio/DesignCanvas.jsx';
import UploadPanel from '../components/studio/UploadPanel.jsx';
import ShirtPanel from '../components/studio/ShirtPanel.jsx';
import PlacementControls from '../components/studio/PlacementControls.jsx';
import SuggestionsPanel from '../components/studio/SuggestionsPanel.jsx';
import MockupPanel from '../components/studio/MockupPanel.jsx';
import OrderPanel from '../components/studio/OrderPanel.jsx';

const SIDES = ['front', 'back'];

export default function DesignStudio() {
  const { state, dispatch } = useDesign();
  const { add } = useCart();
  const { availableOf, totalOf } = useInventory();
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  // Arriving from a product page: /design-studio?product=…&color=…
  useEffect(() => {
    const pid = params.get('product');
    if (pid && getProduct(pid)) {
      dispatch({ type: 'setProduct', productId: pid, colorId: params.get('color') ?? undefined });
      setParams({}, { replace: true });
    }
  }, [params, dispatch, setParams]);

  const product = getProduct(state.productId) ?? PRODUCTS[0];
  const color = COLORS[state.colorId] ?? COLORS[product.colors[0]];
  const { side } = state;
  const design = state.designs[side];
  const area = getPrintArea(product.style, side);
  const colorOptions = useMemo(() => product.colors.map((id) => COLORS[id]), [product]);
  const sides = SIDES.filter((s) => state.designs[s]);

  // Keep the chosen size valid for the current style.
  useEffect(() => {
    if (state.size && availableOf(product.id, state.size) > 0) return;
    const firstInStock = ['M', 'L', 'S', 'XL', 'XXL'].find((s) => availableOf(product.id, s) > 0);
    if (firstInStock && firstInStock !== state.size) dispatch({ type: 'setSize', size: firstInStock });
  }, [product.id, state.size, availableOf, dispatch]);

  const evaluate = useCallback(
    (s) => {
      const d = state.designs[s];
      if (!d) return null;
      return evaluateDesign({ design: d, side: s, shirt: color, colors: colorOptions, area: getPrintArea(product.style, s) });
    },
    [state.designs, color, colorOptions, product.style],
  );
  const result = useMemo(() => evaluate(side), [evaluate, side]);
  const otherSide = side === 'front' ? 'back' : 'front';
  const otherResult = useMemo(() => evaluate(otherSide), [evaluate, otherSide]);
  const otherCount = otherResult?.suggestions.filter((s) => s.severity !== 'good').length ?? 0;

  const update = useCallback((patch) => dispatch({ type: 'updateDesign', side, patch }), [dispatch, side]);

  const handleFile = useCallback(
    async (file, targetSide = side) => {
      setError(null);
      setBusy({ label: 'Uploading artwork', progress: 0 });
      const started = performance.now();
      try {
        const prepared = await prepareUpload(file, (p) => setBusy({ label: 'Uploading artwork', progress: p * 0.7 }));
        setBusy({ label: 'Placing on the shirt', progress: 0.9 });
        // Keep the progress visible long enough to register.
        const elapsed = performance.now() - started;
        if (elapsed < 450) await new Promise((r) => setTimeout(r, 450 - elapsed));
        const placed = { ...prepared, ...initialPlacement(prepared, getPrintArea(product.style, targetSide), targetSide) };
        dispatch({ type: 'setDesign', side: targetSide, design: placed });
        if (targetSide !== side) dispatch({ type: 'setSide', side: targetSide });
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(null);
      }
    },
    [side, product.style, dispatch],
  );

  const handleSample = async (id) => handleFile(await sampleFile(id));

  const handleAction = useCallback(
    async (action) => {
      if (!design) return;
      switch (action.type) {
        case 'set-color':
          if (product.colors.includes(action.payload.colorId)) dispatch({ type: 'setColor', colorId: action.payload.colorId });
          break;
        case 'set-width':
          update({ widthRatio: action.payload.widthRatio });
          break;
        case 'center':
          update({ cx: 0.5 });
          break;
        case 'straighten':
          update({ rotation: 0 });
          break;
        case 'fit':
          dispatch({ type: 'setDesign', side, design: fitToArea(design, area) });
          break;
        case 'preset':
          dispatch({ type: 'setDesign', side, design: applyPreset(design, area, action.payload.preset) });
          break;
        case 'raise':
          update({ cy: 0.1 + heightRatio(design, area) / 2 });
          break;
        case 'remove-bg': {
          setBusy({ label: 'Removing background' });
          try {
            const out = await removeBackground(design.src);
            if (!out.changed) {
              notify('No background color was found at the edges of the image.');
              break;
            }
            const fields = await refreshImage(out.src, { naturalWidth: out.naturalWidth, naturalHeight: out.naturalHeight, format: 'png' });
            dispatch({ type: 'replaceImage', side, fields });
            notify('Background removed. Use “Undo edit” to bring it back.', { tone: 'success' });
          } finally {
            setBusy(null);
          }
          break;
        }
        case 'trim': {
          setBusy({ label: 'Trimming empty space' });
          try {
            const out = await trimTransparent(design.src);
            const fields = await refreshImage(out.src, {
              naturalWidth: out.naturalWidth,
              naturalHeight: out.naturalHeight,
              widthRatio: design.widthRatio * out.cropW,
            });
            dispatch({ type: 'replaceImage', side, fields });
            notify('Trimmed to the edges of your artwork.', { tone: 'success' });
          } finally {
            setBusy(null);
          }
          break;
        }
        default:
          break;
      }
    },
    [design, product.colors, dispatch, update, side, area, notify],
  );

  const handleProduct = (productId) => dispatch({ type: 'setProduct', productId });

  const copyToOther = () => {
    const other = state.designs[otherSide];
    if (other || !design) return;
    const placed = {
      ...design,
      id: `${design.id}-${otherSide}`,
      previous: null,
      ...initialPlacement(design, getPrintArea(product.style, otherSide), otherSide),
    };
    dispatch({ type: 'setDesign', side: otherSide, design: placed });
    dispatch({ type: 'setSide', side: otherSide });
  };

  const handleAdd = async () => {
    if (!sides.length || !state.size) return;
    setAdding(true);
    try {
      const preview = await makeCartPreview({ style: product.style, color: color.hex, designs: state.designs });
      add({
        productId: product.id,
        name: product.name,
        style: product.style,
        colorId: color.id,
        colorName: color.name,
        size: state.size,
        qty: state.qty,
        unitPrice: unitPrice(product, state.size, sides),
        custom: { id: `c_${Date.now().toString(36)}`, sides, preview, files: sides.map((s) => state.designs[s].name) },
      });
      notify(`Added ${state.qty > 1 ? `${state.qty} custom shirts` : 'your custom shirt'} to the cart.`, {
        tone: 'success',
        action: { to: '/cart', label: 'View cart' },
      });
      dispatch({ type: 'setQty', qty: 1 });
    } finally {
      setAdding(false);
    }
  };

  const price = state.size ? unitPrice(product, state.size, sides) : product.price;
  const productOut = totalOf(product.id) === 0;

  return (
    <div className="studio-page">
      <div className="studio-head">
        <h1>Design studio</h1>
        <p>Upload your artwork, place it on the shirt, and review the design check and mockups before you order.</p>
      </div>

      {productOut && (
        <p className="notice notice--warn" role="status">
          The {product.name} is out of stock. You can keep designing, or switch to another style to order.
        </p>
      )}

      <div className="studio">
        <div className="studio__bench">
        <div className="studio__tools">
          <UploadPanel
            side={side}
            design={design}
            otherSideEmpty={!state.designs[otherSide]}
            error={error}
            busy={Boolean(busy)}
            inputRef={inputRef}
            onFile={(f) => handleFile(f)}
            onSample={handleSample}
            onRemove={() => dispatch({ type: 'removeDesign', side })}
            onUndo={() => dispatch({ type: 'undoImage', side })}
            onCopyToOther={copyToOther}
          />
          <ShirtPanel product={product} colorId={color.id} onProduct={handleProduct} onColor={(id) => dispatch({ type: 'setColor', colorId: id })} />
          <PlacementControls
            side={side}
            design={design}
            area={area}
            onChange={update}
            onPreset={(preset) => design && dispatch({ type: 'setDesign', side, design: applyPreset(design, area, preset) })}
          />
        </div>

        <div className="studio__stage">
          <div className="stage-toolbar">
            <div className="segmented segmented--lg" role="group" aria-label="Shirt side">
              {SIDES.map((s) => (
                <button key={s} type="button" aria-pressed={side === s} onClick={() => dispatch({ type: 'setSide', side: s })}>
                  {s === 'front' ? 'Front' : 'Back'}
                  {state.designs[s] && <span className="segmented__dot" aria-label="has artwork" />}
                </button>
              ))}
            </div>
            <p className="stage-toolbar__meta">
              {product.name}, {color.name.toLowerCase()}
            </p>
          </div>
          <DesignCanvas
            style={product.style}
            side={side}
            color={color.hex}
            design={design}
            busy={busy}
            onChange={update}
            onDropFile={(f) => handleFile(f)}
            onRequestUpload={() => inputRef.current?.click()}
          />
          <p className="stage-hint">
            {design
              ? (
                <>
                  Drag to move. Drag a corner to resize, or the round handle to rotate.
                  <span className="stage-hint__keys"> Hold Shift to rotate in 15° steps, or use the arrow keys.</span>
                </>
              )
              : 'Your artwork goes inside the dashed print area.'}
          </p>
        </div>

        <div className="studio__side">
          <SuggestionsPanel
            design={design}
            result={result}
            shirt={color}
            onAction={handleAction}
            busy={Boolean(busy)}
            other={otherCount ? { side: otherSide, count: otherCount } : null}
            onShowOther={() => dispatch({ type: 'setSide', side: otherSide })}
          />
          <OrderPanel
            product={product}
            size={state.size}
            qty={state.qty}
            sides={sides}
            onSize={(s) => dispatch({ type: 'setSize', size: s })}
            onQty={(q) => dispatch({ type: 'setQty', qty: q })}
            onAdd={handleAdd}
            adding={adding}
          />
        </div>
        </div>

        <div className="studio__mockups">
          <MockupPanel product={product} color={color} designs={state.designs} />
        </div>
      </div>

      {sides.length > 0 && (
      <div className="studio-bar">
        <div>
          <p className="studio-bar__price">{money(price * state.qty)}</p>
          <p className="studio-bar__meta">
            {state.size ?? 'No size'}, {color.name.toLowerCase()}
          </p>
        </div>
        <a href="#order-panel" className="btn btn--primary">
          Review and add
        </a>
      </div>
      )}
    </div>
  );
}
