import { restTooltips } from './rest-tooltips';

describe('restTooltips', () => {
  let trigger: HTMLElement;
  let plain: HTMLElement;
  let seen: string[];
  let undo: () => void;

  beforeEach(() => {
    seen = [];
    trigger = document.createElement('div');
    trigger.className = 'mat-mdc-tooltip-trigger';
    plain = document.createElement('div');
    document.body.append(trigger, plain);
    trigger.addEventListener('mouseenter', () => seen.push('trigger'));
    plain.addEventListener('mouseenter', () => seen.push('plain'));
    undo = restTooltips();
  });
  afterEach(() => {
    undo();
    trigger.remove();
    plain.remove();
  });

  it('holds back mouseenter on a tooltip trigger, and nothing else', () => {
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    plain.dispatchEvent(new MouseEvent('mouseenter'));
    expect(seen).toEqual(['plain']);
  });

  it('lets everything through once undone', () => {
    undo();
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    expect(seen).toEqual(['trigger']);
  });
});
