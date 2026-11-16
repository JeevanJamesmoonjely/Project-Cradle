// Procedural Web Audio API Synthesizer for Project Cradle
class PlanetarySoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private crunchTimeout: number | null = null;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initMotor();
      this.initWind();
      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported on this device');
    }
  }

  private ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initMotor() {
    if (!this.ctx) return;
    // Rover electric drivetrain servo hum
    this.motorOsc = this.ctx.createOscillator();
    this.motorOsc.type = 'sawtooth';
    this.motorOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Motor filter to give it a realistic muffled metallic chassis resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.motorGain = this.ctx.createGain();
    this.motorGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.motorOsc.connect(filter);
    filter.connect(this.motorGain);
    this.motorGain.connect(this.ctx.destination);
    this.motorOsc.start();
  }

  private initWind() {
    if (!this.ctx) return;
    // Procedural pink noise for Martian atmospheric wind
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = buffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    this.windSource.start();
  }

  public updateMotor(speedRatio: number) {
    if (!this.ctx || !this.motorGain || !this.motorOsc || this.isMuted) return;
    this.ensureRunning();
    const targetFreq = 45 + Math.abs(speedRatio) * 90;
    const targetVolume = Math.min(0.08, Math.abs(speedRatio) * 0.07);
    this.motorOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    this.motorGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.05);
  }

  public updateWind(dustTau: number) {
    if (!this.ctx || !this.windGain || !this.windFilter || this.isMuted) return;
    const baseFreq = 220 + dustTau * 180;
    const baseVol = Math.min(0.18, 0.04 + dustTau * 0.05);
    this.windFilter.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.3);
    this.windGain.gain.setTargetAtTime(baseVol, this.ctx.currentTime, 0.3);
  }

  public playGravelCrunch() {
    if (!this.ctx || this.isMuted || this.crunchTimeout) return;
    this.ensureRunning();
    // Throttle crunch sound so it creates a rolling step rhythm
    this.crunchTimeout = window.setTimeout(() => {
      this.crunchTimeout = null;
    }, 180);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Laser-Induced Breakdown Spectroscopy (LIBS) pulsing sound
  public playScanLaserPulse() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Authentic NASA Quindar Beep (2525 Hz intro, 2475 Hz outro)
  public playQuindarTone(isIntro: boolean = true) {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isIntro ? 2525 : 2475, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playTelemetrySuccess() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  // Authentic, pleasant NASA telemetry advisory chime for meteorological alerts
  private lastVortexAlertTime: number = 0;
  public playVortexAlert() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    if (now - this.lastVortexAlertTime < 20.0) return; // Prevent spamming
    this.lastVortexAlertTime = now;

    // Elegant, soothing dual-tone NASA mission advisory chime (D5 -> A5 with soft harmonic overtone)
    const tones = [
      { freq: 587.33, start: 0, dur: 0.38, vol: 0.055 },
      { freq: 880.0, start: 0.14, dur: 0.48, vol: 0.06 },
      { freq: 1174.66, start: 0.14, dur: 0.42, vol: 0.02 },
    ];

    tones.forEach((t) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, now + t.start);

      gain.gain.setValueAtTime(0.0001, now + t.start);
      gain.gain.exponentialRampToValueAtTime(t.vol, now + t.start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + t.start);
      osc.stop(now + t.start + t.dur);
    });
  }

  // Softened, non-disturbing general telemetry warning
  public playWarning() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    // Warm sine wave instead of harsh square wave
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(440.0, now + 0.12);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Critical battery depletion lockout alarm (authentic NASA telemetry advisory tone)
  private lastBatteryAlarmTime = 0;
  public playBatteryDepletedAlarm() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    if (now - this.lastBatteryAlarmTime < 1.2) return;
    this.lastBatteryAlarmTime = now;

    // Descending dual chime: 784 Hz (G5) -> 523.25 Hz (C5) -> 392 Hz (G4)
    const tones = [
      { freq: 784.0, start: 0, dur: 0.12 },
      { freq: 523.25, start: 0.12, dur: 0.14 },
      { freq: 392.0, start: 0.26, dur: 0.28 },
    ];

    tones.forEach((t) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, now + t.start);

      gain.gain.setValueAtTime(0.06, now + t.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.dur);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + t.start);
      osc.stop(now + t.start + t.dur);
    });
  }

  // =========================================================================
  // MARS HABITAT BASE ROOM SOUND FX (Airlock, Server Room, Sample Vault, Supercharge)
  // =========================================================================

  // 1. Pressurized EVA Airlock Decompression & Cycling Hiss
  public playAirlockCycle() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    // Pneumatic gas equalization noise burst
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.7);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Heavy mechanical steel airlock bolt clamp thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now + 0.55);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.85);

    oscGain.gain.setValueAtTime(0.12, now + 0.55);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.88);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now + 0.55);
    osc.stop(now + 0.88);
  }

  // 2. Server Room Deep Space Telemetry Uplink Data Stream
  public playServerUplinkStream() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    // Fast digital packet chirp burst
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 1760.0, 2349.32];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.045);
    });
  }

  // 3. Geological Store Room Sample Canister Hermetic Lock
  public playVaultCanisterLock() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    // Nitrogen purge hiss followed by dual servo latch clicks
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(800, now + 0.06);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);

    // Solid vault latch click
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(520, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(140, now + 0.28);

    gain2.gain.setValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);
  }

  // 4. Power Bay High-Voltage Umbilical Supercharge Hum
  public playSuperchargeHum() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    // Rising electromagnetic transformer hum (60 Hz to 240 Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(850, now + 0.6);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Dynamic low-frequency atmospheric swirling vortex sound (whoosh and regolith hiss)
  private vortexGain: GainNode | null = null;
  private vortexFilter: BiquadFilterNode | null = null;
  private vortexSource: AudioBufferSourceNode | null = null;

  public updateVortexProximitySound(distance: number) {
    if (!this.ctx || this.isMuted) {
      if (this.vortexGain && this.ctx) {
        this.vortexGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      }
      return;
    }
    this.ensureRunning();

    if (!this.vortexSource) {
      // Create deep atmospheric brownian/pink noise loop for the spinning vortex updraft
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.06;
        b1 = 0.96 * b1 + white * 0.1;
        b2 = 0.88 * b2 + white * 0.15;
        data[i] = (b0 + b1 + b2) * 0.14;
      }

      this.vortexSource = this.ctx.createBufferSource();
      this.vortexSource.buffer = buffer;
      this.vortexSource.loop = true;

      this.vortexFilter = this.ctx.createBiquadFilter();
      this.vortexFilter.type = 'lowpass';
      this.vortexFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.vortexFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.vortexGain = this.ctx.createGain();
      this.vortexGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.vortexSource.connect(this.vortexFilter);
      this.vortexFilter.connect(this.vortexGain);
      this.vortexGain.connect(this.ctx.destination);
      this.vortexSource.start();
    }

    const now = this.ctx.currentTime;
    if (this.vortexGain && this.vortexFilter) {
      if (distance < 70.0) {
        const proximityFactor = Math.max(0, 1.0 - distance / 70.0);
        const targetVol = Math.min(0.18, proximityFactor * 0.16);
        const targetFreq = 100 + proximityFactor * 260; // Deep 100Hz rumble up to 360Hz swirling whoosh
        this.vortexGain.gain.setTargetAtTime(targetVol, now, 0.15);
        this.vortexFilter.frequency.setTargetAtTime(targetFreq, now, 0.15);
      } else {
        this.vortexGain.gain.setTargetAtTime(0, now, 0.3);
      }
    }
  }

  public playClick() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playCoringDrill() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Rotary percussive drilling buzz
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.linearRampToValueAtTime(185, now + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  private impactTimeout: number | null = null;
  public playRockImpact(intensity: number = 1.0) {
    if (!this.ctx || this.isMuted || this.impactTimeout) return;
    this.ensureRunning();
    this.impactTimeout = window.setTimeout(() => {
      this.impactTimeout = null;
    }, 220);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Heavy low-frequency chassis shock
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    const vol = Math.min(0.22, 0.08 * Math.max(0.3, intensity));
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    // Accompanying gravel crunch
    this.playGravelCrunch();
  }

  // ================= NASA LAUNCH & EDL SEQUENCER AUDIO SYNTHESIZERS =================
  private rocketSource: AudioBufferSourceNode | null = null;
  private rocketGain: GainNode | null = null;
  private rocketFilter: BiquadFilterNode | null = null;
  private srbCrackleSource: AudioBufferSourceNode | null = null;
  private srbCrackleGain: GainNode | null = null;
  private srbCrackleFilter: BiquadFilterNode | null = null;

  private plasmaSource: AudioBufferSourceNode | null = null;
  private plasmaGain: GainNode | null = null;
  private plasmaFilter: BiquadFilterNode | null = null;

  public playRocketRumble(intensity: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    // 1. Deep Sub-Bass Brownian Rumble (20-120 Hz)
    if (!this.rocketSource) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Deep brownian noise for rocket combustion turbulence
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.8;
      }

      this.rocketSource = this.ctx.createBufferSource();
      this.rocketSource.buffer = buffer;
      this.rocketSource.loop = true;

      this.rocketFilter = this.ctx.createBiquadFilter();
      this.rocketFilter.type = 'lowpass';
      this.rocketFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.rocketFilter.Q.setValueAtTime(3.2, this.ctx.currentTime);

      this.rocketGain = this.ctx.createGain();
      this.rocketGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.rocketSource.connect(this.rocketFilter);
      this.rocketFilter.connect(this.rocketGain);
      this.rocketGain.connect(this.ctx.destination);
      this.rocketSource.start();
    }

    // 2. Authentic Artemis 1 SRB Acoustic Shock Crackle (Mach Shockwaves / Tearing Paper sound)
    if (!this.srbCrackleSource) {
      const crackleSize = this.ctx.sampleRate * 2;
      const crackleBuffer = this.ctx.createBuffer(1, crackleSize, this.ctx.sampleRate);
      const cData = crackleBuffer.getChannelData(0);
      for (let i = 0; i < crackleSize; i++) {
        // High kurtosis, non-Gaussian spike noise representing supersonic shock fronts
        const r = Math.random();
        if (r > 0.94) {
          cData[i] = (Math.random() * 2 - 1) * 0.95;
        } else if (r > 0.82) {
          cData[i] = (Math.random() * 2 - 1) * 0.45;
        } else {
          cData[i] = (Math.random() * 2 - 1) * 0.08;
        }
      }

      this.srbCrackleSource = this.ctx.createBufferSource();
      this.srbCrackleSource.buffer = crackleBuffer;
      this.srbCrackleSource.loop = true;

      this.srbCrackleFilter = this.ctx.createBiquadFilter();
      this.srbCrackleFilter.type = 'bandpass';
      this.srbCrackleFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      this.srbCrackleFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // Waveshaper for acoustic saturation
      const shaper = this.ctx.createWaveShaper();
      const n = 256;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = Math.tanh(x * 2.2);
      }
      shaper.curve = curve;

      this.srbCrackleGain = this.ctx.createGain();
      this.srbCrackleGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.srbCrackleSource.connect(this.srbCrackleFilter);
      this.srbCrackleFilter.connect(shaper);
      shaper.connect(this.srbCrackleGain);
      this.srbCrackleGain.connect(this.ctx.destination);
      this.srbCrackleSource.start();
    }

    const clamped = Math.max(0, Math.min(1.0, intensity));
    const now = this.ctx.currentTime;
    if (this.rocketGain && this.rocketFilter) {
      this.rocketGain.gain.setTargetAtTime(clamped * 0.28, now, 0.08);
      this.rocketFilter.frequency.setTargetAtTime(100 + clamped * 320, now, 0.08);
    }
    if (this.srbCrackleGain && this.srbCrackleFilter) {
      // Crackle becomes dominant during high-thrust liftoff and Max-Q
      const crackleVol = clamped > 0.4 ? (clamped - 0.4) * 0.35 : 0;
      this.srbCrackleGain.gain.setTargetAtTime(crackleVol, now, 0.06);
      this.srbCrackleFilter.frequency.setTargetAtTime(800 + clamped * 1200, now, 0.06);
    }
  }

  // Blinding SRB Ignition Shockwave Blast
  public playSRBIgnitionFlash() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    // Subsonic atmospheric shockwave blast
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.6);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  public stopRocketRumble() {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.rocketGain) this.rocketGain.gain.setTargetAtTime(0, now, 0.3);
      if (this.srbCrackleGain) this.srbCrackleGain.gain.setTargetAtTime(0, now, 0.2);
    }
  }

  public playPlasmaRoar(intensity: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();

    if (!this.plasmaSource) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      this.plasmaSource = this.ctx.createBufferSource();
      this.plasmaSource.buffer = buffer;
      this.plasmaSource.loop = true;

      this.plasmaFilter = this.ctx.createBiquadFilter();
      this.plasmaFilter.type = 'bandpass';
      this.plasmaFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.plasmaFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.plasmaGain = this.ctx.createGain();
      this.plasmaGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.plasmaSource.connect(this.plasmaFilter);
      this.plasmaFilter.connect(this.plasmaGain);
      this.plasmaGain.connect(this.ctx.destination);
      this.plasmaSource.start();
    }

    const clamped = Math.max(0, Math.min(1.0, intensity));
    const now = this.ctx.currentTime;
    if (this.plasmaGain && this.plasmaFilter) {
      this.plasmaGain.gain.setTargetAtTime(clamped * 0.18, now, 0.15);
      this.plasmaFilter.frequency.setTargetAtTime(320 + clamped * 650, now, 0.15);
    }
  }

  public stopPlasmaRoar() {
    if (this.plasmaGain && this.ctx) {
      this.plasmaGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }

  public playMortarDeployment() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;

    // Mortar cannon explosion
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // High frequency nylon cord tension snap
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const snapTime = this.ctx.currentTime;
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'sawtooth';
      snapOsc.frequency.setValueAtTime(1800, snapTime);
      snapOsc.frequency.exponentialRampToValueAtTime(200, snapTime + 0.08);

      snapGain.gain.setValueAtTime(0.15, snapTime);
      snapGain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.08);

      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(snapTime);
      snapOsc.stop(snapTime + 0.08);
    }, 120);
  }

  public playStageSeparation() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playThrusterPuff() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playCableCut() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    // Pyrotechnic guillotine cutter snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playSkyCraneFlyaway() {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(650, now + 2.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 2.4);
  }

  public playCountdownBeep(isFinal: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    this.ensureRunning();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 1760 : 880, now);

    gain.gain.setValueAtTime(isFinal ? 0.14 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.28 : 0.08));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isFinal ? 0.28 : 0.08));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        if (this.motorGain) this.motorGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.windGain) this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.vortexGain) this.vortexGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.rocketGain) this.rocketGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.plasmaGain) this.plasmaGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } else {
        if (this.windGain) this.windGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new PlanetarySoundEngine();
