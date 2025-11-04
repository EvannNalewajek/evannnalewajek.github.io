import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from './pokemon.model';

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

  private _all = signal<Pokemon[] | null>(null);
  all = this._all.asReadonly();

  async ensureLoaded(): Promise<void> {
    if (this._all() !== null) return;
    const data = await firstValueFrom(
      this.http.get<Pokemon[]>('/pokedex/pokedex.json')
    );
    this._all.set((data ?? []).sort((a, b) => a.id - b.id));
  }

  getById(id: number) {
    const all = this._all();
    return all ? all.find(p => p.id === id) ?? null : null;
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