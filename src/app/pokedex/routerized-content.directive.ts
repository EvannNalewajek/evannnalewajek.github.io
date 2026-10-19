import { Directive, HostListener, inject, input } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appRouterizedContent]',
  standalone: true,
})
export class RouterizedContentDirective {
  private router = inject(Router);

  readonly sameOriginOnly = input(true);

  @HostListener('click', ['$event'])
  onClick(ev: MouseEvent) {
    if (
      ev.defaultPrevented ||
      ev.button !== 0 ||
      ev.ctrlKey ||
      ev.metaKey ||
      ev.shiftKey ||
      ev.altKey
    ) {
      return;
    }

    const target = ev.target as HTMLElement | null;
    const a = target?.closest('a') as HTMLAnchorElement | null;
    if (!a) return;

    if (a.target && a.target !== '_self') return;

    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;

    ev.preventDefault();
    this.router.navigateByUrl(href);
  }
}