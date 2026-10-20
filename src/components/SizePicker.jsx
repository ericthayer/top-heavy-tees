import { SIZES } from '../data/products.js';

/** Size radio group that shows stock for each size. */
export default function SizePicker({ value, onChange, stockFor, name = 'size', legend = 'Size', extra }) {
  const selectedStock = value ? stockFor(value) : null;
  const allOut = SIZES.every((s) => stockFor(s) === 0);
  return (
    <fieldset className="size-picker">
      <div className="size-picker__head">
        <legend className="field-label">{legend}</legend>
        {extra}
      </div>
      <div className="size-picker__row">
        {SIZES.map((s) => {
          const stock = stockFor(s);
          const out = stock === 0;
          return (
            <label key={s} className={`size-chip${out ? ' is-out' : ''}`}>
              <input type="radio" name={name} value={s} checked={value === s} disabled={out} onChange={() => onChange(s)} />
              <span className="size-chip__label">{s}</span>
              {out && <span className="visually-hidden">, out of stock</span>}
            </label>
          );
        })}
      </div>
      <p className="stock-note" aria-live="polite">
        {allOut
          ? 'Every size is out of stock.'
          : selectedStock === null
          ? 'Choose a size.'
          : selectedStock === 0
            ? `${value} is out of stock.`
            : selectedStock <= 5
              ? `Only ${selectedStock} left in ${value}.`
              : `In stock in ${value}.`}
      </p>
    </fieldset>
  );
}
