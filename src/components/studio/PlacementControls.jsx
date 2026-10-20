import { PRESETS, MIN_WIDTH, MAX_WIDTH } from '../../lib/placement.js';
import { computeMetrics } from '../../lib/suggestions.js';
import { inches } from '../../lib/format.js';
import { CenterIcon, RotateIcon } from '../Icons.jsx';

export default function PlacementControls({ side, design, area, onChange, onPreset }) {
  const disabled = !design;
  const metrics = design ? computeMetrics(design, area) : null;
  const widthIn = design ? design.widthRatio * area.inchesW : 0;

  return (
    <section className="panel" aria-labelledby="placement-heading">
      <h2 id="placement-heading" className="panel__title">
        Placement
      </h2>
      <div className="preset-row" role="group" aria-label="Placement presets">
        {PRESETS[side].map((p) => (
          <button key={p.id} type="button" className="chip-btn" disabled={disabled} onClick={() => onPreset(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="range-field">
        <div className="range-field__head">
          <label htmlFor="size-range" className="field-label">
            Size
          </label>
          <output htmlFor="size-range" className="data">
            {metrics ? `${inches(metrics.widthIn)} × ${inches(metrics.heightIn)}` : '—'}
          </output>
        </div>
        <input
          id="size-range"
          type="range"
          min={MIN_WIDTH * area.inchesW}
          max={MAX_WIDTH * area.inchesW}
          step="0.1"
          value={widthIn || 6}
          disabled={disabled}
          onChange={(e) => onChange({ widthRatio: Number(e.target.value) / area.inchesW })}
        />
      </div>

      <div className="range-field">
        <div className="range-field__head">
          <label htmlFor="rotate-range" className="field-label">
            Rotation
          </label>
          <output htmlFor="rotate-range" className="data">
            {design ? `${Math.round(design.rotation)}°` : '—'}
          </output>
        </div>
        <input
          id="rotate-range"
          type="range"
          min="-180"
          max="180"
          step="1"
          value={design?.rotation ?? 0}
          disabled={disabled}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
        />
      </div>

      <div className="button-row">
        <button type="button" className="btn btn--small btn--outline" disabled={disabled} onClick={() => onChange({ cx: 0.5 })}>
          <CenterIcon size={16} />
          Center
        </button>
        <button type="button" className="btn btn--small btn--outline" disabled={disabled || !design?.rotation} onClick={() => onChange({ rotation: 0 })}>
          <RotateIcon size={16} />
          Straighten
        </button>
      </div>
    </section>
  );
}
