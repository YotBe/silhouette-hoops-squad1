function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export interface ShareImageOptions {
  score: number;
  bestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  emojiGrid: string; // e.g. "🟢🟡🔴🟢🟢"
  mode: string;      // display label e.g. "ROOKIE" or "HEAT CHECK"
  accentHsl: string; // e.g. "142 71% 45%"
}

export async function generateShareImage(opts: ShareImageOptions): Promise<Blob | null> {
  try {
    // Wait for fonts to load
    await document.fonts.ready;

    const S = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { score, bestStreak, totalCorrect, totalAnswered, emojiGrid, mode, accentHsl } = opts;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const accent = `hsl(${accentHsl})`;

    // ── Background ─────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#0d1117');
    bg.addColorStop(1, '#060a0f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    // Accent radial glow top-center
    const glow = ctx.createRadialGradient(S / 2, 0, 0, S / 2, 0, S * 0.75);
    glow.addColorStop(0, `hsl(${accentHsl} / 0.18)`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, S, S);

    // ── Subtle grid lines ───────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let i = 0; i < S; i += 72) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    }

    // ── Top border accent ────────────────────────────────────────────────────
    const topGrad = ctx.createLinearGradient(0, 0, S, 0);
    topGrad.addColorStop(0, 'transparent');
    topGrad.addColorStop(0.5, accent);
    topGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = topGrad;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(S, 2); ctx.stroke();

    // ── Logo ─────────────────────────────────────────────────────────────────
    ctx.font = "bold 72px 'Bebas Neue', 'Arial Black', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('WHO IS IT?', 72, 120);

    // Basketball emoji
    ctx.font = '58px sans-serif';
    ctx.fillText('🏀', 560, 118);

    // ── Mode badge ────────────────────────────────────────────────────────────
    ctx.font = "bold 26px 'Space Mono', 'Courier New', monospace";
    ctx.textAlign = 'right';
    const modeText = mode.toUpperCase();
    const modeW = ctx.measureText(modeText).width;
    const bPad = 22;
    const bX = S - 72 - modeW - bPad * 2;
    const bY = 78;
    ctx.fillStyle = `hsl(${accentHsl} / 0.2)`;
    roundRect(ctx, bX, bY, modeW + bPad * 2, 44, 22);
    ctx.fill();
    ctx.strokeStyle = `hsl(${accentHsl} / 0.5)`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bX, bY, modeW + bPad * 2, 44, 22);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillText(modeText, S - 72, bY + 30);

    // ── Divider ───────────────────────────────────────────────────────────────
    const divGrad = ctx.createLinearGradient(0, 0, S, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.4, `hsl(${accentHsl} / 0.4)`);
    divGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(72, 148); ctx.lineTo(S - 72, 148); ctx.stroke();

    // ── Score ─────────────────────────────────────────────────────────────────
    ctx.textAlign = 'center';
    const scoreGrad = ctx.createLinearGradient(0, 240, 0, 500);
    scoreGrad.addColorStop(0, '#f5c842');
    scoreGrad.addColorStop(1, '#d4921a');
    ctx.fillStyle = scoreGrad;
    ctx.font = "bold 240px 'Bebas Neue', 'Arial Black', sans-serif";
    ctx.fillText(score.toLocaleString(), S / 2, 480);

    // Score glow
    ctx.shadowColor = '#f5c842';
    ctx.shadowBlur = 60;
    ctx.fillStyle = scoreGrad;
    ctx.fillText(score.toLocaleString(), S / 2, 480);
    ctx.shadowBlur = 0;

    // "PTS" label
    ctx.font = "bold 40px 'Space Mono', 'Courier New', monospace";
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('PTS', S / 2, 535);

    // ── Emoji grid ────────────────────────────────────────────────────────────
    const emojis = [...emojiGrid]; // spread handles emoji code points correctly
    const emojiSize = Math.min(80, Math.floor((S - 200) / Math.max(emojis.length, 1)));
    ctx.font = `${emojiSize}px sans-serif`;
    const totalEmojiW = emojis.length * (emojiSize + 8);
    const emojiStartX = S / 2 - totalEmojiW / 2 + emojiSize / 2;
    emojis.forEach((e, i) => {
      ctx.fillText(e, emojiStartX + i * (emojiSize + 8), 640);
    });

    // ── Separator ─────────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, 680); ctx.lineTo(S - 120, 680); ctx.stroke();

    // ── Stats row ─────────────────────────────────────────────────────────────
    const stats = [
      { icon: '🎯', val: `${accuracy}%`, sub: 'ACCURACY' },
      { icon: '🔥', val: String(bestStreak), sub: 'STREAK' },
      { icon: '✅', val: `${totalCorrect}/${totalAnswered}`, sub: 'CORRECT' },
    ];
    const statSpan = S / 4;
    stats.forEach((s, i) => {
      const x = statSpan + i * statSpan;
      ctx.font = `52px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(s.icon, x, 740);

      ctx.font = "bold 56px 'Space Mono', 'Courier New', monospace";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s.val, x, 810);

      ctx.font = "22px 'Space Mono', 'Courier New', monospace";
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.fillText(s.sub, x, 845);
    });

    // ── Hashtag + watermark ───────────────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.font = "bold 30px 'Bebas Neue', 'Arial Black', sans-serif";
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillText('#WhoIsItNBA  ·  whoisit.app', S / 2, S - 52);

    // ── Bottom accent line ────────────────────────────────────────────────────
    ctx.strokeStyle = topGrad;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, S - 4); ctx.lineTo(S, S - 4); ctx.stroke();

    return await new Promise<Blob | null>(resolve =>
      canvas.toBlob(b => resolve(b), 'image/png')
    );
  } catch (err) {
    console.error('shareImage error:', err);
    return null;
  }
}

export async function shareOrDownloadImage(blob: Blob, filename = 'whoisit-score.png') {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; } catch {}
  }
  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
