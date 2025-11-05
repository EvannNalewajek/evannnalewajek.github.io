import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './abilities-list.component.html',
    styleUrls: ['./abilities-list.component.scss']
})
export class AbilitiesListComponent {

    constructor() {}

    ngOnInit(): void {}
}