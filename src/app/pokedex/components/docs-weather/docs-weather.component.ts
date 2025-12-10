import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-docs-weather',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './docs-weather.component.html',
    styleUrls: ['./docs-weather.component.scss']
})
export class DocsWeatherComponent {
    constructor() {}
    ngOnInit(): void {}
}