// Lightweight Web Audio API synthesizer for tactile sounds (chimes, candles, confetti)
// Real Birthday Songs are powered by the 5 Official YouTube Birthday Tracks

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
 * Celebratory pentatonic chime for wish delivery and bash celebrations
 */
export function playCelebrationChime() {
  if (!getSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

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
// 5 REAL BIRTHDAY SONGS (Official YouTube Tracks & Videos)
// -------------------------------------------------------------

export interface BirthdaySong {
  id: string;
  title: string;
  artist: string;
  genre: string;
  emoji: string;
  youtubeId: string;
  youtubeUrl: string;
  duration: string;
  tagline: string;
  thumbnailUrl: string;
}

// Exactly 5 Real Birthday Songs:
export const BIRTHDAY_SONGS: BirthdaySong[] = [
  {
    id: 'stevie_wonder_birthday',
    title: 'Happy Birthday',
    artist: 'Stevie Wonder',
    genre: 'Soul Classic',
    emoji: '🎂',
    youtubeId: 'inS9gAgSENE',
    youtubeUrl: 'https://www.youtube.com/watch?v=inS9gAgSENE',
    duration: '5:58',
    tagline: 'The iconic legendary celebration anthem loved worldwide',
    thumbnailUrl: 'https://img.youtube.com/vi/inS9gAgSENE/mqdefault.jpg',
  },
  {
  id: 'matata_kata',
  title: 'KATA',
  artist: 'MATATA',
  genre: 'East African Gengetone Bash',
  emoji: '🔥',
  youtubeId: 's331bxKlTqQ',
  youtubeUrl: 'https://youtu.be/s331bxKlTqQ',
  duration: '3:38',
  tagline: 'The high-energy Kenyan gengetone anthem for turning up the celebration',
  thumbnailUrl: 'https://img.youtube.com/vi/s331bxKlTqQ/mqdefault.jpg',
},
  {
    id: 'kool_gang_celebration',
    title: 'Celebration',
    artist: 'Kool & The Gang',
    genre: 'Party Funk Anthem',
    emoji: '🎷',
    youtubeId: '3GwjfUFyY6M',
    youtubeUrl: 'https://www.youtube.com/watch?v=3GwjfUFyY6M',
    duration: '3:42',
    tagline: 'Universal party anthem — "Celebrate good times, come on!"',
    thumbnailUrl: 'https://img.youtube.com/vi/3GwjfUFyY6M/mqdefault.jpg',
  },
  {
  id: 'vybzkartel_drinkup',
  title: 'Drink Up (Remastered)',
  artist: 'Vybz Kartel',
  genre: 'Dancehall Party',
  emoji: '🥂',
  youtubeId: '0SkXUEZB81s',
  youtubeUrl: 'https://youtu.be/0SkXUEZB81s',
  duration: '2:58',
  tagline: 'The iconic dancehall party anthem — guaranteed to ignite any celebration',
  thumbnailUrl: 'https://img.youtube.com/vi/0SkXUEZB81s/mqdefault.jpg',
},
  {
  id: 'traditional_birthday_bash',
  title: 'Happy Birthday (AI Video)',
  artist: 'Busy Signal',
  genre: 'Dancehall Birthday Anthem',
  emoji: '🕯️',
  youtubeId: 'WmBs0SQ6Gi0',
  youtubeUrl: 'https://youtu.be/WmBs0SQ6Gi0',
  duration: '3:12',
  tagline: 'The timeless classic for candle lighting & cake cutting moments',
  thumbnailUrl: 'https://img.youtube.com/vi/WmBs0SQ6Gi0/mqdefault.jpg',
},
];

// Backward-compatible alias for existing codebase
export type BashTrack = BirthdaySong;
export const KENYAN_BASH_TRACKS = BIRTHDAY_SONGS;

/**
 * Finds a song by ID with backward compatibility for previously saved wishes
 */
export function findBirthdaySong(id?: string): BirthdaySong | undefined {
  if (!id) return undefined;
  const match = BIRTHDAY_SONGS.find((s) => s.id === id);
  if (match) return match;

  // Map legacy synthesized track IDs to the 5 real songs
  switch (id) {
    case 'birthday_bash':
      return BIRTHDAY_SONGS.find((s) => s.id === 'traditional_birthday_bash');
    case 'sauti_sol':
      return BIRTHDAY_SONGS.find((s) => s.id === 'harmonize_birthday');
    case 'rhumba':
      return BIRTHDAY_SONGS.find((s) => s.id === 'rayvanny_birthday');
    case 'genge':
      return BIRTHDAY_SONGS.find((s) => s.id === 'kool_gang_celebration');
    case 'nyashinski':
    case 'benga':
      return BIRTHDAY_SONGS.find((s) => s.id === 'stevie_wonder_birthday');
    default:
      return undefined;
  }
}

// Fallback handlers for legacy audio calls
export function stopBashTrackMelody() {
  // Handled by modern YouTube player component
}

export function getCurrentPlayingTrackId(): string | null {
  return null;
}

export function playBashTrackMelody(_trackId: string, onEnded?: () => void): () => void {
  // Real songs now play through the YouTube player
  if (onEnded) {
    setTimeout(onEnded, 100);
  }
  return () => {};
}
