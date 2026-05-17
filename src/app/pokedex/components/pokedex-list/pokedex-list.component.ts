import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PokedexService } from '../../services/pokedex.service';
import { PokemonType } from '../../models/pokemon.model';
import { Pokemon } from '../../models/pokemon.model';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

@Component({
  selector: 'app-pokedex-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe, ImageFallbackDirective],
  templateUrl: "./pokedex-list.component.html",
  styleUrl : "./pokedex-list.component.scss",
})
export class PokedexListComponent implements OnInit {
  private pokedex = inject(PokedexService);
  private location = inject(Location);

  q = this.pokedex.searchQuery;
  sortKey = signal<'id' | 'name' | 'type'>('id');
  selectedTypes = signal<string[]>([]);

  availableTypes = computed(() => {
    const all = this.pokedex.all();
    if (!all) return [];
    const types = new Set<string>();
    all.forEach(p => p.types.forEach(t => types.add(t)));
    return Array.from(types).sort();
  });

  list = computed<Pokemon[] | null>(() => {
    const all = this.pokedex.all();
    if (!all) return null;

    const query = this.q().trim().toLowerCase();
    const key = this.sortKey();
    const selTypes = this.selectedTypes();

    const seen = new Set<number>();
    const filtered: Pokemon[] = [];

    for (const p of all) {
      if (seen.has(p.id)) continue;
      
      const matchesQ = !query || 
                       p.name.toLowerCase().includes(query) || 
                       p.id.toString().includes(query) ||
                       p.types.some(t => t.toLowerCase().includes(query));

      const matchesType = selTypes.length === 0 || 
                          selTypes.every(t => p.types.includes(t as PokemonType));

      if (matchesQ && matchesType) {
        seen.add(p.id);
        filtered.push(p);
      }
    }

    return [...filtered].sort((a, b) => {
      if (key === 'id') return a.id - b.id;
      if (key === 'name') return a.name.localeCompare(b.name);
      if (key === 'type') {
        const typeA = a.types[0] + (a.types[1] || '');
        const typeB = b.types[0] + (b.types[1] || '');
        return typeA.localeCompare(typeB);
      }
      return 0;
    });
  });

  query(v: string) { this.q.set(v); }
  selectSort(v: string) { this.sortKey.set((v as 'id' | 'name' | 'type') || 'id'); }

  toggleType(type: string) {
    this.selectedTypes.update(current => {
      if (current.includes(type)) {
        return current.filter(t => t !== type);
      } else {
        const next = [...current, type];
        return next.length > 2 ? next.slice(1) : next;
      }
    });
  }

  isTypeSelected(type: string): boolean {
    return this.selectedTypes().includes(type);
  }

  async ngOnInit() {
    await this.pokedex.ensureLoaded();
  }



  typesOf(p: Pokemon): PokemonType[] {
    return [...p.types];
  }
}
