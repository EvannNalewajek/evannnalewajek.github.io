import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PokedexService } from '../../services/pokedex.service';
import { PokemonType } from '../../models/pokemon.model';
import { Pokemon } from '../../models/pokemon.model';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';

@Component({
  selector: 'app-pokedex-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe],
  templateUrl: "./pokedex-list.component.html",
  styleUrl : "./pokedex-list.component.scss",
})
export class PokedexListComponent implements OnInit {
  private pokedex = inject(PokedexService);

  list = computed<Pokemon[] | null>(() => this.pokedex.all());

  async ngOnInit() {
    await this.pokedex.ensureLoaded();
  }

  typesOf(p: Pokemon): PokemonType[] {
  return [...p.types];
}
}