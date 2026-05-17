import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-docs-weather',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './docs-weather.component.html',
    styleUrls: ['./docs-weather.component.scss']
})
export class DocsWeatherComponent {
    private location = inject(Location);


}
