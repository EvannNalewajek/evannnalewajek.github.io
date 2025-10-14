import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, WritableSignal, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

type KeyModel = {
  label: string;
  dx: WritableSignal<number>;
  dy: WritableSignal<number>;
};

const LONG_PRESS_MS = 220;
const MOVE_THRESHOLD = 6;

@Component({
  selector: 'app-enigme2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enigme2.html',
  styleUrls: ['./enigme2.scss'] // <- pluriel
})
export class Enigme2Component implements OnInit, OnDestroy {

  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private readonly correctCode = '4903';
  private currentEl: HTMLElement | null = null;

  input = signal('');
  error = signal<string | null>(null);
  shaking = signal(false);
  entering = signal(true);     // true au début si tu veux jouer le fade-in
  fadingOut = signal(false);
  success = signal(false);

  // --- clavier physique ---
  private onKeydown = (e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') this.press(e.key);
    else if (e.key === 'Backspace') this.backspace();
    else if (e.key === 'Enter') this.submit();
    else if (e.key === 'Escape') this.clear();
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('keydown', this.onKeydown, { passive: true });
      // retirer la classe fade-in après l’anim (optionnel)
      setTimeout(() => this.entering.set(false), 800);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('keydown', this.onKeydown);
    }
  }

  press(digit: string) {
    this.error.set(null);
    if (this.input().length < this.correctCode.length) {
      this.input.update(v => v + digit);
    }
  }
  clear() {
    this.error.set(null);
    this.input.set('');
  }
  backspace() {
    this.error.set(null);
    this.input.update(v => v.slice(0, -1));
  }

  submit() {
    if (this.input() === this.correctCode) {
      this.error.set(null);
      this.success.set(true);           // pulse vert si tu l’as en CSS
      setTimeout(() => this.fadingOut.set(true), 650); // puis fade-out
    } else {
      this.error.set('Code incorrect');
      this.shaking.set(true);
      setTimeout(() => this.shaking.set(false), 400);
      this.input.set('');
    }
  }

  onFadeOutEnd() {
    if (this.fadingOut()) {
      this.router.navigate(['/enigme/3']); // adapte la route suivante
    }
  }

  // ---- touches déplaçables + tap ----
  keys: KeyModel[] = (
    ['1','2','3','4','5','6','7','8','9','C','0','←'] as const
  ).map(label => ({
    label,
    dx: signal<number>(0),
    dy: signal<number>(0),
  }));

  private draggingIndex: number | null = null;
  private pressTimer: any = null;
  private startX = 0;
  private startY = 0;
  private originDX = 0;
  private originDY = 0;
  private startedAsDrag = false;

  onKeyPointerDown(i: number, ev: PointerEvent) {
    const el = ev.currentTarget as HTMLElement;
    el.setPointerCapture?.(ev.pointerId);

    this.currentEl = el;
    this.draggingIndex = i;
    this.startedAsDrag = false;

    this.startX = ev.clientX;
    this.startY = ev.clientY;
    this.originDX = this.keys[i].dx();
    this.originDY = this.keys[i].dy();

    this.clearPressTimer();
    this.pressTimer = setTimeout(() => {
      this.startedAsDrag = true;
      el.classList.add('dragging');
    }, LONG_PRESS_MS);
  }

  onKeyPointerMove(i: number, ev: PointerEvent) {
    if (this.draggingIndex !== i) return;

    const dx = ev.clientX - this.startX;
    const dy = ev.clientY - this.startY;

    if (!this.startedAsDrag && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
      this.startedAsDrag = true;
      (ev.currentTarget as HTMLElement).classList.add('dragging');
      this.clearPressTimer();
    }

    if (this.startedAsDrag) {
      ev.preventDefault();
      const nx = this.originDX + dx;
      const ny = this.originDY + dy;

      this.currentEl?.style.setProperty('--dx', `${nx}px`);
      this.currentEl?.style.setProperty('--dy', `${ny}px`);

      this.keys[i].dx.set(nx);
      this.keys[i].dy.set(ny);
    }
  } 

  onKeyPointerUp(i: number, ev: PointerEvent) {
    const wasDrag = this.startedAsDrag;
    (ev.currentTarget as HTMLElement).classList.remove('dragging');

    this.clearPressTimer();
    this.draggingIndex = null;
    this.startedAsDrag = false;
    this.currentEl = null;

    if (!wasDrag) {
      const label = this.keys[i].label;
      if (label === 'C') this.clear();
      else if (label === '←') this.backspace();
      else this.press(label);
    }
  }

  private clearPressTimer() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}