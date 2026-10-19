import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  private el = inject<ElementRef<HTMLImageElement>>(ElementRef);

  readonly fallbackUrl = input<string>('', { alias: 'appImageFallback' });

  @HostListener('error')
  onError() {
    const img = this.el.nativeElement;
    const fallback = this.fallbackUrl() || '/pokedex/img/pokemon/000_sprite.png';

    // Avoid infinite error loops when comparing relative fallback path against absolute img.src
    if (img.dataset['fallbackApplied'] === fallback || img.getAttribute('src') === fallback) {
      return;
    }
    img.dataset['fallbackApplied'] = fallback;
    img.src = fallback;
  }
}
