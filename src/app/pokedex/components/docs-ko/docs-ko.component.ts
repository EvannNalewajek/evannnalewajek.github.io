import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-ko',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './docs-ko.component.html',
  styleUrls: ['./docs-ko.component.scss'],
})
export class DocsKOComponent {
  private location = inject(Location);


}
