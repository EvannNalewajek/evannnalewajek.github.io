import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-enigme-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './enigme-layout.html',
  styleUrls: ['./enigme-layout.scss']
})

export class EnigmeLayoutComponent {
  title = signal('');
  description = signal('');

  private route = inject(ActivatedRoute);
  private router = inject(Router)

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const child = this.getDeepestChild(this.route);
      const data = child.snapshot.data;
      this.title.set(data['title'] ?? '');
      this.description.set(data['description'] ?? '');
    });
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  quit() {
    this.router.navigate(['/']);
  }
}
