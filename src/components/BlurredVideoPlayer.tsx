import { useState } from 'react';

interface Props {
  videoFile: string;
  imageUrl?: string;
  onReady?: () => void;
}

export function BlurredVideoPlayer({ videoFile, imageUrl, onReady }: Props) {
  const [contentReady, setContentReady] = useState(false);
  const [useImageFallback, setUseImageFallback] = useState(!videoFile);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [readyFired, setReadyFired] = useState(false);

  const fireReady = () => {
    if (!readyFired) {
      setReadyFired(true);
      setContentReady(true);
      onReady?.();
    }
  };

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl w-full bg-card aspect-[4/3]"
      style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.1)' }}
    >
      {/* Skeleton shimmer loader */}
      {!contentReady && (
        <div className="absolute inset-0 z-20 bg-card overflow-hidden">
          <div className="absolute inset-0 animate-skeleton-shimmer" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-20 animate-pulse">🏀</span>
          </div>
        </div>
      )}

      {showPlaceholder ? (
        /* Double-failure: no video, no image — show mystery silhouette */
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center bg-gradient-to-b from-card to-background/80">
          <svg width="80" height="120" viewBox="0 0 64 96" fill="none" className="opacity-30">
            <ellipse cx="32" cy="14" rx="12" ry="12" fill="hsl(var(--muted-foreground))" />
            <path d="M16 96V56C16 44 22 36 32 36C42 36 48 44 48 56V96" fill="hsl(var(--muted-foreground))" />
          </svg>
          <span className="text-muted-foreground/40 text-xs font-bold tracking-widest mt-2 uppercase">Mystery Player</span>
        </div>
      ) : useImageFallback && imageUrl ? (
        /* Silhouette image fallback — ESPN headshot turned into a true black silhouette
           with slow Ken Burns zoom so it feels dynamic, not static */
        <>
          <img
            src={imageUrl}
            alt=""
            onLoad={fireReady}
            onError={() => { setShowPlaceholder(true); fireReady(); }}
            className="absolute inset-0 w-full h-full object-cover z-[1] animate-ken-burns"
            style={{ filter: 'brightness(0) contrast(1.2)', transformOrigin: 'center 30%' }}
          />
          {/* Blue glow overlay so it looks intentional, not broken */}
          <div
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 35%, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }}
          />
          {/* "SILHOUETTE" badge */}
          <div className="absolute top-3 right-3 z-[3] px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest"
            style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}>
            SILHOUETTE
          </div>
          {/* Scan line */}
          <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
            <div className="animate-scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>
        </>
      ) : (
        /* Primary: disguise video — no filter needed, content IS the challenge */
        <video
          src={videoFile}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={fireReady}
          onError={() => {
            if (imageUrl) {
              setUseImageFallback(true);
            } else {
              setShowPlaceholder(true);
              fireReady();
            }
          }}
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        />
      )}

      {/* Bottom gradient fade into background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[18%] z-[2] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))' }}
      />
    </div>
  );
}
