import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export const BackgroundMusic = () => {
  const { settings, playlist, currentTrackIndex, nextTrack } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate effective volume (0-1)
  const effectiveVolume = (settings.musicVolume / 100) * 0.5; // Cap at 50% base volume

    // Separate effect for volume to ensure responsiveness
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = effectiveVolume;
        }
    }, [effectiveVolume]);

    useEffect(() => {
        // Create audio element if it doesn't exist
        if (!audioRef.current) {
            audioRef.current = new Audio();
            // Handle track end for sequential playback
            audioRef.current.addEventListener('ended', () => {
                nextTrack();
            });
            audioRef.current.addEventListener('error', (e) => {
                console.error("Audio error:", e);
                // Optionally skip to next track on error
                // nextTrack(); 
            });
        }

        const audio = audioRef.current;
        
        // Safety check for empty playlist
        if (!playlist || playlist.length === 0) {
            audio.pause();
            return;
        }

        const currentTrack = playlist[currentTrackIndex];

        if (currentTrack) {
            const newSrc = currentTrack.src;
            
            // Track change detection
            if ((audio as any)._currentTrackId !== currentTrack.id) {
                audio.src = newSrc;
                (audio as any)._currentTrackId = currentTrack.id;
                
                // If we changed track and music is enabled, play immediately
                if (settings.isMusicPlaying) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.error("Play error (track change):", error);
                        });
                    }
                }
            }
        }

        if (settings.isMusicPlaying) {
            if (audio.paused && audio.src) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Audio play blocked:", error);
                    });
                }
            }
        } else {
            if (!audio.paused) {
                audio.pause();
            }
        }

        // Cleanup not needed for audio element persistence
    }, [settings.isMusicPlaying, currentTrackIndex, playlist, nextTrack]); // Removed effectiveVolume from here

  return null;
};
