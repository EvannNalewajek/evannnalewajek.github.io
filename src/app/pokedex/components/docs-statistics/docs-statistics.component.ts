import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-statistics.component.html',
  styleUrls: ['./docs-statistics.component.scss'],
})
export class DocsStatisticsComponent implements AfterViewInit{
    ngAfterViewInit(): void {
        (window as any).MathJax?.typesetPromise();
    }

    refreshMath() {
        (window as any).MathJax?.typesetPromise();
    }
}