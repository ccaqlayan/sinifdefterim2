// Singleton Web Audio Context to avoid browser context exhaustion and guarantee zero-latency playback
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

// User-gesture unlocker
export function initAudio() {
  getAudioContext();
}

// Web Audio API synthesized sound feedback for instant (+ / -) scoring
export function playScoreSound(type: 'plus' | 'minus') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'plus') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12); // A3
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Audio context allowed after first user interaction
  }

  if (navigator.vibrate) {
    navigator.vibrate(type === 'plus' ? 25 : [20, 30, 20]);
  }
}

// Tick sound for wheel slice passing
export function playWheelTickSound(volume = 0.15) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Crisp wood/plastic click pitch
    const pitch = 700 + Math.random() * 150;
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(Math.min(0.25, volume), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.035);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

// Rich celebratory fanfare victory sound when winner is revealed
export function playVictoryFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Triumphant fanfare arpeggio (C5 -> E5 -> G5 -> C6 chord crescendo)
    const melody = [
      { freq: 523.25, time: 0.0, dur: 0.14 },    // C5
      { freq: 659.25, time: 0.13, dur: 0.14 },   // E5
      { freq: 783.99, time: 0.26, dur: 0.16 },   // G5
      { freq: 1046.50, time: 0.42, dur: 0.65 },  // C6 (Triumphant long note)
    ];

    // Harmonizing supporting chord notes on the finale
    const harmony = [
      { freq: 523.25, time: 0.42, dur: 0.65 },   // C5
      { freq: 659.25, time: 0.42, dur: 0.65 },   // E5
      { freq: 783.99, time: 0.42, dur: 0.65 },   // G5
      { freq: 1318.51, time: 0.45, dur: 0.6 },   // E6 sparkling overtone
    ];

    // Play main melody
    melody.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      const vol = time >= 0.4 ? 0.28 : 0.22;
      gain.gain.setValueAtTime(vol, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Play harmony chord for richness
    harmony.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.12, now + time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 250]);
    }
  } catch (e) {
    // Ignore error
  }
}

// Gentle double-chime notification alert for urgent homework reminders
export function playNotificationAlertSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Chime 1 (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Chime 2 (B5) - slightly higher pitch after 120ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);

    if (navigator.vibrate) {
      navigator.vibrate([40, 60, 80]);
    }
  } catch (e) {
    // Ignore error
  }
}

