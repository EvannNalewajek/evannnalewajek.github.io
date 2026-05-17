import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';

export type MoveCategory = 'Physique' | 'Spécial' | 'Statut' | string;
export interface Move {
  id: string;
  name: string;
  type: string;
  category?: MoveCategory;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  priority?: number | null;
  shortDesc?: string;
  desc?: string;
}

@Injectable({ providedIn: 'root' })
export class PokedexService {
  private http = inject(HttpClient);

  readonly searchQuery = signal<string>('');

  private _all = signal<Pokemon[] | null>(null);
  all = this._all.asReadonly();

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
    const data = await firstValueFrom(
      this.http.get<Pokemon[]>('/pokedex/pokedex.json')
    );
    this._all.set((data ?? []).sort((a, b) => a.id - b.id));
  }

  getById(id: number) {
    const forms = this.getFormsById(id);
    return forms.length ? forms[0] : null;
  }

  getBySlug(slug: string) {
    const all = this._all();
    if (!all) return null;
    
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

  maxId() {
    const all = this._all();
    return all && all.length ? Math.max(...all.map(p => p.id)) : 0;
  }

  normalizeImg(path: string) {
    return path.startsWith('/') ? path : '/' + path;
  }

  private _moves = signal<Move[] | null>(null);

  moves(): Move[] {
    return this._moves() ?? [];
  }

  async ensureMovesLoaded(): Promise<void> {
    if (this._moves() !== null) return;
    const data = await firstValueFrom(
      this.http.get<Move[]>('/pokedex/moves.json')
    );
    const sorted = (data ?? []).slice().sort((a, b) => {
      const an = a.name.localeCompare(b.name, 'fr');
      return an !== 0 ? an : a.id.localeCompare(b.id);
    });
    this._moves.set(sorted);
  }

  moveById(id: string) {
    return this.moves().find(m => m.id === id);
  }
}