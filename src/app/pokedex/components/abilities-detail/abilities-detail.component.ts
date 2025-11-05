import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './abilities-detail.component.html',
    styleUrls: ['./abilities-detail.component.scss']
})
export class AbilitiesDetailComponent {

    constructor() {}

    ngOnInit(): void {}
}