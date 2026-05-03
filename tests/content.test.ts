import { describe, it, expect } from 'bun:test';

const HTML = await Bun.file('dist/index.html').text();

describe('Content', () => {
  it('has hero section', () => {
    expect(HTML.includes('id="hero"')).toBeTrue();
    expect(HTML.includes('Sebastián Soto')).toBeTrue();
  });

  it('has technologies section', () => {
    expect(HTML.includes('id="technologies"')).toBeTrue();
    expect(HTML.includes('Python')).toBeTrue();
    expect(HTML.includes('Jenkins')).toBeTrue();
    expect(HTML.includes('Docker')).toBeTrue();
  });

  it('has courses section', () => {
    expect(HTML.includes('id="courses"')).toBeTrue();
  });

  it('has achievements section', () => {
    expect(HTML.includes('id="achievements"')).toBeTrue();
  });

  it('has behaviors section', () => {
    expect(HTML.includes('id="behaviors"')).toBeTrue();
  });

  it('has plans section', () => {
    expect(HTML.includes('id="plans"')).toBeTrue();
  });

  it('has roadmap section', () => {
    expect(HTML.includes('id="roadmap"')).toBeTrue();
  });

  it('has placeholders for leadership', () => {
    expect(HTML.includes('[Lead Name]')).toBeTrue();
    expect(HTML.includes('[Supervisor Name]')).toBeTrue();
    expect(HTML.includes('[Manager Name]')).toBeTrue();
  });

  it('has placeholder achievements', () => {
    expect(HTML.includes('[Achievement 1]')).toBeTrue();
    expect(HTML.includes('[Achievement 5]')).toBeTrue();
  });

  it('has placeholder behaviors', () => {
    expect(HTML.includes('[Behavior 1]')).toBeTrue();
    expect(HTML.includes('[Behavior 3]')).toBeTrue();
  });

  it('has placeholder courses', () => {
    expect(HTML.includes('[Course 1]')).toBeTrue();
    expect(HTML.includes('[Course 9]')).toBeTrue();
  });
});
