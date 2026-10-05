import { Component, computed, inject, signal } from '@angular/core';
import { PlanStore } from '../store';
import { Project } from '../models';
import { pointOf } from './point';

const PRIO: Record<string, string> = { urgent: 'Urgent', high: 'High', steady: 'Steady', later: 'Later' };

@Component({
  selector: 'app-goals',
  template: `
  <section class="panel" aria-labelledby="goalsH">
    <div class="panel-head"><h2 id="goalsH">Goals, broken into small steps</h2></div>
    <div class="tabs" role="tablist">
      @for (a of store.areas(); track a.id) {
        <button class="tab" role="tab" type="button" [attr.aria-selected]="a.id === current()" (click)="pick(a.id)">
          <i class="area-dot" [style.background]="a.color"></i>{{ a.name }}<span class="mono" style="opacity:.7">{{ count(a.id) }}</span>
        </button>
      }
    </div>
    @if (area(); as a) { <p class="areanote">{{ a.note }}</p> }
    <div class="projects">
      @for (p of projects(); track p.id) {
        <article class="proj" [style.--lc]="area()?.color">
          <header><h3>{{ p.title }}</h3><span class="pill" [class]="'pill ' + p.prio">{{ prio[p.prio] }}</span></header>
          <div class="prog"><i [style.width.%]="pct(p)"></i></div>
          <div class="meta"><span>{{ doneCount(p) }} of {{ p.steps.length }} steps</span><span>{{ meta(p) }}</span></div>
          <ul class="steps">
            @for (s of p.steps; track $index) {
              <li><label><input type="checkbox" class="chk sm" [checked]="s.done" (change)="store.toggleProjectStep(p, $index, $any($event.target).checked, pointOf($event))"><span [class.d]="s.done">{{ s.t }}</span></label></li>
            }
          </ul>
          @if (next(p); as n) { <div class="next"><b>Next:</b> {{ n }}</div> }
        </article>
      } @empty { <div class="empty">Nothing here yet.</div> }
    </div>
  </section>
  `,
})
export class GoalsComponent {
  readonly store = inject(PlanStore);
  readonly prio = PRIO; readonly pointOf = pointOf;
  private readonly chosen = signal<string | null>(this.readTab());
  readonly current = computed(() => {
    const ids = this.store.areas().map(a => a.id), c = this.chosen();
    return c && ids.includes(c) ? c : ids[0] ?? null;
  });
  readonly area = computed(() => this.store.areas().find(a => a.id === this.current()));
  readonly projects = computed(() => this.store.projects().filter(p => p.area === this.current()).sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99)));

  private readTab() { try { return localStorage.getItem('ptm-area'); } catch { return null; } }
  pick(id: string) { this.chosen.set(id); try { localStorage.setItem('ptm-area', id); } catch { /* storage blocked */ } }
  count(id: string) { return this.store.projects().filter(p => p.area === id).length; }
  doneCount(p: Project) { return p.steps.filter(s => s.done).length; }
  pct(p: Project) { return p.steps.length ? Math.round((this.doneCount(p) / p.steps.length) * 100) : 0; }
  meta(p: Project) { return [p.due ? `due ${p.due}` : '', p.est ?? ''].filter(Boolean).join(' · '); }
  next(p: Project) { return p.next || p.steps.find(s => !s.done)?.t; }
}
