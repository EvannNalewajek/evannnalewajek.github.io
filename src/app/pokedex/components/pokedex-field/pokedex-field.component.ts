import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './pokedex-field.component.html',
    styleUrls: ['./pokedex-field.component.scss']
})
export class PokedexFieldComponent {

    constructor() {}

    ngOnInit(): void {}
}