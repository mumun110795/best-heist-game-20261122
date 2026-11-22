// Small hours sound, synthesised live with WebAudio: no audio files, nothing to
// load. A soft tick while the meter climbs, a glint for treasure, a clink for the
// coin, and a low slam for the night it all goes wrong. Silent until first input.

let context = null;

function ensureContext() {
  if (context === null) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) context = new AudioCtor();
  }
  if (context && context.state === 'suspended') context.resume();
  return context;
}

function tone(frequency, seconds, type, gainPeak, when = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

export const sound = {
  unlock() {
    ensureContext();
  },
  tick() {
    tone(1180, 0.05, 'square', 0.015);
  },
  glint() {
    tone(1560, 0.12, 'sine', 0.05);
    tone(2090, 0.16, 'sine', 0.04, 0.07);
  },
  clink() {
    tone(2630, 0.07, 'triangle', 0.06);
    tone(1970, 0.09, 'triangle', 0.04, 0.05);
  },
  thud() {
    tone(140, 0.3, 'sine', 0.12);
    tone(90, 0.42, 'sine', 0.1, 0.05);
  },
  chime() {
    tone(1040, 0.2, 'sine', 0.05);
    tone(1310, 0.24, 'sine', 0.05, 0.1);
    tone(1560, 0.34, 'sine', 0.05, 0.2);
  },
};
