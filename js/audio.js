/**
 * CRAZY CADDIE: Procedural 90s Surf-Punk / Grunge Audio & Nasal Voice Synth
 * Pure WebAudio API — zero external audio files required.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.stepIndex = 0;
    this.intensity = 1.0; // Increases when the Head Ranger chases you
    this.engineOsc = null;
    this.engineGain = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();

    // Master compressor so chaotic layered sounds never clip harshly
    this.master = this.ctx.createDynamicsCompressor();
    this.master.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.master.knee.setValueAtTime(20, this.ctx.currentTime);
    this.master.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.master.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.master.release.setValueAtTime(0.15, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.65;
    this.master.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.setupEngineSound();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.65, this.ctx.currentTime);
    }
    return this.muted;
  }

  setupEngineSound() {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 48;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 190;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc.start();
  }

  updateEngine(speedRatio, drifting, turbo, paused) {
    if (!this.ctx || !this.engineGain || this.muted) return;
    const now = this.ctx.currentTime;
    if (paused) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }
    const targetFreq = 42 + speedRatio * 75 + (turbo ? 45 : 0) + (drifting ? 15 : 0);
    const targetGain = 0.02 + speedRatio * 0.065 + (turbo ? 0.04 : 0);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.04);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.04);
  }

  // Create distortion curve for 90s grunge guitar/bass
  makeDistortionCurve(amount = 150) {
    const k = amount;
    const n_samples = 256;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  startMusic() {
    this.init();
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.stepIndex = 0;

    // 90s garage grunge power-chord bassline (E2, G2, A2, A#2, B2 chromatic punk riff)
    const bassNotes = [
      82.41, 82.41, 98.0, 82.41,
      110.0, 116.54, 110.0, 98.0,
      82.41, 82.41, 123.47, 116.54,
      110.0, 98.0, 87.31, 98.0
    ];

    const leadNotes = [
      0, 0, 196.0, 0,
      220.0, 233.08, 220.0, 0,
      0, 164.81, 246.94, 233.08,
      220.0, 196.0, 0, 329.63
    ];

    const tick = () => {
      if (!this.musicPlaying) return;
      if (!this.muted && this.ctx && this.ctx.state === 'running') {
        const s = this.stepIndex % 16;
        const note = bassNotes[s];
        const lead = leadNotes[s];

        this.playBassNote(note, 0.14);
        if (lead > 0 && (this.intensity > 1.05 || s % 4 >= 2)) {
          this.playGrungeGuitar(lead, lead * 1.5, 0.16);
        }

        // Garage drum beat
        if (s % 4 === 0 || s === 10) {
          this.playKick();
        }
        if (s % 4 === 2 || (this.intensity > 1.2 && s === 15)) {
          this.playSnare();
        }
        if (s % 2 === 0) {
          this.playHiHat(s % 4 === 2);
        }
      }

      this.stepIndex++;
      const stepMs = Math.max(95, 145 / this.intensity);
      this.musicTimer = setTimeout(tick, stepMs);
    };

    tick();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playBassNote(freq, dur) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  playGrungeGuitar(freq1, freq2, dur) {
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq1, now);
    osc2.frequency.setValueAtTime(freq2, now);

    const shaper = this.ctx.createWaveShaper();
    shaper.curve = this.makeDistortionCurve(120);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.value = 1.6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.003, now + dur);

    osc1.connect(shaper);
    osc2.connect(shaper);
    shaper.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.02);
    osc2.stop(now + dur + 0.02);
  }

  playKick() {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.11);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  playSnare() {
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 600;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
  }

  playHiHat(open = false) {
    const now = this.ctx.currentTime;
    const dur = open ? 0.09 : 0.04;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.003, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
  }

  /**
   * Synthesized cartoon caddie chuckles
   * Uses formant-filtered glottal sawtooth pulses!
   */
  playChuckle(style = 'low') {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const isHigh = style === 'high';
    const baseFreq = isHigh ? 250 : 145;
    const pulses = isHigh ? [0, 0.09, 0.18, 0.28] : [0, 0.13, 0.26];

    pulses.forEach((offset, idx) => {
      const t = now + offset;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const pitch = baseFreq + (idx % 2 === 0 ? 12 : -8) + Math.random() * 10;
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.linearRampToValueAtTime(pitch * 0.86, t + 0.075);

      // Nasal formant filter
      const f1 = this.ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = isHigh ? 1650 : 980;
      f1.Q.value = 4.5;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.008, t + 0.08);

      osc.connect(f1);
      f1.connect(gain);
      gain.connect(this.master);

      osc.start(t);
      osc.stop(t + 0.085);
    });
  }

  /**
   * Shrill panic/pain scream ("AAAAAGH!" / "MY GROIN!")
   */
  playScream(pitchBase = 340) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitchBase, now);
    osc.frequency.linearRampToValueAtTime(pitchBase * 1.45, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(pitchBase * 0.7, now + 0.42);

    // Vibrato LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 28;
    lfoGain.gain.value = 35;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = 1450;
    formant.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.44);

    osc.connect(formant);
    formant.connect(gain);
    gain.connect(this.master);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.45);
    osc.stop(now + 0.45);
  }

  /**
   * Obnoxious stadium Airhorn blast ("BWAAAAAH!")
   */
  playAirhorn(upgraded = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = upgraded ? 0.55 : 0.38;
    const freqs = upgraded ? [370, 466.16, 554.37, 740] : [440, 554.37, 659.25];

    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f * 0.96, now);
      osc.frequency.linearRampToValueAtTime(f, now + 0.04);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.setValueAtTime(0.18, now + dur - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.004, now + dur);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    });
  }

  /**
   * Satisfying vacuum pop when scooping up a golf ball
   */
  playBallPickup(value = 1) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const startF = 440 + Math.min(value * 90, 600);
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.9, now + 0.09);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Golf club THWACK + whistling incoming ball
   */
  playGolfSwing(aimedAtPlayer = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Metallic driver ping
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(aimedAtPlayer ? 1320 : 980, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.13);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.14);

    // If aimed at player, add ominous incoming whistle
    if (aimedAtPlayer) {
      const wOsc = this.ctx.createOscillator();
      wOsc.type = 'sine';
      wOsc.frequency.setValueAtTime(1700, now + 0.08);
      wOsc.frequency.exponentialRampToValueAtTime(420, now + 0.75);

      const wGain = this.ctx.createGain();
      wGain.gain.setValueAtTime(0.001, now + 0.08);
      wGain.gain.linearRampToValueAtTime(0.14, now + 0.25);
      wGain.gain.exponentialRampToValueAtTime(0.003, now + 0.78);

      wOsc.connect(wGain);
      wGain.connect(this.master);
      wOsc.start(now + 0.08);
      wOsc.stop(now + 0.8);
    }
  }

  /**
   * Hollow coconut/skull BONK when hit in the head!
   */
  playHeadBonk(lethal = false) {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Hollow skull knock
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(lethal ? 520 : 680, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.13);

    // Cartoon concussion birds/ringing
    const ring = this.ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(1250, now + 0.05);
    ring.frequency.setValueAtTime(1580, now + 0.15);
    ring.frequency.setValueAtTime(1180, now + 0.25);

    const rGain = this.ctx.createGain();
    rGain.gain.setValueAtTime(0.16, now + 0.05);
    rGain.gain.exponentialRampToValueAtTime(0.003, now + 0.42);

    ring.connect(rGain);
    rGain.connect(this.master);
    ring.start(now + 0.05);
    ring.stop(now + 0.45);
  }

  /**
   * Crash / Smashing into wedding cakes, carts, or golfers
   */
  playCrash(type = 'thud') {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    if (type === 'glass') {
      [1900, 2450, 3100, 1420].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.025);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.14, now + i * 0.025);
        g.gain.exponentialRampToValueAtTime(0.003, now + i * 0.025 + 0.09);
        osc.connect(g);
        g.connect(this.master);
        osc.start(now + i * 0.025);
        osc.stop(now + i * 0.025 + 0.1);
      });
      return;
    }

    if (type === 'swan') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(740, now + 0.07);
      osc.frequency.linearRampToValueAtTime(380, now + 0.22);
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1200;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.005, now + 0.24);
      osc.connect(f);
      f.connect(g);
      g.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.25);
      return;
    }

    // Heavy body/cart thud
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.005, now + 0.2);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * PVC Potato-Gun Ball Cannon THUMP
   */
  playCannonFire() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.14);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.38, now);
    g.gain.exponentialRampToValueAtTime(0.005, now + 0.15);

    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Big Cartoon Water Splash & Bubbling ("SPLOOOSH!")
   */
  playWaterSplash() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // White noise splash burst
    const dur = 0.42;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + dur);
    filter.Q.value = 1.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);

    // Cartoon bubble bloops
    [220, 310, 420].forEach((freq, idx) => {
      const t = now + 0.08 + idx * 0.07;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.65, t + 0.055);
      const bg = this.ctx.createGain();
      bg.gain.setValueAtTime(0.16, t);
      bg.gain.exponentialRampToValueAtTime(0.004, t + 0.06);
      osc.connect(bg);
      bg.connect(this.master);
      osc.start(t);
      osc.stop(t + 0.065);
    });
  }

  /**
   * Radioactive Mutation Synth + Lizard Roar!
   */
  playMutation() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    // Sci-fi radioactive warble
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.75);

    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.frequency.value = 24;
    lfoG.gain.value = 85;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.36, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.78);

    osc.connect(gain);
    gain.connect(this.master);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.8);
    osc.stop(now + 0.8);
  }

  /**
   * Roaring Flamethrower Fire Breath Burst ("FWOOSH!")
   */
  playFireBreath() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = 0.26;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + dur);
    filter.Q.value = 0.9;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    noise.start(now);
  }

  /**
   * Deep Chest-Thumping Country Club Kong Gorilla Roar!
   */
  playKongRoar() {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(95, now);
    osc1.frequency.linearRampToValueAtTime(140, now + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(58, now + 0.75);

    osc2.frequency.setValueAtTime(142, now);
    osc2.frequency.exponentialRampToValueAtTime(82, now + 0.75);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 540;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.008, now + 0.78);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.8);
    osc2.stop(now + 0.8);
  }
}

window.sound = new SoundSystem();
