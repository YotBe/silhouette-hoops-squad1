import { describe, it, expect } from 'vitest';
import handler, { buildPreview, buildAppTarget } from '../../api/s';

function encode(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function render(query: string) {
  let body = '';
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 0,
    setHeader: (k: string, v: string) => { headers[k] = v; },
    end: (b?: string) => { body = b ?? ''; },
  };
  handler({ url: `/s${query}`, headers: { host: 'whoisit.app' } }, res);
  return { body, headers, statusCode: res.statusCode };
}

describe('buildPreview', () => {
  it('names the challenger and their score', () => {
    const p = buildPreview('challenge', { score: 2450, name: 'Yotam', tier: 'pro', rounds: 3 });
    expect(p.title).toContain('Yotam');
    expect(p.title).toContain('2,450');
    expect(p.description).toContain('3 players');
  });

  it('frames a rematch differently from a first challenge', () => {
    const payload = { score: 10, name: 'Yotam', tier: 'pro', rounds: 3 };
    expect(buildPreview('rematch', payload).title).toContain('rematch');
    expect(buildPreview('challenge', payload).title).not.toContain('rematch');
  });

  it('falls back to the generic card without a payload', () => {
    expect(buildPreview('challenge', null).title).toBe('WHO IS IT? — Guess The Player');
    expect(buildPreview('daily', null).title).toContain('Today');
  });
});

describe('buildAppTarget', () => {
  it('carries the challenge and attribution into the app', () => {
    const target = buildAppTarget('challenge', 'abc', 'friend1');
    const params = new URLSearchParams(target.split('?')[1]);
    expect(params.get('challenge')).toBe('abc');
    expect(params.get('r')).toBe('friend1');
    expect(params.get('k')).toBe('challenge');
  });

  it('drops empty parts', () => {
    expect(buildAppTarget('daily', '', '')).toBe('/?k=daily');
  });
});

describe('/s handler', () => {
  it('serves cacheable HTML with per-share preview tags', () => {
    const code = encode({ p: ['curry', 'lebron', 'giannis'], s: 2450, n: 'Yotam', t: 'pro' });
    const { body, headers, statusCode } = render(`?k=challenge&c=${code}&r=friend1`);
    expect(statusCode).toBe(200);
    expect(headers['Content-Type']).toContain('text/html');
    expect(headers['Cache-Control']).toContain('s-maxage');
    expect(body).toContain('<meta property="og:title" content="Yotam scored 2,450. Can you beat it? 🏀"');
    expect(body).toContain('twitter:card');
    expect(body).toContain(`challenge=${code}`);
  });

  it('escapes a hostile name instead of rendering it as markup', () => {
    const code = encode({ p: ['curry'], s: 1, n: '"><script>alert(1)</script>', t: 'pro' });
    const { body } = render(`?k=challenge&c=${code}`);
    expect(body).not.toContain('<script>alert(1)</script>');
    expect(body).toContain('&lt;script&gt;');
  });

  it('ignores a code that is not plausible base64', () => {
    const { body } = render('?k=challenge&c=<img src=x onerror=alert(1)>');
    expect(body).not.toContain('<img src=x');
    expect(body).toContain('WHO IS IT? — Guess The Player');
  });

  it('ignores a hostile referrer value', () => {
    const { body } = render('?k=challenge&r=</script><script>bad()</script>');
    expect(body).not.toContain('bad()');
  });

  it('falls back to the challenge kind for an unknown kind', () => {
    const { body } = render('?k=../../etc/passwd');
    expect(body).toContain('k=challenge');
    expect(body).not.toContain('etc/passwd');
  });

  it('handles a bare visit with no parameters', () => {
    const { body, statusCode } = render('');
    expect(statusCode).toBe(200);
    expect(body).toContain('NBA players in disguise');
  });
});
