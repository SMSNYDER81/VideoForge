// Synthesized HTML5 Web Audio Sound Generator for VideoForge
// 100% browser-based synthesizers that do not require external network files

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSynthSFX = (type) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'laser': {
        // Sci-Fi futuristic beam blast
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'beep': {
        // High-precision timing sync beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      case 'whoosh': {
        // Cinematic sweeping transition sound (lowpass noise sweep)
        const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Populate white noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);
        filter.frequency.exponentialRampToValueAtTime(2500, now + 0.25);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noiseNode.start(now);
        noiseNode.stop(now + 0.5);
        break;
      }
      case 'glitch': {
        // Digital data glitched snap sound
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.type = 'triangle';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.setValueAtTime(280, now + 0.05);
        osc1.frequency.setValueAtTime(80, now + 0.1);

        osc2.frequency.setValueAtTime(900, now);
        osc2.frequency.setValueAtTime(450, now + 0.06);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.08, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
        break;
      }
      case 'bass': {
        // Hard hitting deep sub bass rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);

        osc.start(now);
        osc.stop(now + 0.82);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Audio synthesis error:', err);
  }
};
