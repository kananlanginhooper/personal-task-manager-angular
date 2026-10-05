import { Award, Bootstrap, Change, Note, Project, ShoppingItem, Task } from '../models';

/** Where the page reads and saves. `ApiDataSource` talks to the FastAPI server; `DemoDataSource` keeps sample data in the browser. */
export abstract class DataSource {
  abstract readonly mode: 'api' | 'demo';
  abstract bootstrap(): Promise<Bootstrap>;
  abstract addTask(t: { title: string; date: string; start: string | null; est: number; area: string | null; note?: string | null }): Promise<Task>;
  abstract patchTask(id: string, patch: { title?: string; area?: string | null }): Promise<Task>;
  abstract setDone(id: string, done: boolean): Promise<Task>;
  abstract setTaskStep(id: string, index: number, done: boolean): Promise<Task>;
  abstract moveTask(id: string, date: string, start: string | null, type: string, reason?: string | null): Promise<Task>;
  abstract setEstimate(id: string, est: number, reason?: string | null): Promise<Task>;
  abstract splitTask(id: string, reason?: string | null): Promise<[Task, Task]>;
  abstract skipTask(id: string, reason?: string | null): Promise<Task>;
  abstract setProjectStep(id: string, index: number, done: boolean): Promise<Project>;
  abstract markHabit(date: string, habit: string, done: boolean): Promise<Record<string, boolean>>;
  abstract addShopping(item: string): Promise<ShoppingItem>;
  abstract setShoppingNeed(id: string, need: boolean): Promise<ShoppingItem>;
  abstract addChange(c: { type: string; title?: string; reason?: string; extra?: unknown }): Promise<Change>;
  abstract changes(limit?: number): Promise<Change[]>;
  abstract addNote(text: string, taskId?: string | null): Promise<Note>;
  abstract award(id: string, name: string): Promise<Award>;
  abstract saveRecap(weekStart: string, data: unknown): Promise<void>;
}
