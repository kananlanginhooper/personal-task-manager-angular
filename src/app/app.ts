import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { PlanStore, total } from './store';
import { CelebrateService } from './celebrate.service';
import { DemoDataSource } from './data/demo-data-source';
import { DOW, MON, fmtDur, isoWeek, parseD } from './util/dates';
import { TodayComponent } from './ui/today.component';
import { WeekComponent } from './ui/week.component';
import { SideComponent } from './ui/side.component';
import { GoalsComponent } from './ui/goals.component';
import { NotesComponent } from './ui/notes.component';
import { TrophiesComponent } from './ui/trophies.component';
import { BottomComponent } from './ui/bottom.component';
import { EditorComponent } from './ui/editor.component';
import { RecapComponent } from './ui/recap.component';
import { pointOf } from './ui/point';

@Component({
  selector: 'app-root',
  imports: [CdkDropListGroup, TodayComponent, WeekComponent, SideComponent, GoalsComponent, NotesComponent, TrophiesComponent,
    BottomComponent, EditorComponent, RecapComponent],
  template: `
  <div class="wrap">
    @if (store.mode === 'demo') {
      <div class="demo-bar"><span><b>Demo.</b> Sample data that lives only in this browser. Check things off, drag tasks, earn a trophy.</span>
        <button class="btn small" type="button" (click)="resetDemo()">Reset demo</button></div>
    }
    <header class="top">
      <div>
        <div class="eyebrow">{{ dateLine }}</div>
        <h1>{{ headline()[0] }} <span>{{ headline()[1] }}</span></h1>
        <p>{{ capLine() }}</p>
      </div>
      <div class="score" aria-live="polite">
        <svg class="ring" viewBox="0 0 56 56" aria-hidden="true">
          <circle class="track" cx="28" cy="28" r="23"/>
          <circle class="val" cx="28" cy="28" r="23" stroke-dasharray="144.5" [attr.stroke-dashoffset]="144.5 * (1 - score().pct)"/>
        </svg>
        <div><b>{{ score().done }} of {{ score().all }} today</b><small>{{ score().sub }}</small></div>
        <button class="btn ghost small" type="button" (click)="store.recap.set(store.recapWeek())">Week recap</button>
      </div>
    </header>

    @if (store.error(); as e) { <div class="status">{{ e }}</div> }
    @if (!store.loaded() && !store.error()) { <div class="status">Loading your plan…</div> }

    @if (showRecapBanner()) {
      <section class="recap-banner">
        <div><b>Your week is in.</b><div class="muted" style="font-size:.9rem">Wins, streaks, trophies, and what's next. Takes one minute.</div></div>
        <button class="btn" type="button" (click)="openBannerRecap()">Open my Sunday recap</button>
      </section>
    }

    @if (store.overdue().length) {
      <section class="replan" aria-label="Missed items">
        <div class="icon">↻</div>
        <div>
          <b>{{ store.overdue().length }} thing{{ store.overdue().length > 1 ? 's' : '' }} slipped past {{ store.overdue().length > 1 ? 'their' : 'its' }} day, and that's fine.</b>
          <p>Missing a day isn't failing. Rebuilding moves each one to the lightest open evening, and big ones get split in half. Every move is logged.</p>
          <ul>@for (t of store.overdue().slice(0, 6); track t.id) { <li>{{ t.title }} <span class="mono">({{ t.date.slice(5) }}, {{ fmtDur(total(t)) }})</span></li> }</ul>
        </div>
        <div><button class="btn" type="button" (click)="store.rebuild(pointOf($event))">Rebuild my week</button></div>
      </section>
    }

    <div class="main">
      <div class="col" cdkDropListGroup>
        <app-today />
        <app-week />
      </div>
      <app-side />
    </div>
    <app-goals />
    <app-notes />
    <app-trophies />
    <app-bottom />
  </div>

  <app-editor />
  <app-recap />

  @if (fx.hero(); as h) {
    <div class="hero go" role="status" aria-live="assertive" (click)="fx.dismissHero()">
      <div class="hero-card">
        <div class="hero-star" aria-hidden="true">★</div>
        <div class="hero-head">{{ h.head }}</div>
        <div class="hero-msg">{{ h.msg }}</div>
        @if (h.combo > 1) { <div class="hero-combo">{{ h.combo }} wins in a row</div> }
      </div>
    </div>
  }
  <button type="button" class="soundbtn" (click)="fx.toggleSound()" [attr.aria-pressed]="fx.soundOn()">{{ fx.soundOn() ? 'Sound on' : 'Sound off' }}</button>
  <div class="toast" [class.show]="!!fx.toast()" [class.note]="fx.toast()?.note" role="status">
    <span class="big">{{ fx.toast()?.icon ?? '★' }}</span><div><b>{{ fx.toast()?.title }}</b><span>{{ fx.toast()?.msg }}</span></div>
  </div>
  `,
})
export class App {
  readonly store = inject(PlanStore);
  readonly fx = inject(CelebrateService);
  readonly fmtDur = fmtDur; readonly total = total; readonly pointOf = pointOf;
  private readonly bannerSeen = signal(false);

  readonly dateLine = (() => { const d = parseD(this.store.today); return `${DOW[d.getDay()]} · ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · Week ${isoWeek(this.store.today)}`; })();
  readonly headline = computed(() => this.store.settings().headline ?? ['Small wins,', 'stacked daily.']);

  readonly score = computed(() => {
    const tasks = this.store.tasksOn(this.store.today).filter(t => !t.work && !t.locked);
    const marks = this.store.habitDays()[this.store.today] ?? {};
    const done = tasks.filter(t => t.done).length + this.store.habits().filter(h => marks[h.id]).length;
    const all = tasks.length + this.store.habits().length, pct = all ? done / all : 0;
    const sub = pct >= 0.75 ? 'This is a great day. Seriously.' : pct >= 0.4 ? 'Solid. Keep stacking.' : done ? "You've started. That's the hard part." : 'Every check counts. Even the tiny ones.';
    return { done, all, pct, sub };
  });

  readonly capLine = computed(() => {
    const s = this.store, today = s.today;
    const load = s.tasksOn(today).filter(t => !t.work).reduce((a, t) => a + total(t), 0);
    return `${fmtDur(s.capacityOf(today))} free today · ${fmtDur(load)} planned · the rest is breathing room on purpose. Drag ⋮⋮ to move, click a task to change it.`;
  });

  readonly showRecapBanner = computed(() => {
    if (this.bannerSeen()) return false;
    const d = parseD(this.store.today).getDay(), h = new Date().getHours();
    if (!((d === 0 && h >= 17) || (d === 1 && h < 12))) return false;
    try { return localStorage.getItem('ptm-recap-' + this.store.recapWeek()) !== '1'; } catch { return true; }
  });

  constructor() { this.store.load(); }

  openBannerRecap() { this.bannerSeen.set(true); this.store.recap.set(this.store.recapWeek()); }
  resetDemo() { DemoDataSource.reset(); location.reload(); }

  @HostListener('document:keydown.escape')
  onEscape() { this.store.editor.set(null); this.store.recap.set(null); this.fx.dismissHero(); }
}
