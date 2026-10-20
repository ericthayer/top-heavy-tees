const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const money = (n) => currency.format(n);

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const inches = (n) => `${n.toFixed(1).replace(/\.0$/, '')} in`;
