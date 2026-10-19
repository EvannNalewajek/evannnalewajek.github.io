import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-docs-weather',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './docs-weather.component.html',
    styleUrls: ['./docs-weather.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocsWeatherComponent {
    private readonly title = inject(Title);

    constructor() {
        this.title.setTitle('Pokédex — Météo');
    }
}
