import { useEffect, useRef } from 'react';

const MUSIC_FILE = '/music/J - COLE 1 HOUR CHILL SONGS 2022 - New Relaxing [p4ke8SXPCyQ].mp3';
const MUSIC_VOLUME = 0.18;

export function useBackgroundMusic(muted: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const audio = new Audio(MUSIC_FILE);
    audio.loop = true;
    audio.volume = MUSIC_VOLUME;
    audioRef.current = audio;

    const startOnInteraction = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (!mutedRef.current) audio.play().catch(() => {});
    };

    document.addEventListener('click', startOnInteraction, { once: true });
    document.addEventListener('touchstart', startOnInteraction, { once: true });

    return () => {
      audio.pause();
      document.removeEventListener('click', startOnInteraction);
      document.removeEventListener('touchstart', startOnInteraction);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !startedRef.current) return;
    if (muted) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [muted]);
}
