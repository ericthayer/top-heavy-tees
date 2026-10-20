// Sample artwork so shoppers can try the studio without a file of their own.
// Each sample exercises a different part of the design check.

import { makeCanvas } from './imageUtils.js';

const SUNRISE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
<defs><clipPath id="disc"><circle cx="400" cy="400" r="250"/></clipPath></defs>
<g fill="#FF5CA8">${Array.from({ length: 18 }, (_, i) => `<rect x="388" y="70" width="24" height="70" rx="12" transform="rotate(${i * 20} 400 400)"/>`).join('')}</g>
<circle cx="400" cy="400" r="262" fill="none" stroke="#1D2440" stroke-width="16"/>
<g clip-path="url(#disc)">
<rect x="100" y="100" width="600" height="600" fill="#FFF3C4"/>
<circle cx="400" cy="440" r="150" fill="#FFCF33"/>
<g fill="none" stroke="#2A44D4" stroke-width="26" stroke-linecap="round">
<path d="M120 470 q 47 -34 94 0 t 94 0 t 94 0 t 94 0 t 94 0 t 94 0"/>
<path d="M120 530 q 47 -34 94 0 t 94 0 t 94 0 t 94 0 t 94 0 t 94 0"/>
<path d="M120 590 q 47 -34 94 0 t 94 0 t 94 0 t 94 0 t 94 0 t 94 0"/>
<path d="M120 650 q 47 -34 94 0 t 94 0 t 94 0 t 94 0 t 94 0 t 94 0"/>
</g>
<rect x="100" y="430" width="600" height="300" fill="#2A44D4" opacity="0.12"/>
</g>
</svg>`;

const LINEWORK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">
<g fill="none" stroke="#141414" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
<circle cx="660" cy="150" r="70"/>
<path d="M40 520 L250 210 L340 330 L470 130 L640 400 L720 300 L860 520 Z"/>
<path d="M250 210 L290 300 L320 280"/>
<path d="M470 130 L510 250 L560 220"/>
<path d="M90 560 H810"/>
</g>
</svg>`;

/** Draw a 520 px JPEG “phone snapshot”: a sticker-style graphic on a white background. */
function snapshotBlob() {
  const c = makeCanvas(520, 520);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 520, 520);
  ctx.fillStyle = '#C42E3B';
  ctx.beginPath();
  ctx.moveTo(260, 440);
  ctx.bezierCurveTo(60, 300, 80, 110, 200, 110);
  ctx.bezierCurveTo(240, 110, 260, 140, 260, 160);
  ctx.bezierCurveTo(260, 140, 280, 110, 320, 110);
  ctx.bezierCurveTo(440, 110, 460, 300, 260, 440);
  ctx.fill();
  ctx.fillStyle = '#FFCF33';
  ctx.beginPath();
  ctx.arc(205, 200, 26, 0, Math.PI * 2);
  ctx.fill();
  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.82));
}

export const SAMPLES = [
  { id: 'sunrise', label: 'Sunrise badge', note: 'Colorful vector' },
  { id: 'linework', label: 'Mountain linework', note: 'Black lines only' },
  { id: 'snapshot', label: 'Heart snapshot', note: 'Small JPG on white' },
];

export async function sampleFile(id) {
  if (id === 'sunrise') return new File([SUNRISE], 'sunrise-badge.svg', { type: 'image/svg+xml' });
  if (id === 'linework') return new File([LINEWORK], 'mountain-linework.svg', { type: 'image/svg+xml' });
  const blob = await snapshotBlob();
  return new File([blob], 'heart-snapshot.jpg', { type: 'image/jpeg' });
}

export const SUNRISE_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SUNRISE)}`;
