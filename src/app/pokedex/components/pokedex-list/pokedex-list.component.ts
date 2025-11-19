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

  list = computed<Pokemon[] | null>(() => {
    const all = this.pokedex.all();
    if (!all) return null;

    const seen = new Set<number>();
    const unique: Pokemon[] = [];

    for (const p of all) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      unique.push(p);
    }

    return unique;
  });


  async ngOnInit() {
    await this.pokedex.ensureLoaded();
  }

  typesOf(p: Pokemon): PokemonType[] {
  return [...p.types];
}
}