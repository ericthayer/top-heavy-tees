import { useState } from 'react';
import Modal from './Modal.jsx';
import { RulerIcon } from './Icons.jsx';
import { SIZE_GUIDES, SIZES } from '../data/products.js';

export function SizeGuideTable({ fit }) {
  const [unit, setUnit] = useState('in');
  const guide = SIZE_GUIDES[fit] ?? SIZE_GUIDES.classic;
  const fmt = (n) => (unit === 'in' ? n : Math.round(n * 2.54));
  return (
    <div className="size-guide">
      <div className="size-guide__bar">
        <p>{guide.label}. Measured flat, in {unit === 'in' ? 'inches' : 'centimeters'}.</p>
        <div className="segmented" role="group" aria-label="Units">
          {['in', 'cm'].map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u}
            </button>
          ))}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">Chest width</th>
            <th scope="col">Body length</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((s) => (
            <tr key={s}>
              <th scope="row">{s}</th>
              <td>{fmt(guide.rows[s][0])}</td>
              <td>{fmt(guide.rows[s][1])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="size-guide__how">
        Lay a shirt you like flat. Chest width is measured straight across, one inch below the armpits. Body length runs from the highest point of
        the shoulder to the hem.
      </p>
    </div>
  );
}

export default function SizeGuideButton({ fit }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="link-btn" onClick={() => setOpen(true)}>
        <RulerIcon size={18} />
        Size guide
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Size guide">
        <SizeGuideTable fit={fit} />
      </Modal>
    </>
  );
}
