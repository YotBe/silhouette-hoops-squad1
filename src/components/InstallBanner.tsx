import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithMSStream extends Window {
  MSStream?: unknown;
}

const VISIT_KEY = 'sg_visit_count';
const DISMISS_KEY = 'sg_install_dismissed';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as NavigatorWithStandalone).standalone === true;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as WindowWithMSStream).MSStream;
}

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    const count = parseInt(localStorage.getItem(VISIT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));
    if (count < 3) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - parseInt(dismissed, 10) < SEVEN_DAYS) return;
    setShow(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') setShow(false);
      deferredPrompt.current = null;
    } else if (isIOS()) {
      setShowIOSHelp(true);
    }
  };

  if (!show) return null;

  return (
    <div className="w-full animate-slide-up">
      <div className="rounded-xl border-2 border-primary/60 bg-card p-3 shadow-lg">
        {showIOSHelp ? (
          <div className="flex items-start gap-2">
            <span className="text-2xl mt-0.5">📲</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Add to Home Screen</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap the <span className="inline-block">⬆️</span> Share button, then scroll down and tap <strong>"Add to Home Screen"</strong>
              </p>
            </div>
            <button onClick={dismiss} className="p-1 text-muted-foreground" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏀</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Install Shadow Guess</p>
              <p className="text-xs text-muted-foreground">Full experience on your home screen</p>
            </div>
            <button
              onClick={handleInstall}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider press-scale"
            >
              INSTALL
            </button>
            <button onClick={dismiss} className="p-1 text-muted-foreground" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
