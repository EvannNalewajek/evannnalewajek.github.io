import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './pokedex-field.component.html',
    styleUrls: ['./pokedex-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokedexFieldComponent {
    private readonly title = inject(Title);

    constructor() {
        this.title.setTitle('Pokédex — Champs');
    }
}