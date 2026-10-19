import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-ko',
  standalone: true,
  imports: [RouterLink],
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
