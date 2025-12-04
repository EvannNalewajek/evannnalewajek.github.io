import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-docs-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './docs-statistics.component.html',
  styleUrls: ['./docs-statistics.component.scss'],
})
export class DocsStatisticsComponent {}