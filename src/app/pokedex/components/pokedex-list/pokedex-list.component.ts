import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PokedexService } from '../../pokedex.service';
import { Pokemon } from '../../pokemon.model';

@Component({
  selector: 'app-pokedex-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./pokedex-list.component.html",
  styleUrl : "./pokedex-list.component.scss",
})
export class PokedexListComponent implements OnInit {
  private pokedex = inject(PokedexService);

  list = computed<Pokemon[] | null>(() => this.pokedex.all());

  async ngOnInit() {
    await this.pokedex.ensureLoaded();
  }
}