import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Ability } from '../models/ability.model';

function slugify(input: string): string {
    return input
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
}

@Injectable({ providedIn: 'root' })
export class AbilitiesService {
    private http = inject(HttpClient);
    private url  = '/pokedex/abilities.json';

    getAll() {
        return this.http.get<any>(this.url).pipe(
        map((raw) => {
            const list: any[] = Array.isArray(raw) ? raw : Object.values(raw || {});
            return list
            .map((a, i): Ability => ({
                id: typeof a.id === 'number' ? a.id : (parseInt(String(a.id), 10) || i + 1),
                slug: a.slug ? slugify(a.slug) : slugify(a.name ?? a.nom ?? `talent-${i + 1}`),
                name: a.name ?? a.nom ?? `Talent ${i + 1}`,
                battleEffectCondition: a.battleEffectCondition ?? null,
                battleEffectShort:     a.battleEffectShort     ?? null,
                battleEffectLong:      a.battleEffectLong      ?? null,
                fieldEffectCondition:  a.fieldEffectCondition  ?? null,
                fieldEffectLong:       a.fieldEffectLong       ?? null,
                description:           a.description           ?? null,
            }))
            .sort((x, y) => x.id - y.id);
        })
        );
    }

    getBySlug$(slug: string) {
        return this.getAll().pipe(
            map(list => list.find(a => a.slug === slug) ?? null)
        );
    }
}