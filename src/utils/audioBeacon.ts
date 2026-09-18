// Web Audio API emergency acoustic beacon synthesizer
class EmergencyAudioBeacon {
  private audioCtx: AudioContext | null = null;
  private isBeeping: boolean = false;
  private timerId: any = null;

  private init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  public playSinglePulse(freq: number = 880, durationMs: number = 250) {
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      // Envelope: fast attack, quick decay
      gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (durationMs / 1000));

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + (durationMs / 1000));
    } catch (e) {
      console.warn("Audio beacon error:", e);
    }
  }

  public startEmergencySiren(onPulse?: () => void) {
    if (this.isBeeping) return;
    this.isBeeping = true;
    this.init();

    let toggle = false;
    this.timerId = setInterval(() => {
      toggle = !toggle;
      const freq = toggle ? 960 : 720;
      this.playSinglePulse(freq, 350);
      if (onPulse) onPulse();
    }, 600);
  }

  public stopEmergencySiren() {
    this.isBeeping = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public isActive(): boolean {
    return this.isBeeping;
  }
}

export const audioBeacon = new EmergencyAudioBeacon();
