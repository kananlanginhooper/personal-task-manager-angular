import { Injectable, OnDestroy, signal } from '@angular/core';
import confetti from 'canvas-confetti';
import { LITE } from './display';

const COLORS = [
  '#E0A019',
  '#F2B83A',
  '#1E6A50',
  '#5CC49A',
  '#D25F25',
  '#2C5BA6',
  '#7B4AB0',
  '#FA4D8B',
];
const TITLES = [
  'Nice!',
  'Yes!',
  'Look at you.',
  "That's a win.",
  'Stacked another one.',
  'Momentum!',
];
const HYPE = [
  'HUGE.',
  'LEGENDARY.',
  'UNSTOPPABLE.',
  "THAT'S HOW IT'S DONE.",
  'WHO DOES THAT? YOU DO.',
];

export interface Toast {
  title: string;
  msg: string;
  icon: string;
  note?: boolean;
}
export interface Hero {
  head: string;
  msg: string;
  combo: number;
}
/** One shooting star: % from the top of the screen, and when (ms) and how long it streaks. */
export interface Star {
  id: number;
  top: number;
  delay: number;
  dur: number;
}

/** Confetti, fireworks (or shooting stars on a low-power screen), a chime and the big full-screen card. */
@Injectable({ providedIn: 'root' })
export class CelebrateService implements OnDestroy {
  readonly toast = signal<Toast | null>(null);
  readonly hero = signal<Hero | null>(null);
  readonly soundOn = signal(this.readSound());
  /** brief shake of the page, bound as a class on the root component's host */
  readonly pulse = signal(false);
  /** the low-power tier's shooting stars, drawn by the celebration layer */
  readonly stars = signal<Star[]>([]);
  private starId = 0;
  private combo = 0;
  private comboTimer?: ReturnType<typeof setTimeout>;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private heroTimer?: ReturnType<typeof setTimeout>;
  private pulseTimer?: ReturnType<typeof setTimeout>;
  private fxTimers = new Set<ReturnType<typeof setTimeout>>();
  private actx?: AudioContext;
  private reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readSound(): boolean {
    try {
      return localStorage.getItem('ptm-sound') !== 'off';
    } catch {
      return true;
    }
  }
  toggleSound() {
    this.soundOn.update((v) => !v);
    try {
      localStorage.setItem('ptm-sound', this.soundOn() ? 'on' : 'off');
    } catch {
      /* storage blocked */
    }
    if (this.soundOn()) this.chime(false);
  }

  note(msg: string, title = 'Heads up', icon = 'i') {
    this.showToast({ title, msg, icon, note: true });
  }

  private showToast(t: Toast) {
    this.toast.set(t);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 3400);
  }

  dismissHero() {
    this.hero.set(null);
  }

  /** Small wins get confetti + a toast; big ones (or every 5th in a row) get fireworks and the full-screen card.
   *  The low-power tier (LITE) swaps the canvas confetti for a few big shooting stars and keeps the toast and card. */
  celebrate(msg: string, at: { x: number; y: number }, big = false, head?: string) {
    this.combo++;
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => (this.combo = 0), 10 * 60 * 1000);
    const epic = big || this.combo % 5 === 0;
    this.chime(epic);
    // the shake moves the whole page, a full-screen repaint the Pi can't keep up with
    if (!LITE) {
      this.pulse.set(false);
      clearTimeout(this.pulseTimer);
      this.later(() => {
        this.pulse.set(true);
        this.pulseTimer = setTimeout(() => this.pulse.set(false), 400);
      }, 0);
    }
    if (epic) {
      this.hero.set({
        head: head || HYPE[Math.floor(Math.random() * HYPE.length)],
        msg,
        combo: this.combo,
      });
      clearTimeout(this.heroTimer);
      this.heroTimer = setTimeout(() => this.hero.set(null), 4200);
      if (LITE) {
        this.shootingStars(6);
      } else {
        this.burst(at, 160);
        this.cannons();
        this.fireworks(2600);
      }
    } else {
      this.showToast({
        title:
          TITLES[Math.floor(Math.random() * TITLES.length)] +
          (this.combo > 1 ? `  ×${this.combo}` : ''),
        msg,
        icon: '★',
      });
      if (LITE) {
        this.shootingStars(3);
      } else {
        this.burst(at, 110);
        this.later(() => this.cannons(), 120);
      }
    }
  }

  /** A few big stars streaking across the screen: each is one layer moved by transform and opacity, which a weak
   *  GPU handles easily, where a full-screen canvas of particles isn't. */
  shootingStars(n: number) {
    if (this.reduced) return;
    const batch: Star[] = Array.from({ length: n }, (_, i) => ({
      id: ++this.starId,
      top: 6 + Math.random() * 50,
      delay: i * 260 + Math.round(Math.random() * 120),
      dur: 900 + Math.round(Math.random() * 400),
    }));
    this.stars.update((s) => [...s, ...batch]);
    const done = new Set(batch.map((b) => b.id));
    const end = Math.max(...batch.map((b) => b.delay + b.dur));
    this.later(() => this.stars.update((s) => s.filter((x) => !done.has(x.id))), end + 100);
  }

  fire(o: confetti.Options) {
    if (!this.reduced)
      confetti({ colors: COLORS, disableForReducedMotion: true, zIndex: 70, ...o });
  }
  burst(at: { x: number; y: number }, n: number) {
    this.fire({
      particleCount: n,
      spread: 100,
      startVelocity: 38,
      scalar: 1.1,
      origin: { x: at.x / innerWidth, y: at.y / innerHeight },
    });
  }
  cannons() {
    this.fire({
      particleCount: 90,
      angle: 60,
      spread: 60,
      startVelocity: 70,
      origin: { x: 0, y: 1 },
    });
    this.fire({
      particleCount: 90,
      angle: 120,
      spread: 60,
      startVelocity: 70,
      origin: { x: 1, y: 1 },
    });
  }
  fireworks(ms: number) {
    const end = Date.now() + ms;
    const shot = () => {
      if (Date.now() > end) return;
      this.fire({
        particleCount: 70,
        spread: 360,
        startVelocity: 32,
        ticks: 90,
        gravity: 0.9,
        scalar: 1.15,
        shapes: ['circle', 'square', 'star'],
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 },
      });
      this.later(shot, 260);
    };
    shot();
    this.later(
      () =>
        this.fire({
          particleCount: 220,
          spread: 160,
          startVelocity: 55,
          scalar: 1.4,
          shapes: ['star'],
          origin: { x: 0.5, y: 0.6 },
        }),
      ms * 0.5,
    );
  }

  /** setTimeout that ngOnDestroy can cancel (the app is unmounted when the host page switches away) */
  private later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      this.fxTimers.delete(id);
      fn();
    }, ms);
    this.fxTimers.add(id);
  }

  ngOnDestroy() {
    [this.comboTimer, this.toastTimer, this.heroTimer, this.pulseTimer, ...this.fxTimers].forEach(
      (t) => clearTimeout(t),
    );
    this.fxTimers.clear();
    confetti.reset();
    this.actx?.close().catch(() => {
      /* already closed */
    });
  }

  chime(big: boolean) {
    if (!this.soundOn()) return;
    try {
      this.actx ??= new AudioContext();
      const ctx = this.actx;
      const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568] : [659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain(),
          t0 = ctx.currentTime + i * (big ? 0.09 : 0.07);
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(big ? 0.16 : 0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + (big ? 0.9 : 0.5));
        o.connect(g).connect(ctx.destination);
        o.start(t0);
        o.stop(t0 + 1);
      });
    } catch {
      /* no audio */
    }
  }
}
