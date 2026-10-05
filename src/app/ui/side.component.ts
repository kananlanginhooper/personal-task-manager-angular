import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlanStore } from '../store';
import { addDays } from '../util/dates';
import { pointOf } from './point';

/** Right column: daily habits with streaks, the evening card, and the shopping list. */
@Component({
  selector: 'app-side',
  imports: [FormsModule],
  template: `
  <section class="panel" aria-labelledby="habitsH">
    <div class="panel-head"><h2 id="habitsH">Daily small wins</h2><span class="eyebrow">last 14 days</span></div>
    @if (store.settings().meals?.length) {
      <div class="meals" aria-label="Eating schedule">
        @for (m of store.settings().meals; track $index) { <div class="meal" [class.close]="m.highlight"><b>{{ m.time }}</b>{{ m.text }}</div> }
      </div>
    }
    @for (g of groups(); track g.name) {
      <div class="hgroup"><div class="eyebrow">{{ g.name }}</div>
        @for (h of g.items; track h.id) {
          <div class="habit">
            <input type="checkbox" class="chk" [id]="'h-' + h.id" [checked]="!!todayMarks()[h.id]" (change)="store.toggleHabit(h, $any($event.target).checked, pointOf($event))">
            <label [for]="'h-' + h.id"><b>{{ h.name }}</b><small>{{ h.sub }}</small></label>
            <div>
              <div class="dots" aria-hidden="true">@for (d of last14; track d) { <i [class.on]="store.habitDays()[d]?.[h.id]" [class.today]="d === store.today"></i> }</div>
              <div class="streak">{{ store.streak(h.id) ? store.streak(h.id) + '-day streak' : 'start today' }}</div>
            </div>
          </div>
        }
      </div>
    } @empty { <div class="empty">No daily habits set up yet.</div> }
  </section>

  @if (store.settings().evening; as ev) {
    <section class="evening" aria-labelledby="eveH">
      <div class="eyebrow">{{ ev.eyebrow }}</div>
      <h3 id="eveH">{{ ev.title }}</h3>
      <p>{{ ev.text }}</p>
      <div class="swap">
        @for (o of ev.options; track o.label) {
          <button type="button" [disabled]="used().has(o.label)" [style.opacity]="used().has(o.label) ? .5 : 1" (click)="swap(o.label, o.msg, $event)">{{ o.label }}</button>
        }
      </div>
    </section>
  }

  <section class="panel" aria-labelledby="shopH">
    <div class="panel-head"><h2 id="shopH">Shopping list</h2><span class="eyebrow">{{ need().length ? need().length + ' to buy' : 'all set' }}</span></div>
    <div class="shop">
      @for (i of need(); track i.id) {
        <div class="shopi"><input type="checkbox" class="chk" (change)="store.setNeed(i, false, pointOf($event))" [attr.aria-label]="'Got ' + i.item"><span>{{ i.item }} @if (i.note) { <small>{{ i.note }}</small> }</span></div>
      } @empty { <div class="empty">Nothing to buy. Nice.</div> }
    </div>
    <div class="stocked">
      @for (i of stocked(); track i.id) { <span class="tag" title="Plenty at home">{{ i.item }}: stocked</span> }
      @for (i of got(); track i.id) { <button type="button" class="tag again" (click)="store.setNeed(i, true)" title="Add back to the list">+ {{ i.item }}</button> }
    </div>
    <form class="addrow" (submit)="addItem($event)">
      <input type="text" id="shopInput" name="shopInput" [(ngModel)]="newItem" placeholder="Add an item" aria-label="Add shopping item">
      <button class="btn small" type="submit">Add</button>
    </form>
  </section>
  `,
  host: { class: 'col' },
})
export class SideComponent {
  readonly store = inject(PlanStore);
  readonly pointOf = pointOf;
  readonly last14 = [...Array(14)].map((_, i) => addDays(this.store.today, i - 13));
  readonly used = signal(new Set<string>());
  newItem = '';

  readonly todayMarks = computed(() => this.store.habitDays()[this.store.today] ?? {});
  readonly groups = computed(() => {
    const out: { name: string; items: ReturnType<PlanStore['habits']> }[] = [];
    for (const h of this.store.habits()) {
      let g = out.find(x => x.name === h.groupName);
      if (!g) out.push((g = { name: h.groupName, items: [] }));
      g.items.push(h);
    }
    return out;
  });
  readonly need = computed(() => this.store.shopping().filter(i => !i.stocked && i.need));
  readonly got = computed(() => this.store.shopping().filter(i => !i.stocked && !i.need));
  readonly stocked = computed(() => this.store.shopping().filter(i => i.stocked));

  swap(label: string, msg: string, e: Event) {
    this.used.update(s => new Set(s).add(label));
    this.store.eveningSwap(label, msg, pointOf(e));
  }
  addItem(e: Event) {
    e.preventDefault();
    const v = this.newItem.trim();
    if (v) { this.store.addShopping(v); this.newItem = ''; }
  }
}
