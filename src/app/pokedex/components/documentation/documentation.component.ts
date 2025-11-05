import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './documentation.component.html',
    styleUrls: ['./documentation.component.scss']
})
export class DocumentationComponent {

    constructor() {}

    ngOnInit(): void {}
}