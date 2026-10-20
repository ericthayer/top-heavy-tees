import { COLORS } from '../data/products.js';

/** Color picker as a radio group. Arrow keys move between swatches. */
export default function Swatches({ colorIds, value, onChange, name, size = 'md', legend }) {
  return (
    <fieldset className={`swatches swatches--${size}`}>
      {legend && (
        <legend className="field-label">
          {legend} <span className="field-label__value">{COLORS[value]?.name}</span>
        </legend>
      )}
      <div className="swatches__row">
        {colorIds.map((id) => {
          const c = COLORS[id];
          return (
            <label key={id} className="swatch" title={c.name}>
              <input type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} />
              <span className="swatch__chip" style={{ '--chip': c.hex }} />
              <span className="visually-hidden">{c.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
