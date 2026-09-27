// Lightweight Web Audio API synthesizer for celebratory chimes and candle lighting

let audioCtx: AudioContext | null = null;
let isAudioEnabled = true;

export function toggleSound(enabled?: boolean) {
  if (enabled !== undefined) {
    isAudioEnabled = enabled;
  } else {
    isAudioEnabled = !isAudioEnabled;
  }
  try {
    localStorage.setItem('birthdayboard_sound_enabled', isAudioEnabled ? 'true' : 'false');
  } catch {
    // Ignore storage issues in iframe
  }
  return isAudioEnabled;
}

export function getSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem('birthdayboard_sound_enabled');
    if (val !== null) return val === 'true';
  } catch {
    // fallback
  }
  return true;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Celebratory African kalimba/marimba pentatonic chime for wish delivery and bash celebrations
 */
export function playCelebrationChime() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // African major pentatonic arpeggio (C5, D5, E5, G5, A5, C6) with warm woody wooden resonance
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.065);

    gain.gain.setValueAtTime(0, now + idx * 0.065);
    gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.065 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.065 + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.065);
    osc.stop(now + idx * 0.065 + 0.9);
  });
}

/**
 * Gentle warm sparkle chime for lighting candles
 */
export function playCandleGlowSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [659.25, 880, 1174.66]; // E5, A5, D6
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0, now + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.65);
  });
}

/**
 * Soft wax seal tap click
 */
export function playWaxSealClick() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.055);
}

/**
 * Soft breath whoosh / puff sound for extinguishing a candle
 */
export function playCandleBlowSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.35; // 350ms of pink/white noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.36);
}

/**
 * Celebratory triumphant fanfare for when all candles are blown or wishes sent
 */
export function playFanfareSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // A triumphant arpeggio: C5 -> E5 -> G5 -> C6 (held)
  const sequence = [
    { freq: 523.25, time: 0, dur: 0.12 },
    { freq: 659.25, time: 0.1, dur: 0.12 },
    { freq: 783.99, time: 0.2, dur: 0.14 },
    { freq: 1046.5, time: 0.32, dur: 0.8 },
    { freq: 1318.51, time: 0.45, dur: 0.7 },
  ];

  sequence.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.01, now + time);
    gain.gain.linearRampToValueAtTime(0.14, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Confetti pop sound
 */
export function playPopSound() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

// -------------------------------------------------------------
// KENYAN BASH MUSIC WISHES - Web Audio Melodic Synthesizer
// -------------------------------------------------------------

export interface BashTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  emoji: string;
}

export const KENYAN_BASH_TRACKS: BashTrack[] = [
  {
    id: 'sauti_sol',
    title: 'Suzanna',
    artist: 'Sauti Sol',
    genre: 'Afropop Bash',
    emoji: '🎷',
  },
  {
    id: 'rhumba',
    title: 'Mbwe Mbwe',
    artist: 'Bien & Aaron Rimbui',
    genre: 'Kenyan Rhumba',
    emoji: '🎸',
  },
  {
    id: 'genge',
    title: 'Boomba Train',
    artist: 'Nameless & E-Sir',
    genre: 'Genge Party Anthem',
    emoji: '🥁',
  },
  {
    id: 'birthday_bash',
    title: 'Angalia Keki (Happy Birthday)',
    artist: 'Kenyan Bash Anthem',
    genre: 'Celebration Classic',
    emoji: '🎂',
  },
  {
    id: 'nyashinski',
    title: 'Malaika',
    artist: 'Nyashinski',
    genre: 'Soulful Baraka',
    emoji: '🪘',
  },
  {
    id: 'benga',
    title: 'Benga Sunrise',
    artist: 'Traditional Kalimba Beat',
    genre: 'Folk Rhythms',
    emoji: '🎋',
  },
];

let activeTrackNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let currentPlayingTrackId: string | null = null;
let currentTrackTimeout: any = null;

export function stopBashTrackMelody() {
  if (currentTrackTimeout) {
    clearTimeout(currentTrackTimeout);
    currentTrackTimeout = null;
  }
  activeTrackNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.setValueAtTime(0.0001, 0);
      osc.stop();
    } catch {}
  });
  activeTrackNodes = [];
  currentPlayingTrackId = null;
}

export function getCurrentPlayingTrackId(): string | null {
  return currentPlayingTrackId;
}

/**
 * Synthesizes celebratory Kenyan party music melodies
 */
export function playBashTrackMelody(trackId: string, onEnded?: () => void): () => void {
  stopBashTrackMelody();
  if (!getSoundEnabled()) {
    if (onEnded) onEnded();
    return () => {};
  }

  const ctx = getAudioContext();
  if (!ctx) {
    if (onEnded) onEnded();
    return () => {};
  }

  const now = ctx.currentTime + 0.05;
  currentPlayingTrackId = trackId;

  // Track note schedules [freq (Hz), start offset (s), duration (s), type ('sine' | 'triangle' | 'sawtooth'), gain]
  type NoteDef = [number, number, number, OscillatorType, number];
  let notes: NoteDef[] = [];
  let totalDuration = 4.0;

  switch (trackId) {
    case 'birthday_bash': {
      // "Happy Birthday to you / Angalia keki..." Kenyan party style
      // Solfege: G4, G4, A4, G4, C5, B4 | G4, G4, A4, G4, D5, C5
      const G4 = 392.0;
      const A4 = 440.0;
      const B4 = 493.88;
      const C5 = 523.25;
      const D5 = 587.33;
      const E5 = 659.25;

      notes = [
        [G4, 0.0, 0.22, 'triangle', 0.14],
        [G4, 0.28, 0.18, 'triangle', 0.14],
        [A4, 0.52, 0.42, 'triangle', 0.16],
        [G4, 1.0, 0.42, 'triangle', 0.16],
        [C5, 1.48, 0.42, 'triangle', 0.18],
        [B4, 1.95, 0.75, 'triangle', 0.16],

        // Second bar
        [G4, 2.75, 0.22, 'triangle', 0.14],
        [G4, 3.02, 0.18, 'triangle', 0.14],
        [A4, 3.25, 0.42, 'triangle', 0.16],
        [G4, 3.72, 0.42, 'triangle', 0.16],
        [D5, 4.2, 0.42, 'triangle', 0.18],
        [C5, 4.68, 0.95, 'triangle', 0.2],

        // Celebratory bass rhythm accompaniment
        [130.81, 0.0, 0.35, 'sine', 0.15],
        [130.81, 1.0, 0.35, 'sine', 0.15],
        [146.83, 2.0, 0.35, 'sine', 0.15],
        [130.81, 3.0, 0.35, 'sine', 0.15],
        [130.81, 4.68, 0.8, 'sine', 0.18],
      ];
      totalDuration = 5.8;
      break;
    }

    case 'rhumba': {
      // Congolese-Kenyan Rhumba guitar groove (Mbwe Mbwe style: syncopated sweet arpeggios)
      const cMajor = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      const gMajor = [246.94, 293.66, 392.0, 493.88, 587.33, 783.99];
      const fMajor = [261.63, 349.23, 440.0, 523.25, 698.46, 880.0];

      const rNotes: NoteDef[] = [];
      const bpm = 115;
      const beat = 60 / bpm;

      // Play syncopated sweet guitar lick
      const lick = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: beat * 0.5 },
        { f: 783.99, t: beat * 0.75 },
        { f: 659.25, t: beat * 1.25 },
        { f: 523.25, t: beat * 1.5 },
        { f: 440.0, t: beat * 2.0 },
        { f: 493.88, t: beat * 2.5 },
        { f: 523.25, t: beat * 2.85 },
        { f: 587.33, t: beat * 3.5 },
        { f: 659.25, t: beat * 4.0 },
        { f: 783.99, t: beat * 4.5 },
        { f: 1046.5, t: beat * 5.0 },
      ];

      lick.forEach(({ f, t }) => {
        rNotes.push([f, t, 0.22, 'triangle', 0.14]);
        // Bass groove
        rNotes.push([f / 4, t, 0.18, 'sine', 0.12]);
      });

      notes = rNotes;
      totalDuration = 4.2;
      break;
    }

    case 'sauti_sol': {
      // Afropop bouncy melodic riff (Suzanna groove: smooth & uplifting)
      const fA = 440.0;
      const fC = 523.25;
      const fD = 587.33;
      const fE = 659.25;
      const fG = 783.99;

      notes = [
        [fA, 0.0, 0.18, 'sine', 0.15],
        [fC, 0.2, 0.18, 'triangle', 0.16],
        [fD, 0.4, 0.22, 'triangle', 0.18],
        [fE, 0.65, 0.35, 'triangle', 0.18],
        [fD, 1.05, 0.2, 'triangle', 0.15],
        [fC, 1.3, 0.25, 'triangle', 0.16],
        [fA, 1.6, 0.45, 'sine', 0.18],
        // Second loop
        [fC, 2.1, 0.18, 'triangle', 0.16],
        [fD, 2.35, 0.2, 'triangle', 0.16],
        [fE, 2.6, 0.25, 'triangle', 0.18],
        [fG, 2.9, 0.4, 'triangle', 0.2],
        [fE, 3.35, 0.65, 'sine', 0.18],
      ];
      totalDuration = 4.2;
      break;
    }

    case 'genge': {
      // Boomba Train party beat: punchy rhythmic pulse + syncopated horn stab
      notes = [
        // Bass pulses
        [110.0, 0.0, 0.16, 'sawtooth', 0.14],
        [110.0, 0.35, 0.16, 'sawtooth', 0.14],
        [130.81, 0.7, 0.25, 'sawtooth', 0.16],
        [98.0, 1.05, 0.2, 'sawtooth', 0.14],
        [110.0, 1.4, 0.16, 'sawtooth', 0.14],
        [110.0, 1.75, 0.16, 'sawtooth', 0.14],
        [146.83, 2.1, 0.3, 'sawtooth', 0.16],
        // Party horn stabs
        [440.0, 0.18, 0.12, 'triangle', 0.15],
        [523.25, 0.18, 0.12, 'triangle', 0.15],
        [659.25, 0.18, 0.12, 'triangle', 0.15],

        [440.0, 1.22, 0.12, 'triangle', 0.15],
        [523.25, 1.22, 0.12, 'triangle', 0.15],
        [659.25, 1.22, 0.12, 'triangle', 0.15],

        [493.88, 2.28, 0.25, 'triangle', 0.18],
        [587.33, 2.28, 0.25, 'triangle', 0.18],
        [740.0, 2.28, 0.25, 'triangle', 0.18],
      ];
      totalDuration = 3.6;
      break;
    }

    case 'nyashinski': {
      // Malaika acoustic baraka serenade
      const notesM = [329.63, 392.0, 493.88, 587.33, 659.25, 783.99];
      const mSeq: NoteDef[] = [];
      let t = 0;
      for (let i = 0; i < 8; i++) {
        const freq = notesM[i % notesM.length];
        mSeq.push([freq, t, 0.35, 'triangle', 0.12]);
        mSeq.push([freq / 2, t, 0.25, 'sine', 0.1]);
        t += 0.32;
      }
      notes = mSeq;
      totalDuration = 3.5;
      break;
    }

    case 'benga':
    default: {
      // Benga folk kalimba beat (rapid joyful African marimba)
      const bScale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const bSeq: NoteDef[] = [];
      const pattern = [0, 2, 4, 3, 2, 4, 5, 4, 2, 1, 0];
      pattern.forEach((idx, i) => {
        bSeq.push([bScale[idx], i * 0.18, 0.2, 'triangle', 0.13]);
        if (i % 2 === 0) {
          bSeq.push([bScale[idx] / 2, i * 0.18, 0.15, 'sine', 0.11]);
        }
      });
      notes = bSeq;
      totalDuration = pattern.length * 0.18 + 0.5;
      break;
    }
  }

  notes.forEach(([freq, offset, dur, type, gainVal]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + offset);

    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(gainVal, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + offset);
    osc.stop(now + offset + dur + 0.05);

    activeTrackNodes.push({ osc, gain });
  });

  currentTrackTimeout = setTimeout(() => {
    currentPlayingTrackId = null;
    activeTrackNodes = [];
    if (onEnded) onEnded();
  }, totalDuration * 1000);

  return stopBashTrackMelody;
}
