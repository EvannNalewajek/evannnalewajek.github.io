import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PokedexService } from '../../services/pokedex.service';
import { Pokemon, PokemonType } from '../../models/pokemon.model';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
  selector: 'app-pokedex-list',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TypeSlugPipe, ImageFallbackDirective, BackButtonDirective],
  templateUrl: './pokedex-list.component.html',
  styleUrl: './pokedex-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexListComponent implements OnInit {
  private pokedex = inject(PokedexService);

  readonly q = this.pokedex.searchQuery;
  readonly sortKey = this.pokedex.sortKey;
  readonly selectedTypes = this.pokedex.selectedTypes;

  readonly availableTypes = computed(() => {
    const all = this.pokedex.all();
    if (!all) return [];
    const types = new Set<PokemonType>();
    all.forEach(p => p.types.forEach(t => types.add(t)));
    return Array.from(types).sort();
  });

  readonly list = computed<Pokemon[] | null>(() => {
    const all = this.pokedex.all();
    if (!all) return null;

    const query = this.q().trim().toLowerCase();
    const key = this.sortKey();
    const selTypes = this.selectedTypes();

    const seen = new Set<number>();
    const filtered: Pokemon[] = [];

    for (const p of all) {
      if (seen.has(p.id)) continue;

      const matchesQ =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.id.toString().includes(query) ||
        p.types.some(t => t.toLowerCase().includes(query));

      const matchesType =
        selTypes.length === 0 ||
        selTypes.every(t => p.types.includes(t));

      if (matchesQ && matchesType) {
        seen.add(p.id);
        filtered.push(p);
      }
    }

    return [...filtered].sort((a, b) => {
      if (key === 'id') return a.id - b.id;
      if (key === 'name') return a.name.localeCompare(b.name, 'fr');
      if (key === 'type') {
        const typeA = a.types[0] + (a.types[1] || '');
        const typeB = b.types[0] + (b.types[1] || '');
        return typeA.localeCompare(typeB, 'fr');
      }
      return 0;
    });
  });

  query(v: string) {
    this.q.set(v);
  }

  selectSort(v: string) {
    this.sortKey.set((v as 'id' | 'name' | 'type') || 'id');
  }

  toggleType(type: PokemonType) {
    this.selectedTypes.update(current => {
      if (current.includes(type)) {
        return current.filter(t => t !== type);
      } else {
        const next = [...current, type];
        return next.length > 2 ? next.slice(1) : next;
      }
    });
  }

  isTypeSelected(type: PokemonType): boolean {
    return this.selectedTypes().includes(type);
  }

  async ngOnInit() {
    await this.pokedex.ensureLoaded();
  }
}
