import { Component, OnInit, OnDestroy, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from "@angular/router"

@Component({
  selector: 'app-enigme',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './enigme.html',
  styleUrls: ['./enigme.scss'],
})
export class EnigmeComponent implements OnInit, OnDestroy {
  private messages = [
    'Bienvenue',
    'Les énigmes classiques sont un peu ennuyeuses...',
    "Il n'y a pas moyen de les rendre plus intéressantes ?",
  ];

  private router = inject(Router);

  displayText = signal('');
  isTyping   = signal(false);
  isErasing  = signal(false);

  startDelayMs   = 600;
  typeDelayMs    = 90;
  eraseDelayMs   = 45;
  betweenMsgsMs  = 900;
  afterEraseMs   = 350;

  private destroyed = false;
  private platformId = inject(PLATFORM_ID);

  // Faux bouton
  showContainer = signal(false);
  uncovered = signal(false);

  fakeButtonX = signal(0);
  fakeButtonY = signal(0);

  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialX = 0;
  private initialY = 0;
  
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.runSequence().catch(console.error);
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerUp);
      window.removeEventListener('blur', this.onPointerUp);
    }
  }
  // -------- Animation de saisie --------
  private sleep = (ms: number) =>
    new Promise<void>(res => setTimeout(res, ms));

  private async typeText(text: string) {
    this.isErasing.set(false);
    this.isTyping.set(true);
    this.displayText.set('');

    for (let i = 0; i < text.length; i++) {
      if (this.destroyed) return;
      this.displayText.update(t => t + text[i]);
      await this.sleep(this.typeDelayMs);
    }
    this.isTyping.set(false);
  }

  private async eraseAll() {
    this.isTyping.set(false);
    this.isErasing.set(true);

    while (!this.destroyed && this.displayText().length > 0) {
      this.displayText.update(t => t.slice(0, -1));
      await this.sleep(this.eraseDelayMs);
    }
    this.isErasing.set(false);
  }

  private async runSequence() {
    await this.sleep(this.startDelayMs);
    if (this.destroyed) return;

    // "Bienvenue"
    await this.typeText(this.messages[0]);
    await this.sleep(this.betweenMsgsMs);
    if (this.destroyed) return;

    // Effacement
    await this.eraseAll();
    await this.sleep(this.afterEraseMs);
    if (this.destroyed) return;

    // 2eme phrase
    await this.typeText(this.messages[1]);
    await this.sleep(this.betweenMsgsMs);
    if (this.destroyed) return;

    // Effacement
    await this.eraseAll();
    await this.sleep(this.afterEraseMs);
    if (this.destroyed) return;

    // 3eme phrase
    await this.typeText(this.messages[2]);
    await this.sleep(this.betweenMsgsMs);
    if (this.destroyed) return;

    // Afficher la zone du bouton
    this.showContainer.set(true);
  }

  onFakePointerDown = (event: PointerEvent) => {
    if (!isPlatformBrowser(this.platformId)) return;

    event.preventDefault();
    this.dragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialX = this.fakeButtonX();
    this.initialY = this.fakeButtonY();

    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp, { passive: false });
    window.addEventListener('pointercancel', this.onPointerUp, { passive: false });
    window.addEventListener('blur', this.onPointerUp, { passive: false });
  };
  onPointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    event.preventDefault();
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    this.fakeButtonX.set(this.initialX + deltaX);
    this.fakeButtonY.set(this.initialY + deltaY);

    const distance = Math.hypot(this.fakeButtonX() - this.initialX, this.fakeButtonY() - this.initialY);
    if (distance > 40 && !this.uncovered()) {
      this.uncovered.set(true);
    }
  };
  onPointerUp = () => {
    if (!this.dragging) return;
    this.dragging = false;

    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('blur', this.onPointerUp);
  }
  onStartReal() {
    this.router.navigate(['/enigme/1']);
  }
}
