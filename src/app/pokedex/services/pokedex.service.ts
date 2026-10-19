import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Pokemon, PokemonType } from '../models/pokemon.model';
import { normalizeImg } from '../utils/slugify';

@Injectable({ providedIn: 'root' })
export class PokedexService {
  private http = inject(HttpClient);
  private _loadingPromise: Promise<void> | null = null;

  readonly searchQuery = signal<string>('');
  readonly sortKey = signal<'id' | 'name' | 'type'>('id');
  readonly selectedTypes = signal<PokemonType[]>([]);

  private _all = signal<Pokemon[] | null>(null);
  readonly all = this._all.asReadonly();
  readonly loaded = computed(() => this._all() !== null);

  readonly uniqueList = computed(() => {
    const list = this._all();
    if (!list) return [];
    const seen = new Set<number>();
    return list.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  });

  async ensureLoaded(): Promise<void> {
    if (this._all() !== null) return;
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = firstValueFrom(
      this.http.get<Pokemon[]>('/pokedex/pokedex.json')
    )
      .then(data => {
        const normalized = (data ?? [])
          .map(p => ({
            ...p,
            images: {
              sprite: normalizeImg(p.images?.sprite, '/pokedex/img/pokemon/000_sprite.png'),
              artwork: normalizeImg(p.images?.artwork, '/pokedex/img/pokemon/000_artwork.png'),
            },
          }))
          .sort((a, b) => a.id - b.id);
        this._all.set(normalized);
      })
      .finally(() => {
        this._loadingPromise = null;
      });

    return this._loadingPromise;
  }

  getById(id: number): Pokemon | null {
    const forms = this.getFormsById(id);
    return forms.length ? forms[0] : null;
  }

  getBySlug(slug: string): Pokemon | null {
    const all = this._all();
    if (!all || !slug) return null;

    // 1. Essayer par slug
    const bySlug = all.find(p => p.slug === slug);
    if (bySlug) return bySlug;

    // 2. Fallback par ID si la chaîne est numérique (rétrocompatibilité)
    if (/^\d+$/.test(slug)) {
      const id = parseInt(slug, 10);
      return all.find(p => p.id === id) ?? null;
    }

    return null;
  }

  getFormsById(id: number): Pokemon[] {
    const all = this._all();
    if (!all) return [];
    return all.filter(p => p.id === id);
  }

  normalizeImg(path: string): string {
    return normalizeImg(path);
  }
}