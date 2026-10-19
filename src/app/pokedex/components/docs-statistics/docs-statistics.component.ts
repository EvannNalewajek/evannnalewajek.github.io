import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
  selector: 'app-docs-statistics',
  standalone: true,
  imports: [RouterLink, BackButtonDirective],
  templateUrl: './docs-statistics.component.html',
  styleUrls: ['./docs-statistics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsStatisticsComponent {
  private readonly title = inject(Title);

  constructor() {
    this.title.setTitle('Pokédex — Statistiques');
  }
}
