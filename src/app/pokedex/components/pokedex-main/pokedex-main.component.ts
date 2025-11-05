import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './pokedex-main.component.html',
    styleUrls: ['./pokedex-main.component.scss']
})
export class PokedexMainComponent {

    constructor() {}

    ngOnInit(): void {}
}