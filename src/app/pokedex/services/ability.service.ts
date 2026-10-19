import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';
import { Ability } from '../models/ability.model';
import { slugify } from '../utils/slugify';

@Injectable({ providedIn: 'root' })
export class AbilitiesService {
  private http = inject(HttpClient);
  private url = '/pokedex/abilities.json';

  readonly searchQuery = signal<string>('');
  readonly sortKey = signal<'id' | 'name'>('id');

  private _abilities$ = this.http.get<unknown>(this.url).pipe(
    map(raw => {
      const list: Record<string, any>[] = Array.isArray(raw)
        ? raw
        : Object.values((raw as Record<string, any>) || {});
      return list
        .map((a, i): Ability => ({
          id: typeof a['id'] === 'number' ? a['id'] : (parseInt(String(a['id']), 10) || i + 1),
          slug: a['slug'] ? slugify(a['slug']) : slugify(a['name'] ?? a['nom'] ?? `talent-${i + 1}`),
          name: a['name'] ?? a['nom'] ?? `Talent ${i + 1}`,
          battleEffectCondition: a['battleEffectCondition'] ?? null,
          battleEffectShort:     a['battleEffectShort']     ?? null,
          battleEffectLong:      a['battleEffectLong']      ?? null,
          fieldEffectCondition:  a['fieldEffectCondition']  ?? null,
          fieldEffectLong:       a['fieldEffectLong']       ?? null,
          description:           a['description']           ?? null,
        }))
        .sort((x, y) => x.id - y.id);
    }),
    shareReplay(1)
  );

  getAll() {
    return this._abilities$;
  }

  getBySlug$(slug: string) {
    return this._abilities$.pipe(
      map(list => list.find(a => a.slug === slug) ?? null)
    );
  }
}