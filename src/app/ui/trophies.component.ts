import { Component, computed, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PlanStore } from '../store';
import { progress } from '../trophies';
import { MON } from '../util/dates';

@Component({
  selector: 'app-trophies',
  template: `
  <section class="panel" aria-labelledby="trophyH">
    <div class="panel-head"><h2 id="trophyH">Trophy shelf</h2><span class="trophy-count">{{ earnedCount() }} of {{ list().length }} earned</span></div>
    <div class="shelfwrap"><div class="shelf">
      @for (t of list(); track t.id) {
        <div class="trophy" [class.locked]="!t.earned" [class.fresh]="store.freshTrophy() === t.id" [title]="t.desc">
          <span [innerHTML]="cup(t.earned, t.id)"></span>
          <b>{{ t.name }}</b><small>{{ t.desc }}</small>
          @if (t.earned) { <span class="when">{{ t.when }}</span> }
          @else { <div class="tp" [attr.aria-label]="t.p + ' of ' + t.goal"><i [style.width.%]="(t.p / t.goal) * 100"></i></div><small class="mono">{{ t.p }}/{{ t.goal }}</small> }
        </div>
      }
    </div></div>
  </section>
  `,
})
export class TrophiesComponent {
  readonly store = inject(PlanStore);
  private sanitizer = inject(DomSanitizer);
  private cache = new Map<string, SafeHtml>();

  readonly list = computed(() => {
    const f = this.store.facts(), awards = this.store.awards();
    return this.store.trophies().map(t => {
      const a = awards[t.id], d = a ? new Date(a.earnedAt) : null;
      return { ...t, p: Math.min(t.goal, progress(t.rule, f)), earned: !!a, when: d ? `${MON[d.getMonth()]} ${d.getDate()}` : '' };
    }).sort((a, b) => Number(b.earned) - Number(a.earned) || b.p / b.goal - a.p / a.goal);
  });
  readonly earnedCount = computed(() => this.list().filter(t => t.earned).length);

  cup(on: boolean, id: string): SafeHtml {
    const key = `${on}-${id}`;
    if (!this.cache.has(key)) {
      const g = on ? `url(#gold-${id})` : 'var(--line)', s = on ? '#B07A0E' : 'var(--muted)';
      const svg = `<svg viewBox="0 0 52 60" aria-hidden="true"><defs><linearGradient id="gold-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset=".45" stop-color="#F2B83A"/><stop offset="1" stop-color="#C98A12"/></linearGradient></defs>
        <path d="M14 6h24v12c0 9-5 16-12 16S14 27 14 18z" fill="${g}" stroke="${s}" stroke-width="1.5"/>
        <path d="M14 10H6c0 8 4 12 9 13M38 10h8c0 8-4 12-9 13" fill="none" stroke="${on ? '#C98A12' : 'var(--muted)'}" stroke-width="3" stroke-linecap="round"/>
        <rect x="23" y="33" width="6" height="11" fill="${g}" stroke="${s}" stroke-width="1.2"/>
        <rect x="14" y="44" width="24" height="9" rx="2" fill="${on ? '#6E4A2A' : 'var(--line)'}" stroke="${on ? '#4E331C' : 'var(--muted)'}" stroke-width="1.2"/>
        ${on ? '<path d="M26 11l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#FFF6D5"/>' : '<text x="26" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="var(--muted)">?</text>'}
      </svg>`;
      this.cache.set(key, this.sanitizer.bypassSecurityTrustHtml(svg));
    }
    return this.cache.get(key)!;
  }
}
