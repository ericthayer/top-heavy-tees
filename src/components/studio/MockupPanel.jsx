import { useEffect, useMemo, useRef, useState } from 'react';
import { generateMockups } from '../../lib/mockup.js';
import { DownloadIcon } from '../Icons.jsx';
import Modal from '../Modal.jsx';

const summarize = (d) => d && { id: d.id, n: d.src.length, cx: +d.cx.toFixed(4), cy: +d.cy.toFixed(4), w: +d.widthRatio.toFixed(4), r: d.rotation };

/**
 * Generates every mockup view automatically, a moment after the design stops
 * changing. All views are shown side by side; each one opens larger and
 * downloads on its own.
 */
export default function MockupPanel({ product, color, designs }) {
  const [views, setViews] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [zoomed, setZoomed] = useState(null);
  const run = useRef(0);
  const viewsRef = useRef([]);

  const hasDesign = Boolean(designs.front || designs.back);
  const expected = (designs.front ? 1 : 0) + (designs.back ? 1 : 0) + 2;
  const signature = useMemo(
    () => JSON.stringify({ s: product.style, c: color.hex, f: summarize(designs.front), b: summarize(designs.back) }),
    [product.style, color.hex, designs.front, designs.back],
  );

  useEffect(() => {
    if (!hasDesign) {
      viewsRef.current.forEach((v) => URL.revokeObjectURL(v.url));
      viewsRef.current = [];
      setViews([]);
      setProgress(null);
      return undefined;
    }
    const id = ++run.current;
    const signal = { aborted: false };
    const timer = setTimeout(async () => {
      setError(null);
      try {
        const result = await generateMockups({
          style: product.style,
          color: color.hex,
          designs,
          signal,
          onProgress: (p) => id === run.current && setProgress(p),
        });
        if (!result || id !== run.current) {
          result?.forEach((v) => URL.revokeObjectURL(v.url));
          return;
        }
        viewsRef.current.forEach((v) => URL.revokeObjectURL(v.url));
        viewsRef.current = result;
        setViews(result);
        setProgress(null);
      } catch (e) {
        if (id === run.current) {
          setError('The mockups couldn’t be generated. Try re-uploading your artwork.');
          setProgress(null);
        }
        console.error(e);
      }
    }, 650);
    return () => {
      clearTimeout(timer);
      signal.aborted = true;
    };
    // `designs` is captured through `signature`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, hasDesign]);

  useEffect(() => () => viewsRef.current.forEach((v) => URL.revokeObjectURL(v.url)), []);

  const firstRun = hasDesign && !views.length;
  const zoomedView = views.find((v) => v.id === zoomed);
  const fileName = (v) => `top-heavy-tees-${product.id}-${v.id}.png`;

  return (
    <section className="panel mockups" aria-labelledby="mockups-heading">
      <div className="mockups__head">
        <div>
          <h2 id="mockups-heading" className="panel__title">
            Mockups
          </h2>
          <p className="panel__note">
            {hasDesign
              ? 'Generated from your design and placement, and updated as you edit. Select a view to see it larger.'
              : 'Add artwork to generate realistic front, angled and flat-lay views.'}
          </p>
        </div>
        {progress && (
          <div className="mockups__status" role="status">
            <span className="progress" aria-hidden="true">
              <span className="progress__bar" style={{ width: `${Math.max(6, Math.round(progress.fraction * 100))}%` }} />
            </span>
            <span>{firstRun ? progress.label : 'Updating mockups'}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {hasDesign && (
        <ul className="mockups__grid" style={{ '--cols': firstRun ? expected : views.length }} aria-busy={Boolean(progress)}>
          {firstRun
            ? Array.from({ length: expected }, (_, i) => (
                <li key={i} className="mockup-card">
                  <div className="mockup-card__media is-loading" />
                  <div className="mockup-card__bar">
                    <span className="mockup-card__skeleton" />
                  </div>
                </li>
              ))
            : views.map((v) => (
                <li key={v.id} className={`mockup-card${progress ? ' is-stale' : ''}`}>
                  <button type="button" className="mockup-card__media" onClick={() => setZoomed(v.id)} aria-label={`View the ${v.label.toLowerCase()} mockup larger`}>
                    <img src={v.url} alt={`${v.label} mockup of your ${product.name}`} />
                  </button>
                  <div className="mockup-card__bar">
                    <span className="mockup-card__label">{v.label}</span>
                    <a className="mockup-card__download" href={v.url} download={fileName(v)} aria-label={`Download the ${v.label.toLowerCase()} mockup as PNG`}>
                      <DownloadIcon size={16} />
                      PNG
                    </a>
                  </div>
                </li>
              ))}
        </ul>
      )}

      <Modal open={Boolean(zoomedView)} onClose={() => setZoomed(null)} title={zoomedView ? `${zoomedView.label} view` : ''} wide>
        {zoomedView && (
          <div className="lightbox">
            <img src={zoomedView.url} alt={`${zoomedView.label} mockup of your ${product.name}`} />
            <div className="lightbox__bar">
              <div className="segmented" role="group" aria-label="Mockup views">
                {views.map((v) => (
                  <button key={v.id} type="button" aria-pressed={v.id === zoomedView.id} onClick={() => setZoomed(v.id)}>
                    {v.label}
                  </button>
                ))}
              </div>
              <a className="btn btn--primary" href={zoomedView.url} download={fileName(zoomedView)}>
                <DownloadIcon size={18} />
                Download PNG
              </a>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
