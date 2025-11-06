import { Directive, HostListener, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appRouterizedContent]',
  standalone: true,
})
export class RouterizedContentDirective {
  private router = inject(Router);

  @Input() sameOriginOnly = true;

  @HostListener('click', ['$event'])
  onClick(ev: MouseEvent) {
    const a = (ev.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
    if (!a) return;

    const href = a.getAttribute('href') || '';
    if (!href.startsWith('/')) return;

    ev.preventDefault();
    this.router.navigateByUrl(href);
  }
}