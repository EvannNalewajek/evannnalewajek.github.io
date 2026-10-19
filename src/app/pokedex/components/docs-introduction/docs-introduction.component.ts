import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
  selector: 'app-docs-introduction',
  standalone: true,
  imports: [RouterLink, BackButtonDirective],
  templateUrl: './docs-introduction.component.html',
  styleUrls: ['./docs-introduction.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsIntroductionComponent {
  private readonly title = inject(Title);

  constructor() {
    this.title.setTitle('Pokédex — Introduction');
  }
}