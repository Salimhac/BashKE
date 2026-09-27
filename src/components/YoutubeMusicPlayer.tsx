import React, { useState } from 'react';
import type { BirthdaySong } from '../utils/sound';
import { Play, Square, ExternalLink, X, Maximize2, Minimize2, Music2, Disc3, Youtube } from 'lucide-react';

interface YouTubeMusicPlayerProps {
  song: BirthdaySong | null;
  isPlaying: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  dedicatedBy?: string;
}

export const YouTubeMusicPlayer: React.FC<YouTubeMusicPlayerProps> = ({
  song,
  isPlaying,
  onClose,
  onTogglePlay,
  dedicatedBy,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!song) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-stone-900/95 text-white backdrop-blur-md rounded-2xl sm:rounded-3xl border border-stone-700/80 shadow-2xl overflow-hidden">
        {/* Expanded Video Embed Section */}
        {isExpanded && (
          <div className="relative aspect-video w-full bg-black border-b border-stone-800">
            {isPlaying ? (
              <iframe
                title={song.title}
                src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={song.thumbnailUrl}
                  alt={song.title}
                  className="w-full h-full object-cover opacity-50"
                />
                <button
                  onClick={onTogglePlay}
                  className="absolute p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Play"
                >
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compact Player Bar */}
        <div className="p-3 sm:p-4 flex items-center gap-3">
          {/* Thumbnail / Animated Disc */}
          <div className="relative shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-stone-700 bg-stone-800 flex items-center justify-center group shadow-inner">
            <img
              src={song.thumbnailUrl}
              alt={song.title}
              className={`w-full h-full object-cover transition-opacity ${
                isPlaying ? 'opacity-80' : 'opacity-60'
              }`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                <Disc3 className="w-6 h-6 text-red-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Song Information */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600 text-[10px] font-bold tracking-wide uppercase text-white shadow-2xs">
                <Youtube className="w-3 h-3 fill-white" />
                <span>YouTube</span>
              </span>
              <span className="text-[10px] text-stone-400 truncate">
                {song.genre} • {song.duration}
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-stone-100 truncate flex items-center gap-1.5">
              <span>{song.emoji}</span>
              <span className="truncate">{song.title}</span>
            </h4>

            <p className="text-[11px] text-stone-300 truncate">
              {song.artist}
              {dedicatedBy && (
                <span className="text-amber-400 text-[10px] ml-1.5 italic">
                  (dedication by {dedicatedBy})
                </span>
              )}
            </p>

            {/* Equalizer animation when playing */}
            {isPlaying && (
              <div className="flex items-end gap-0.5 mt-1.5 h-2">
                <span className="w-0.5 bg-red-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
                <span className="w-0.5 bg-red-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-1.5" />
                <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.2s] h-2" />
                <span className="w-0.5 bg-red-500 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.15s] h-1" />
                <span className="w-0.5 bg-amber-300 rounded-full animate-[pulse_0.45s_ease-in-out_infinite_0.3s] h-2" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Play/Stop button */}
            <button
              onClick={onTogglePlay}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
              }`}
              title={isPlaying ? 'Stop song' : 'Play song'}
            >
              {isPlaying ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Toggle Video Expand */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse video' : 'Watch YouTube video'}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Open on YouTube */}
            <a
              href={song.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-red-400 border border-stone-700 transition-colors cursor-pointer"
              title="Watch full video on YouTube.com"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close dock */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
              title="Dismiss player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hidden background audio iframe when playing in compact dock mode */}
        {!isExpanded && isPlaying && (
          <div className="hidden" aria-hidden="true">
            <iframe
              title={`${song.title}-audio`}
              src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
      </div>
    </div>
  );
};
