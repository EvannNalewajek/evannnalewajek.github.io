import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
  selector: 'app-docs-ko',
  standalone: true,
  imports: [RouterLink, BackButtonDirective],
  templateUrl: './docs-ko.component.html',
  styleUrls: ['./docs-ko.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsKOComponent implements OnInit {
  private title = inject(Title);

  ngOnInit(): void {
    this.title.setTitle('Pokédex — K.O.');
  }
}
