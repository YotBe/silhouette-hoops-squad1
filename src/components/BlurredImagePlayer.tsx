import { useState, useEffect } from 'react';

interface Props {
  imageUrl: string;
  isRevealed: boolean;
  revealProgress?: number;
  isSilhouette?: boolean;
  onReady?: () => void;
}

export function BlurredImagePlayer({ imageUrl, isRevealed, revealProgress = 0, isSilhouette = false, onReady }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);

  // In silhouette mode: brightness goes from 0 (black) to partial based on progress
  // When fully revealed (isRevealed=true): full brightness, no blur
  const getSilhouetteFilter = () => {
    if (isRevealed) return 'brightness(1) blur(0px)';
    if (isSilhouette) {
      // Start at pure black silhouette, gradually reveal with blur reduction
      const brightness = Math.min(revealProgress * 0.3, 0.15); // stays very dark
      const blur = Math.max(0, 8 - revealProgress * 8);
      return `brightness(${brightness}) blur(${blur}px) contrast(1.5)`;
    }
    // Normal blurred mode (used on reveal screen)
    const blurAmount = Math.max(0, 28 - revealProgress * 28);
    const brightness = 0.6 + revealProgress * 0.4;
    return `blur(${blurAmount}px) brightness(${brightness})`;
  };

  const handleLoad = () => {
    setIsLoading(false);
    onReady?.();
  };

  const handleError = () => {
    if (!triedFallback && currentSrc.includes('maxresdefault')) {
      setTriedFallback(true);
      setCurrentSrc(currentSrc.replace('maxresdefault', 'hqdefault'));
      return;
    }
    setIsLoading(false);
    setHasError(true);
    onReady?.();
  };

  // Reset state when imageUrl changes
  useEffect(() => {
    setCurrentSrc(imageUrl);
    setIsLoading(true);
    setHasError(false);
    setTriedFallback(false);
  }, [imageUrl]);

  return (
    <div className="relative mx-auto overflow-hidden rounded-2xl border-2 border-primary/60 w-full bg-card aspect-[4/3]">
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl animate-spin-basketball">🏀</span>
            <span className="text-xs text-muted-foreground font-semibold tracking-wider">LOADING...</span>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80">
          <div className="flex flex-col items-center gap-2">
            <span className="font-display text-primary opacity-40 text-7xl">?</span>
            <span className="text-xs text-muted-foreground font-semibold">WHO IS THIS PLAYER?</span>
          </div>
        </div>
      )}

      {!hasError && (
        <img
          src={currentSrc}
          alt="Mystery player"
          onLoad={handleLoad}
          onError={handleError}
          draggable={false}
          className="w-full h-full object-cover transition-[filter] duration-300 select-none"
          style={{
            filter: getSilhouetteFilter(),
          }}
        />
      )}

      {/* Scan line + question mark when not revealed */}
      {!isRevealed && !isLoading && !hasError && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="animate-scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-primary opacity-30 text-6xl">?</span>
          </div>
        </>
      )}
    </div>
  );
}
