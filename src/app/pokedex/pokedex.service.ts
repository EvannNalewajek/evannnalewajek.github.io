import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pokemon } from './pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokedexService {
    private http = inject(HttpClient);
    private _all = signal<Pokemon[] | null>(null);
    
    all = this._all.asReadonly();

    async ensureLoaded(): Promise<void> {
        if (this._all() !== null) return;
        const data = await this.http.get<Pokemon[]>('/pokedex/pokedex.json').toPromise();
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

}
