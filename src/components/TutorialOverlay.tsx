import { useState } from 'react';

const SLIDES = [
  {
    icon: '🎬',
    title: 'Watch the Video',
    body: 'A disguised NBA player appears in a video. Study their moves, build, and style to figure out who it is.',
  },
  {
    icon: '💡',
    title: 'Use Hints Wisely',
    body: 'Stuck? Reveal hints — position, number, team — but each hint costs points. Save them for tough ones.',
  },
  {
    icon: '⚡',
    title: 'Power-Ups & Streaks',
    body: 'Chain correct answers for a streak multiplier. Every 5 in a row earns a power-up. Go for the high score!',
  },
];

interface Props {
  onDone: () => void;
}

export function TutorialOverlay({ onDone }: Props) {
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      setSlide(slide + 1);
    } else {
      localStorage.setItem('sg_tutorial_seen', '1');
      onDone();
    }
  };

  const s = SLIDES[slide];

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-6xl text-center mb-6">{s.icon}</div>
        <h2 className="text-3xl font-display text-gradient-title tracking-wider text-center mb-3">{s.title}</h2>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">{s.body}</p>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl gradient-hero text-white font-display text-xl tracking-widest press-scale"
          style={{ boxShadow: '0 4px 25px rgba(59, 130, 246, 0.4)' }}
        >
          {slide < SLIDES.length - 1 ? 'NEXT' : "LET'S PLAY"}
        </button>

        {slide < SLIDES.length - 1 && (
          <button
            onClick={() => { localStorage.setItem('sg_tutorial_seen', '1'); onDone(); }}
            className="w-full mt-3 py-2 text-xs text-muted-foreground press-scale"
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
