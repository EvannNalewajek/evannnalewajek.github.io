import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-introduction',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './docs-introduction.component.html',
  styleUrls: ['./docs-introduction.component.scss'],
})
export class DocsIntroductionComponent {}