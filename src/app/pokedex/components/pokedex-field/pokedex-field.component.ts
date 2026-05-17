import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-pokedex-field',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './pokedex-field.component.html',
    styleUrls: ['./pokedex-field.component.scss']
})
export class PokedexFieldComponent {
    private location = inject(Location);


}