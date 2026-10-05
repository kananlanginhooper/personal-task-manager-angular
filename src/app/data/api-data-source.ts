import { Injectable } from '@angular/core';
import { DataSource } from './data-source';
import { Award, Bootstrap, Change, Note, Project, ShoppingItem, Task } from '../models';

/** API base: `<meta name="api-base" content="...">` if present, else `/api` on the same address (deploy/serve.py and `ng serve` pass it through). */
function apiBase(): string {
  const meta = document.querySelector('meta[name="api-base"]')?.getAttribute('content');
  return (meta || '/api').replace(/\/$/, '');
}

@Injectable()
export class ApiDataSource extends DataSource {
  readonly mode = 'api' as const;
  private base = apiBase();

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let token: string | null = null;
    try { token = localStorage.getItem('ptm-token'); } catch { /* storage blocked */ }
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(this.base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) {
      let detail = res.statusText;
      try { detail = (await res.json()).detail ?? detail; } catch { /* not JSON */ }
      throw new Error(`${res.status}: ${detail}`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }

  bootstrap() { return this.req<Bootstrap>('GET', '/bootstrap'); }
  addTask(t: Parameters<DataSource['addTask']>[0]) { return this.req<Task>('POST', '/tasks', t); }
  patchTask(id: string, patch: { title?: string; area?: string | null }) { return this.req<Task>('PATCH', `/tasks/${id}`, patch); }
  setDone(id: string, done: boolean) { return this.req<Task>('POST', `/tasks/${id}/done`, { done }); }
  setTaskStep(id: string, i: number, done: boolean) { return this.req<Task>('POST', `/tasks/${id}/steps/${i}`, { done }); }
  moveTask(id: string, date: string, start: string | null, type: string, reason?: string | null) {
    return this.req<Task>('POST', `/tasks/${id}/move`, { date, start, type, reason });
  }
  setEstimate(id: string, est: number, reason?: string | null) { return this.req<Task>('POST', `/tasks/${id}/estimate`, { est, reason }); }
  splitTask(id: string, reason?: string | null) { return this.req<[Task, Task]>('POST', `/tasks/${id}/split`, { reason }); }
  skipTask(id: string, reason?: string | null) { return this.req<Task>('POST', `/tasks/${id}/skip`, { reason }); }
  setProjectStep(id: string, i: number, done: boolean) { return this.req<Project>('POST', `/projects/${id}/steps/${i}`, { done }); }
  async markHabit(date: string, habit: string, done: boolean) {
    return (await this.req<{ marks: Record<string, boolean> }>('PUT', `/habits/${date}`, { habit, done })).marks;
  }
  addShopping(item: string) { return this.req<ShoppingItem>('POST', '/shopping', { item }); }
  setShoppingNeed(id: string, need: boolean) { return this.req<ShoppingItem>('PATCH', `/shopping/${id}`, { need }); }
  addChange(c: { type: string; title?: string; reason?: string; extra?: unknown }) { return this.req<Change>('POST', '/changes', c); }
  changes(limit = 80) { return this.req<Change[]>('GET', `/changes?limit=${limit}`); }
  addNote(text: string, taskId?: string | null) { return this.req<Note>('POST', '/notes', { text, taskId: taskId || null }); }
  award(id: string, name: string) { return this.req<Award>('POST', '/trophies/awards', { id, name }); }
  async saveRecap(weekStart: string, data: unknown) { await this.req('PUT', `/recaps/${weekStart}`, data); }
}
