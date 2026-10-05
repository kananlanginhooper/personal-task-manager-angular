import { Injectable, signal } from '@angular/core';
import confetti from 'canvas-confetti';

const COLORS = ['#E0A019', '#F2B83A', '#1E6A50', '#5CC49A', '#D25F25', '#2C5BA6', '#7B4AB0', '#FA4D8B'];
const TITLES = ['Nice!', 'Yes!', 'Look at you.', "That's a win.", 'Stacked another one.', 'Momentum!'];
const HYPE = ['HUGE.', 'LEGENDARY.', 'UNSTOPPABLE.', "THAT'S HOW IT'S DONE.", 'WHO DOES THAT? YOU DO.'];

export interface Toast { title: string; msg: string; icon: string; note?: boolean; }
export interface Hero { head: string; msg: string; combo: number; }

/** Confetti, fireworks, a chime and the big full-screen card. */
@Injectable({ providedIn: 'root' })
export class CelebrateService {
  readonly toast = signal<Toast | null>(null);
  readonly hero = signal<Hero | null>(null);
  readonly soundOn = signal(this.readSound());
  private combo = 0;
  private comboTimer?: ReturnType<typeof setTimeout>;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private heroTimer?: ReturnType<typeof setTimeout>;
  private actx?: AudioContext;
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readSound(): boolean { try { return localStorage.getItem('ptm-sound') !== 'off'; } catch { return true; } }
  toggleSound() {
    this.soundOn.update(v => !v);
    try { localStorage.setItem('ptm-sound', this.soundOn() ? 'on' : 'off'); } catch { /* storage blocked */ }
    if (this.soundOn()) this.chime(false);
  }

  note(msg: string, title = 'Heads up', icon = 'i') { this.showToast({ title, msg, icon, note: true }); }

  private showToast(t: Toast) {
    this.toast.set(t);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3400);
  }

  dismissHero() { this.hero.set(null); }

  /** Small wins get confetti + a toast; big ones (or every 5th in a row) get fireworks and the full-screen card. */
  celebrate(msg: string, at: { x: number; y: number }, big = false, head?: string) {
    this.combo++;
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => (this.combo = 0), 10 * 60 * 1000);
    const epic = big || this.combo % 5 === 0;
    this.chime(epic);
    document.body.classList.remove('pulse'); void document.body.offsetWidth; document.body.classList.add('pulse');
    if (epic) {
      this.hero.set({ head: head || HYPE[Math.floor(Math.random() * HYPE.length)], msg, combo: this.combo });
      clearTimeout(this.heroTimer);
      this.heroTimer = setTimeout(() => this.hero.set(null), 4200);
      this.burst(at, 160); this.cannons(); this.fireworks(2600);
    } else {
      this.showToast({ title: TITLES[Math.floor(Math.random() * TITLES.length)] + (this.combo > 1 ? `  ×${this.combo}` : ''), msg, icon: '★' });
      this.burst(at, 110); setTimeout(() => this.cannons(), 120);
    }
  }

  fire(o: confetti.Options) { if (!this.reduced) confetti({ colors: COLORS, disableForReducedMotion: true, zIndex: 70, ...o }); }
  burst(at: { x: number; y: number }, n: number) {
    this.fire({ particleCount: n, spread: 100, startVelocity: 38, scalar: 1.1, origin: { x: at.x / innerWidth, y: at.y / innerHeight } });
  }
  cannons() {
    this.fire({ particleCount: 90, angle: 60, spread: 60, startVelocity: 70, origin: { x: 0, y: 1 } });
    this.fire({ particleCount: 90, angle: 120, spread: 60, startVelocity: 70, origin: { x: 1, y: 1 } });
  }
  fireworks(ms: number) {
    const end = Date.now() + ms;
    const shot = () => {
      if (Date.now() > end) return;
      this.fire({ particleCount: 70, spread: 360, startVelocity: 32, ticks: 90, gravity: 0.9, scalar: 1.15, shapes: ['circle', 'square', 'star'],
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 } });
      setTimeout(shot, 260);
    };
    shot();
    setTimeout(() => this.fire({ particleCount: 220, spread: 160, startVelocity: 55, scalar: 1.4, shapes: ['star'], origin: { x: 0.5, y: 0.6 } }), ms * 0.5);
  }

  chime(big: boolean) {
    if (!this.soundOn()) return;
    try {
      this.actx ??= new AudioContext();
      const ctx = this.actx;
      const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568] : [659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + i * (big ? 0.09 : 0.07);
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(big ? 0.16 : 0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + (big ? 0.9 : 0.5));
        o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 1);
      });
    } catch { /* no audio */ }
  }
}
