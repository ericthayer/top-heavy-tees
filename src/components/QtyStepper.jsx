import { MinusIcon, PlusIcon } from './Icons.jsx';

export default function QtyStepper({ value, onChange, min = 1, max = 99, label = 'Quantity', id }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" className="qty__btn" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <MinusIcon size={16} />
      </button>
      <input
        id={id}
        className="qty__input"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
      <button type="button" className="qty__btn" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
