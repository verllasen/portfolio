export const playNotificationSound = (type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant "ding" / ascending chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'error') {
      // Error "buzz" / descending
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'warning') {
      // Warning "blip"
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(440, now + 0.2);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Info "bloop" (Water drop / Bubble sound)
      osc.type = 'sine';
      
      // Pitch bend for "bloop" effect
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      
      // Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02); // Fast attack
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // Fast decay
      
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Ignore audio errors (e.g. user didn't interact with document yet)
  }
};
