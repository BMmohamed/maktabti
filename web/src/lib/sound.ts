'use client';

/**
 * Web Audio API synthesizer chime for instant notifications.
 * Works without needing external mp3 files and plays with zero network latency.
 */
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // First note (High pitch pleasant chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second note after 180ms
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

        gain2.gain.setValueAtTime(0.35, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start();
        osc2.stop(ctx.currentTime + 0.45);
      } catch {}
    }, 180);
  } catch (e) {
    console.warn('Audio alert not allowed or not supported:', e);
  }
}
