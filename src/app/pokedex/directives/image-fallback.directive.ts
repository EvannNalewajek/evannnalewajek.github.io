import { Directive, Input, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true
})
export class ImageFallbackDirective {
  @Input('appImageFallback') fallbackUrl: string = '';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError() {
    const img = this.el.nativeElement;
    // Prevent infinite loop if fallback also fails
    if (img.src !== this.fallbackUrl) {
      img.src = this.fallbackUrl || '/pokedex/img/pokemon/000_sprite.png';
    }
  }
}
