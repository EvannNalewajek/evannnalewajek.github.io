import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-enigme1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enigme1.html',
  styleUrl: './enigme1.scss'
})
export class Enigme1Component {

  private  router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private readonly correctCode = '2907';

  input = signal('');
  error = signal<string | null>(null);
  shaking = signal(false);
  entering = signal(false);
  fadingOut = signal(false);
  success = signal(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('keydown', this.onKeydown, { passive: true });
      setTimeout(() => this.entering.set(false), 600);
    }
  }

  private onKeydown = (e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') this.press(e.key);
    else if (e.key === 'Backspace') this.backspace();
    else if (e.key === 'Enter') this.submit();
    else if (e.key === 'Escape') this.clear();
  };

  press(digit: string) {
    this.error.set(null);
    if (this.input().length >= this.correctCode.length) return;
    this.input.set(this.input() + digit);
  }
  clear() {
    this.error.set(null);
    this.input.set('');
  }
  backspace() {
    this.error.set(null);
    this.input.set(this.input().slice(0, -1));
  }
  submit() {
    if (this.input() === this.correctCode) {
      this.error.set(null);
      this.input.set('');
      this.onSuccess();
    } else {
      this.error.set('Code incorrect');
      this.shaking.set(true);
      setTimeout(() => this.shaking.set(false), 400);
      this.input.set('');
    }
  }
  private onSuccess() {
    this.success.set(true);
    setTimeout(() => this.fadingOut.set(true), 650);
  }
  onFadeOutEnd() {
    if (this.fadingOut()) {
      this.router.navigate(['/enigme/2']);
    }
  }
}
