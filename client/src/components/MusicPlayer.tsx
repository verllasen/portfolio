import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, X, Music, Volume2, FolderPlus, Trash2 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const MusicPlayer = () => {
  const { 
    isPlayerOpen, togglePlayer, playlist, currentTrackIndex, 
    settings, updateSettings, playTrack, nextTrack, prevTrack, 
    addToPlaylist, setPlaylist
  } = useGameStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
          const newTracks = Array.from(files)
            .filter(file => file.type.startsWith('audio/'))
            .map(file => {
                // In Electron environment, file.path exposes the real path.
                // We prefer it for persistence.
                const filePath = (file as any).path; 
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    src: filePath ? `file://${filePath.replace(/\\/g, '/')}` : URL.createObjectURL(file),
                    artist: 'Local File'
                };
            });
          
          if (newTracks.length > 0) {
              // Append to playlist
              newTracks.forEach(track => addToPlaylist(track));
          }
      }
  };

  if (!isPlayerOpen) return null;

  const currentTrack = playlist[currentTrackIndex];

  return (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-8 z-[100] w-64 glass rounded-[2rem] overflow-hidden flex flex-col ring-1 ring-white/5"
        >
            {/* Header */}
            <div className="px-5 pt-5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-white/80 font-bold text-xs uppercase tracking-wider">
                    <Music size={12} className="text-primary" />
                    <span>Now Playing</span>
                </div>
                <button 
                    onClick={togglePlayer} 
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Current Track Art */}
            <div className="p-5 pb-2 text-center relative z-10">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-white/10 flex items-center justify-center mb-4 shadow-2xl shadow-primary/10 relative overflow-hidden group">
                    <Music size={32} className="text-white/20 group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Visualizer Effect */}
                    {settings.isMusicPlaying && (
                        <div className="absolute inset-0 flex items-end justify-center gap-1.5 pb-4 opacity-60">
                            {[...Array(6)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-1.5 bg-gradient-to-t from-primary to-transparent rounded-t-full animate-music-bar" 
                                    style={{ 
                                        height: `${20 + Math.random() * 60}%`, 
                                        animationDuration: `${0.6 + i * 0.1}s`,
                                        animationDelay: `-${i * 0.1}s`
                                    }} 
                                />
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-white font-bold truncate text-lg">{currentTrack?.title || 'Нет трека'}</h3>
                    <p className="text-white/40 text-xs truncate font-medium tracking-wide">{currentTrack?.artist || 'Неизвестный исполнитель'}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="px-5 pb-5 relative z-10">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <button onClick={prevTrack} className="p-2 text-white/40 hover:text-white transition-colors hover:scale-110 active:scale-95">
                        <SkipBack size={20} />
                    </button>
                    <button 
                        onClick={() => updateSettings({ isMusicPlaying: !settings.isMusicPlaying })}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                    >
                        {settings.isMusicPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                    </button>
                    <button onClick={nextTrack} className="p-2 text-white/40 hover:text-white transition-colors hover:scale-110 active:scale-95">
                        <SkipForward size={20} />
                    </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <Volume2 size={14} className="text-white/40 ml-1" />
                    <input 
                        type="range" 
                        min="0" max="100" 
                        value={settings.musicVolume}
                        onChange={(e) => updateSettings({ musicVolume: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                </div>
            </div>

            {/* Playlist (Compact) */}
            <div className="flex-1 bg-black/40 border-t border-white/5 max-h-32 overflow-y-auto custom-scrollbar relative z-10">
                {playlist.map((track, idx) => (
                    <div 
                        key={track.id}
                        onClick={() => playTrack(idx)}
                        className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group ${
                            idx === currentTrackIndex 
                                ? 'bg-white/5' 
                                : 'hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-1 rounded-full transition-all ${idx === currentTrackIndex ? 'bg-primary h-6' : 'bg-white/10 h-3 group-hover:h-4'}`} />
                            <div className="truncate">
                                <div className={`text-xs font-bold truncate ${idx === currentTrackIndex ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>{track.title}</div>
                            </div>
                        </div>
                        {idx === currentTrackIndex && (
                            <div className="flex gap-0.5 items-end h-3">
                                <div className="w-0.5 bg-primary animate-music-bar h-full" style={{ animationDuration: '0.5s' }} />
                                <div className="w-0.5 bg-primary animate-music-bar h-2/3" style={{ animationDuration: '0.7s' }} />
                                <div className="w-0.5 bg-primary animate-music-bar h-full" style={{ animationDuration: '0.6s' }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-white/5 bg-black/40 flex gap-2 relative z-10">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-white/60 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wide"
                >
                    <FolderPlus size={12} /> Add
                </button>
                <button 
                    onClick={() => setPlaylist([])}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/5 text-white/40 hover:text-red-400 transition-all"
                    title="Clear Playlist"
                >
                    <Trash2 size={14} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="audio/*" 
                    onChange={handleFileSelect}
                />
            </div>
            
            {/* Background Glow */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        </motion.div>
    </AnimatePresence>
  );
};

