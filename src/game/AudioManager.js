export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.initialized = false;
    this.muted = false;
    
    // Sound settings
    this.volumes = {
      master: 0.3,
      shoot: 0.15,
      explosion: 0.25,
      powerup: 0.3,
      hit: 0.35,
      enemyShoot: 0.08,
      wave: 0.2
    };
  }
  
  init() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volumes.master;
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }
  
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volumes.master;
    }
    return this.muted;
  }
  
  // Player laser shot - short, punchy electronic zap
  playShoot() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Main oscillator - descending pitch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
    
    gain.gain.setValueAtTime(this.volumes.shoot, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.08);
    
    // Add a noise burst for texture
    this.addNoiseBurst(0.02, 0.05, this.volumes.shoot * 0.3);
  }
  
  // Enemy laser - lower pitch, different character
  playEnemyShoot() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    
    gain.gain.setValueAtTime(this.volumes.enemyShoot, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }
  
  // Explosion - layered noise with low rumble
  playExplosion(size = 'medium') {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const durations = { small: 0.2, medium: 0.35, large: 0.5 };
    const duration = durations[size] || 0.35;
    const volume = this.volumes.explosion * (size === 'large' ? 1.3 : size === 'small' ? 0.7 : 1);
    
    // Low frequency rumble
    const rumbleOsc = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    
    rumbleOsc.type = 'sine';
    rumbleOsc.frequency.setValueAtTime(80, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(30, now + duration);
    
    rumbleGain.gain.setValueAtTime(volume, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    
    rumbleOsc.start(now);
    rumbleOsc.stop(now + duration);
    
    // Noise burst
    this.addNoiseBurst(duration * 0.8, duration, volume * 0.8);
    
    // Mid frequency punch
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(200, now);
    punchOsc.frequency.exponentialRampToValueAtTime(50, now + duration * 0.5);
    
    punchGain.gain.setValueAtTime(volume * 0.6, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);
    
    punchOsc.connect(punchGain);
    punchGain.connect(this.masterGain);
    
    punchOsc.start(now);
    punchOsc.stop(now + duration * 0.5);
  }
  
  // Power-up collect - ascending arpeggio, magical feel
  playPowerUp() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Arpeggio notes (C major chord ascending)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const noteStart = now + i * 0.06;
      const noteDuration = 0.15;
      
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(this.volumes.powerup, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
    
    // Shimmer effect
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2000, now);
    shimmer.frequency.exponentialRampToValueAtTime(4000, now + 0.3);
    
    shimmerGain.gain.setValueAtTime(this.volumes.powerup * 0.15, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.masterGain);
    
    shimmer.start(now);
    shimmer.stop(now + 0.3);
  }
  
  // Player hit - harsh, warning sound
  playPlayerHit() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Distorted impact
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();
    
    // Create distortion curve
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 3);
    }
    distortion.curve = curve;
    
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(200, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    
    gain.gain.setValueAtTime(this.volumes.hit, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.connect(distortion);
    osc2.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
    
    // Add noise
    this.addNoiseBurst(0.15, 0.25, this.volumes.hit * 0.5);
  }
  
  // Game over - descending sad tone
  playGameOver() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Descending notes
    const notes = [392, 349.23, 293.66, 261.63]; // G4, F4, D4, C4
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const noteStart = now + i * 0.25;
      const noteDuration = 0.4;
      
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(this.volumes.wave, noteStart + 0.02);
      gain.gain.setValueAtTime(this.volumes.wave, noteStart + noteDuration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }
  
  // New wave - fanfare
  playWaveStart() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Quick ascending fanfare
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const noteStart = now + i * 0.1;
      const noteDuration = i === notes.length - 1 ? 0.3 : 0.12;
      
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(this.volumes.wave, noteStart + 0.01);
      gain.gain.setValueAtTime(this.volumes.wave * 0.8, noteStart + noteDuration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }
  
  // Helper: Add noise burst
  addNoiseBurst(attack, duration, volume) {
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();
    
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(4000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, now + duration);
    
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(volume, now + attack * 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + duration);
  }
  
  // Start button click
  playStart() {
    if (!this.initialized || this.muted) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    
    gain.gain.setValueAtTime(this.volumes.powerup * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

// Singleton instance
export const audioManager = new AudioManager();

