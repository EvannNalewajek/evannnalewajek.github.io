import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PokemonType } from '../models/pokemon.model';
import { TypeInfo } from '../models/types.model';
import { TYPE_MULTIPLIER } from '../type-chart';

@Injectable({ providedIn: 'root' })
export class TypesService {
  private http = inject(HttpClient);
  private _types = signal<TypeInfo[] | null>(null);

  types = this._types.asReadonly();

  async ensureLoaded() {
    if (this._types()) return;
    const data = await this.http.get<TypeInfo[]>('/pokedex/types.json').toPromise();
    const order: PokemonType[] = [
      'Normal','Feu','Eau','Plante','Électrik','Glace','Combat','Poison','Sol',
      'Vol','Psy','Insecte','Roche','Spectre','Dragon','Ténèbres','Acier','Fée'
    ];
    const mapIndex = new Map(order.map((t,i)=>[t,i]));
    this._types.set((data ?? []).slice().sort((a,b)=>(mapIndex.get(a.name)??99)-(mapIndex.get(b.name)??99)));
  }

  getBySlug(slug: string): TypeInfo | null {
    const all = this._types();
    return all ? all.find(t => t.slug === slug) ?? null : null;
  }

  defenseBuckets(selected: PokemonType) {
    const mults = Object.entries(TYPE_MULTIPLIER).map(([atk, row]) => ({ atk: atk as PokemonType, m: row[selected] }));
    return {
      zero:  mults.filter(x => x.m === 0).map(x => x.atk),
      half:  mults.filter(x => x.m === 0.5).map(x => x.atk),
      norm:  mults.filter(x => x.m === 1).map(x => x.atk),
      dbl:   mults.filter(x => x.m === 2).map(x => x.atk),
    };
  }

  attackBuckets(selected: PokemonType) {
    const row = TYPE_MULTIPLIER[selected];
    const mults = Object.entries(row).map(([def, m]) => ({ def: def as PokemonType, m }));
    return {
      zero:  mults.filter(x => x.m === 0).map(x => x.def),
      half:  mults.filter(x => x.m === 0.5).map(x => x.def),
      norm:  mults.filter(x => x.m === 1).map(x => x.def),
      dbl:   mults.filter(x => x.m === 2).map(x => x.def),
    };
  }
}