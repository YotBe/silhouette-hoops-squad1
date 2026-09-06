/**
 * `/s` — the share landing route.
 *
 * A challenge link is only worth sending if it survives the trip through a
 * messaging app. Chat clients and social crawlers fetch the URL and render
 * whatever Open Graph tags come back — but this app is a client-rendered SPA,
 * so every shared link previously unfurled with the same generic card no
 * matter who sent it or what they scored.
 *
 * This route renders the tags server-side, per share ("Yotam scored 2,450 —
 * beat it?"), then bounces real visitors straight into the game.
 *
 * Deliberately dependency-free: it runs on Vercel's Node runtime with nothing
 * but the standard library, so it cannot break the client build.
 */

interface ShareRequest {
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

interface ShareResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

/** Kept in sync with `ShareKind` in src/utils/viral.ts. */
const KINDS = ['challenge', 'rematch', 'daily', 'score'];

const SITE_NAME = 'WHO IS IT?';
const DEFAULT_TITLE = 'WHO IS IT? — Guess The Player';
const DEFAULT_DESCRIPTION = 'NBA players in disguise. Can you spot them?';

/**
 * Social card image. Single source of truth so a per-share generated image can
 * be swapped in later without touching the tag rendering below.
 */
const OG_IMAGE =
  'https://storage.googleapis.com/gpt-engineer-file-uploads/jbpg5FsVbiViwQNapLoqzJNDFfE3/social-images/social-1773102647633-Gemini_Generated_Image_8gpfv78gpfv78gpf.webp';

interface ChallengePayload {
  score: number;
  name: string;
  tier: string;
  rounds: number;
}

/** Tolerates both standard and URL-safe base64, and missing padding. */
function decodeChallenge(code: string): ChallengePayload | null {
  try {
    const normalized = code.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const raw = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    if (!Array.isArray(raw.p) || raw.p.length === 0) return null;
    return {
      score: typeof raw.s === 'number' && Number.isFinite(raw.s) ? Math.max(0, Math.round(raw.s)) : 0,
      name: typeof raw.n === 'string' ? raw.n.slice(0, 40) : 'Someone',
      tier: typeof raw.t === 'string' ? raw.t.slice(0, 20) : 'rookie',
      rounds: raw.p.length,
    };
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface Preview {
  title: string;
  description: string;
}

export function buildPreview(kind: string, payload: ChallengePayload | null): Preview {
  if (payload && (kind === 'challenge' || kind === 'rematch')) {
    const who = payload.name.trim() || 'Someone';
    const score = payload.score.toLocaleString('en-US');
    return {
      title:
        kind === 'rematch'
          ? `${who} wants a rematch — ${score} to beat 🏀`
          : `${who} scored ${score}. Can you beat it? 🏀`,
      description: `Same ${payload.rounds} players, same rules. Tap to take the shot — it takes 60 seconds.`,
    };
  }
  if (kind === 'daily') {
    return {
      title: "Today's WHO IS IT? challenge 🏀",
      description: 'Three players. One shot each. New puzzle every day.',
    };
  }
  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
}

/** Where a human visitor should land — the app, with attribution intact. */
export function buildAppTarget(kind: string, code: string, ref: string): string {
  const params = new URLSearchParams();
  if (code) params.set('challenge', code);
  if (ref) params.set('r', ref);
  params.set('k', kind);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

function renderPage(preview: Preview, target: string, canonical: string): string {
  const title = escapeHtml(preview.title);
  const description = escapeHtml(preview.description);
  const targetAttr = escapeHtml(target);
  const canonicalAttr = escapeHtml(canonical);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${canonicalAttr}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:url" content="${canonicalAttr}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${OG_IMAGE}" />
<meta name="theme-color" content="#3b82f6" />
<meta http-equiv="refresh" content="0; url=${targetAttr}" />
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0d1117; color:#fff; font-family:system-ui,-apple-system,sans-serif; text-align:center; }
  a { color:#f5c842; }
</style>
</head>
<body>
<main>
  <h1>${title}</h1>
  <p>${description}</p>
  <p><a href="${targetAttr}">Tap here if you are not redirected</a></p>
</main>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;
}

export default function handler(req: ShareRequest, res: ShareResponse): void {
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '');
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0];
  const url = new URL(req.url ?? '/s', `${proto}://${host || 'localhost'}`);

  const rawKind = url.searchParams.get('k') ?? '';
  const kind = KINDS.includes(rawKind) ? rawKind : 'challenge';
  // Only echo back a plausible base64 payload — never arbitrary caller input.
  const rawCode = url.searchParams.get('c') ?? '';
  const code = /^[A-Za-z0-9+/\-_=]{0,4096}$/.test(rawCode) ? rawCode : '';
  const rawRef = url.searchParams.get('r') ?? '';
  const ref = /^[A-Za-z0-9_-]{0,64}$/.test(rawRef) ? rawRef : '';

  const preview = buildPreview(kind, code ? decodeChallenge(code) : null);
  const target = buildAppTarget(kind, code, ref);
  // Rebuild the canonical from validated parts — never reflect raw query input
  // back out, even escaped, or a rejected parameter ends up in the preview.
  const canonicalParams = new URLSearchParams({ k: kind });
  if (code) canonicalParams.set('c', code);
  const canonical = `${proto}://${host || 'localhost'}/s?${canonicalParams.toString()}`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Crawlers re-fetch often; a short shared cache keeps unfurls snappy without
  // pinning a stale preview for long.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
  res.end(renderPage(preview, target, canonical));
}
