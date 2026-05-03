import { describe, it, expect } from 'bun:test';

const HTML = await Bun.file('dist/index.html').text();

function extractLinks(html: string) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
  const srcs = [...html.matchAll(/src=["']([^"']+)["']/g)].map(m => m[1]);
  return [...hrefs, ...srcs].filter(l => !l.startsWith('http') && !l.startsWith('#') && !l.startsWith('mailto'));
}

describe('Links', () => {
  it('has no broken internal links', async () => {
    const links = extractLinks(HTML);
    for (const link of links) {
      const file = Bun.file(`dist/${link}`);
      expect(await file.exists()).toBeTrue();
    }
  });
});
