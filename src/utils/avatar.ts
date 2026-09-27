// Generates pleasant, deterministic soft gradients for anonymous profile avatars

const PALETTES = [
  { bg: 'bg-amber-100 text-amber-800 border-amber-200', gradient: 'from-amber-200 to-orange-100 text-amber-900' },
  { bg: 'bg-rose-100 text-rose-800 border-rose-200', gradient: 'from-rose-200 to-pink-100 text-rose-900' },
  { bg: 'bg-teal-100 text-teal-800 border-teal-200', gradient: 'from-teal-200 to-emerald-100 text-teal-900' },
  { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', gradient: 'from-indigo-200 to-purple-100 text-indigo-900' },
  { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', gradient: 'from-emerald-200 to-lime-100 text-emerald-900' },
  { bg: 'bg-violet-100 text-violet-800 border-violet-200', gradient: 'from-violet-200 to-fuchsia-100 text-violet-900' },
  { bg: 'bg-sky-100 text-sky-800 border-sky-200', gradient: 'from-sky-200 to-cyan-100 text-sky-900' },
];

export function getAvatarStyle(seed?: string) {
  const safeSeed = seed || 'default_seed';
  let hash = 0;
  for (let i = 0; i < safeSeed.length; i++) {
    hash = safeSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

export function getInitials(displayName?: string): string {
  if (!displayName || typeof displayName !== 'string') return '??';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}
