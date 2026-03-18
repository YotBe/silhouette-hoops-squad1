interface SgWindow extends Window {
  __sgMuted?: boolean;
  __sgAudioCtx?: AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const w = window as SgWindow;

// Global mute flag — checked by all audio
export function isSFXMuted(): boolean {
  return !!w.__sgMuted;
}

export function setSFXMuted(val: boolean) {
  w.__sgMuted = val;
}

const audioCtx = () => {
  if (!w.__sgAudioCtx) {
    const AudioCtx = window.AudioContext || w.webkitAudioContext;
    w.__sgAudioCtx = new AudioCtx();
  }
  return w.__sgAudioCtx as AudioContext;
};

// ─── Helpers ───

function playOsc(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.1, filterFreq = 4000, filterQ = 0.7, freqEnd?: number) {
  if (isSFXMuted()) return;
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
  filter.Q.setValueAtTime(filterQ, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playLayered(freq: number, detune: number, duration: number, type: OscillatorType = 'sine', volume = 0.1, filterFreq = 4000) {
  if (isSFXMuted()) return;
  const ctx = audioCtx();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
  filter.Q.setValueAtTime(0.7, ctx.currentTime);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  for (const d of [-detune, 0, detune]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime(d, ctx.currentTime);
    osc.connect(filter);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}

function playNoise(duration: number, filterFreq: number, filterType: BiquadFilterType = 'bandpass', volume = 0.08, filterQ = 1, freqEnd?: number) {
  if (isSFXMuted()) return;
  const ctx = audioCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
  if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  filter.Q.setValueAtTime(filterQ, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

/** Deep sub-bass hit with slight distortion — 2K signature */
function playBass(freq: number, duration: number, volume = 0.18) {
  if (isSFXMuted()) return;
  const ctx = audioCtx();

  // Sub oscillator
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(freq, ctx.currentTime);
  sub.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + duration);

  // Harmonic layer for grit
  const harm = ctx.createOscillator();
  harm.type = 'triangle';
  harm.frequency.setValueAtTime(freq * 2, ctx.currentTime);
  harm.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + duration * 0.5);

  // Waveshaper for subtle distortion
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128) - 1;
    curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
  }
  shaper.curve = curve;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, ctx.currentTime);
  filter.Q.setValueAtTime(1, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  sub.connect(shaper);
  harm.connect(shaper);
  shaper.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  sub.start(); sub.stop(ctx.currentTime + duration);
  harm.start(); harm.stop(ctx.currentTime + duration);
}

/** Arena crowd swell — shaped noise burst */
function playCrowd(duration: number, volume = 0.04, rising = true) {
  if (isSFXMuted()) return;
  const ctx = audioCtx();
  const bufLen = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.setValueAtTime(rising ? 800 : 2000, ctx.currentTime);
  f1.frequency.exponentialRampToValueAtTime(rising ? 3000 : 600, ctx.currentTime + duration);
  f1.Q.setValueAtTime(0.8, ctx.currentTime);

  const g = ctx.createGain();
  if (rising) {
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume, ctx.currentTime + duration * 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  } else {
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  src.connect(f1);
  f1.connect(g);
  g.connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duration);
}

// ─── SFX ───

export const SFX = {
  /** Correct: crisp net swish + bass boom + shimmer chord + crowd swell */
  correct: () => {
    if (isSFXMuted()) return;
    // Bass boom
    playBass(60, 0.4, 0.2);
    // Sharp net swish — wider band for that crisp "all net" sound
    playNoise(0.18, 4000, 'highpass', 0.1, 1.2);
    playNoise(0.12, 8000, 'highpass', 0.06, 0.6);
    // "Green release" shimmer — metallic ring
    setTimeout(() => {
      playLayered(2600, 18, 0.5, 'triangle', 0.07, 8000);
      playLayered(3900, 12, 0.35, 'sine', 0.035, 10000);
    }, 50);
    // Rising bling chord: C5→E5→G5→C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playLayered(freq, 15, 0.35, 'triangle', 0.055, 6000);
      }, 60 + i * 40);
    });
    // Bright sparkle finish
    setTimeout(() => {
      playLayered(2093, 20, 0.3, 'sine', 0.04, 10000);
    }, 250);
    // Crowd swell
    setTimeout(() => playCrowd(0.5, 0.04, true), 100);
  },

  /** Wrong: heavy rim clank + full arena buzzer + crowd groan */
  wrong: () => {
    if (isSFXMuted()) return;
    // Metallic rim clank
    playOsc(280, 0.25, 'triangle', 0.14, 800, 2);
    playOsc(560, 0.12, 'square', 0.04, 600, 1.5);
    // Bass thud
    playBass(50, 0.35, 0.18);
    // Arena buzzer — three stacked square waves for full NBA buzzer
    setTimeout(() => {
      playOsc(110, 0.5, 'square', 0.1, 350, 0.5);
      playOsc(138, 0.5, 'square', 0.08, 320, 0.5);
      playOsc(82, 0.5, 'square', 0.06, 250, 0.4);
    }, 40);
    // Crowd groan (louder, longer)
    setTimeout(() => playCrowd(0.55, 0.045, false), 60);
  },

  /** Timeout: shot clock violation horn */
  timeout: () => {
    if (isSFXMuted()) return;
    // Two-tone horn blast
    playOsc(200, 0.5, 'square', 0.14, 500, 0.5, 150);
    playOsc(250, 0.5, 'sawtooth', 0.06, 400, 0.5, 180);
    // Sub rumble
    playBass(45, 0.6, 0.18);
    // Distorted overtone
    setTimeout(() => {
      playOsc(150, 0.4, 'square', 0.05, 350, 1, 100);
    }, 100);
    // Crowd murmur
    setTimeout(() => playCrowd(0.6, 0.025, false), 150);
  },

  /** Reveal: 2K player intro whoosh + bass drop + dramatic stinger */
  reveal: () => {
    if (isSFXMuted()) return;
    // Deep whoosh sweep (wider range)
    playNoise(0.4, 150, 'bandpass', 0.1, 1.2, 10000);
    // Bass drop hit
    setTimeout(() => playBass(55, 0.5, 0.22), 200);
    // Dramatic stinger chord
    setTimeout(() => {
      playLayered(440, 15, 0.6, 'triangle', 0.06, 3000);
      playLayered(554, 12, 0.5, 'triangle', 0.05, 3000);
      playLayered(659, 10, 0.45, 'sine', 0.04, 4000);
    }, 250);
    // High sparkle shimmer
    setTimeout(() => {
      playLayered(2200, 20, 0.4, 'triangle', 0.03, 8000);
    }, 350);
  },

  /** XP tick: snappy UI click with sub-bass */
  xpTick: () => {
    if (isSFXMuted()) return;
    playLayered(1400, 8, 0.035, 'triangle', 0.04, 5000);
    playOsc(60, 0.03, 'sine', 0.06, 200, 0.5);
  },

  /** Card captured: bass thump + holographic shimmer + badge chime */
  cardCaptured: () => {
    if (isSFXMuted()) return;
    // Bass thump
    playBass(50, 0.35, 0.2);
    // Card flip noise
    playNoise(0.1, 4000, 'bandpass', 0.08, 2);
    // Holographic shimmer sweep
    setTimeout(() => {
      playNoise(0.4, 2000, 'bandpass', 0.04, 1.5, 12000);
    }, 80);
    // Badge earned chime (2K style ascending)
    const notes = [659, 831, 988, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playLayered(freq, 18, 0.45 - i * 0.05, 'triangle', 0.06, 6000);
      }, 100 + i * 55);
    });
    // Final sparkle
    setTimeout(() => {
      playLayered(1760, 20, 0.4, 'sine', 0.03, 8000);
    }, 380);
  },

  /** Shot clock tick — sharp percussive */
  tick: () => {
    if (isSFXMuted()) return;
    playOsc(800, 0.025, 'square', 0.06, 1500, 3);
    playNoise(0.02, 3000, 'highpass', 0.04, 2);
  },

  /** Urgent tick — adds sub-bass throb */
  tickUrgent: () => {
    if (isSFXMuted()) return;
    playOsc(1000, 0.03, 'square', 0.09, 2000, 4);
    playNoise(0.03, 5000, 'highpass', 0.06, 3);
    playOsc(50, 0.06, 'sine', 0.1, 150, 0.5);
  },

  /** Streak: "on fire" siren sweep + crowd roar + bass pulse */
  streak: () => {
    if (isSFXMuted()) return;
    // Ascending siren sweep
    playOsc(400, 0.6, 'sawtooth', 0.06, 2000, 1, 1600);
    playOsc(400, 0.6, 'triangle', 0.05, 2500, 0.7, 1600);
    // Rising arpeggio
    const notes = [523, 659, 784, 988, 1175];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playLayered(freq, 15, 0.45, 'triangle', 0.06, 5000);
      }, i * 55);
    });
    // Bass pulse
    setTimeout(() => playBass(50, 0.4, 0.2), 80);
    // Crowd roar
    setTimeout(() => playCrowd(0.7, 0.05, true), 150);
    // Sparkle tail
    setTimeout(() => {
      playNoise(0.35, 5000, 'highpass', 0.025, 1);
    }, 300);
  },

  /** Game over: final buzzer horn + crowd ambiance + descending bass */
  gameOver: () => {
    if (isSFXMuted()) return;
    // Long dramatic buzzer horn
    playOsc(180, 0.8, 'square', 0.1, 400, 0.5, 120);
    playOsc(226, 0.8, 'square', 0.07, 380, 0.5, 150);
    // Descending bass
    setTimeout(() => playBass(60, 0.7, 0.18), 100);
    // Descending melody
    const notes = [440, 392, 349, 311, 261];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playLayered(freq, 15, 0.6, 'triangle', 0.05, 1800);
      }, 150 + i * 130);
    });
    // Crowd ambiance fade
    setTimeout(() => playCrowd(1.0, 0.035, false), 200);
    // Low rumble tail
    setTimeout(() => playOsc(40, 0.8, 'sine', 0.12, 100, 0.3), 400);
  },

  /** Hint: coach timeout whistle */
  hint: () => {
    if (isSFXMuted()) return;
    // Sharp whistle (high noise burst)
    playNoise(0.12, 7000, 'bandpass', 0.1, 3);
    playOsc(3200, 0.1, 'sine', 0.06, 8000, 1);
    // Short echo
    setTimeout(() => {
      playNoise(0.08, 5000, 'bandpass', 0.04, 2);
    }, 100);
  },

  /** Start: tip-off whistle + organ riff + crowd noise */
  start: () => {
    if (isSFXMuted()) return;
    // Tip-off whistle
    playNoise(0.1, 8000, 'highpass', 0.1, 2);
    playOsc(3500, 0.12, 'sine', 0.07, 8000, 1);
    // Arena organ ascending chord
    const notes = [262, 330, 392, 523];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playLayered(freq, 12, 0.4, 'triangle', 0.07, 4000);
      }, 80 + i * 50);
    });
    // Bass foundation
    setTimeout(() => playBass(55, 0.3, 0.15), 60);
    // Crowd noise swell
    setTimeout(() => playCrowd(0.5, 0.04, true), 200);
  },
};
