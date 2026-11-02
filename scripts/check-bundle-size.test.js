import { describe, expect, it } from 'vitest';
import { firstLoadAssets, gzipBytes } from './check-bundle-size.mjs';

describe('firstLoadAssets', () => {
  it('picks up the entry script and modulepreload links, and nothing else', () => {
    const html = `<!doctype html><html><head>
      <link rel="icon" href="/favicon.svg">
      <link rel="stylesheet" crossorigin href="/assets/index-a1.css">
      <script type="module" crossorigin src="/assets/index-a1.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/vendor-b2.js">
      <link rel="modulepreload" href="/assets/shirtSvg-c3.js?v=1">
    </head><body><script>window.x = 1</script></body></html>`;
    expect(firstLoadAssets(html)).toEqual(['/assets/index-a1.js', '/assets/vendor-b2.js', '/assets/shirtSvg-c3.js?v=1']);
  });

  it('lists each file once even when it is both a script and a preload', () => {
    const html = '<script type="module" src="/a.js"></script><link rel="modulepreload" href="/a.js">';
    expect(firstLoadAssets(html)).toEqual(['/a.js']);
  });

  it('returns nothing for a page with no module scripts', () => {
    expect(firstLoadAssets('<html><body>hi</body></html>')).toEqual([]);
  });
});

describe('gzipBytes', () => {
  it('measures compressed size, not raw size', () => {
    const repetitive = Buffer.from('export const a = 1;\n'.repeat(500));
    expect(gzipBytes(repetitive)).toBeLessThan(repetitive.length / 10);
  });
});
