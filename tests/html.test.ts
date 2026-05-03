import { describe, it, expect } from 'bun:test';

const HTML = await Bun.file('dist/index.html').text();

describe('HTML Structure', () => {
  it('has valid doctype', () => {
    expect(HTML.trim().toLowerCase().startsWith('<!doctype html>')).toBeTrue();
  });

  it('has html tag', () => {
    expect(HTML.includes('<html')).toBeTrue();
    expect(HTML.includes('</html>')).toBeTrue();
  });

  it('has head and body', () => {
    expect(HTML.includes('<head>')).toBeTrue();
    expect(HTML.includes('</head>')).toBeTrue();
    expect(HTML.includes('<body>')).toBeTrue();
    expect(HTML.includes('</body>')).toBeTrue();
  });

  it('has title', () => {
    expect(HTML.includes('<title>')).toBeTrue();
    expect(HTML.includes('Sebasti')).toBeTrue();
  });

  it('has meta viewport', () => {
    expect(HTML.includes('viewport')).toBeTrue();
  });

  it('has no empty src attributes', () => {
    expect(HTML.includes('src=""')).toBeFalse();
    expect(HTML.includes("src=''")).toBeFalse();
  });

  it('has no empty href attributes', () => {
    expect(HTML.includes('href=""')).toBeFalse();
    expect(HTML.includes("href=''")).toBeFalse();
  });
});
