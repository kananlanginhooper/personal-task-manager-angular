import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Task } from '../../core/models';
import { TodayRowComponent } from './today-row.component';

describe('TodayRowComponent', () => {
  let fixture: ComponentFixture<TodayRowComponent>;
  const task: Task = {
    id: 't1',
    title: 'Repot the plants',
    date: '2030-01-07',
    start: '18:00',
    est: 45,
    origEst: 30,
    done: false,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TodayRowComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TodayRowComponent);
    fixture.componentRef.setInput('task', task);
    await fixture.whenStable();
  });

  it('shows the title, start time and the changed estimate', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('b')?.textContent).toBe('Repot the plants');
    expect(el.querySelector('time')?.textContent).toBe('6:00');
    expect(el.querySelector('.dur')?.textContent?.trim()).toBe('30→45 m');
  });

  it('asks to open the editor from a click or the Enter key', () => {
    let opened = 0;
    fixture.componentInstance.opened.subscribe(() => opened++);
    const text = fixture.nativeElement.querySelector('.text') as HTMLElement;
    text.click();
    text.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(opened).toBe(2);
  });
});
