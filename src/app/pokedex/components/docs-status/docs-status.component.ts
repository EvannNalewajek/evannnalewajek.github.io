import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
  selector: 'app-docs-status',
  standalone: true,
  imports: [RouterLink, BackButtonDirective],
  templateUrl: './docs-status.component.html',
  styleUrls: ['./docs-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsStatusComponent {
  private readonly title = inject(Title);

  constructor() {
    this.title.setTitle('Pokédex — Statuts');
  }
}
