import { useEffect, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface Props {
  youtubeId: string;
  open: boolean;
  onClose: () => void;
}

export function VideoModal({ youtubeId, open, onClose }: Props) {
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, handleEsc]);

  if (!open) return null;

  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}>
      <div className="relative w-full max-w-2xl mx-4 aspect-video rounded-2xl overflow-hidden border-2 border-primary/40 shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
        onClick={(e) => e.stopPropagation()}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Iconic Moment"
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border text-foreground hover:bg-background press-scale"
          aria-label="Close video"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Fallback link if embed is blocked */}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors press-scale"
      >
        <ExternalLink className="w-4 h-4" />
        Open in YouTube
      </a>
    </div>
  );
}
