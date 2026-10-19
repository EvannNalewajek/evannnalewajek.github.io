import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pokedex-main',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pokedex-main.component.html',
  styleUrls: ['./pokedex-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexMainComponent {}