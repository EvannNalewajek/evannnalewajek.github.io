import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Item } from '../models/item.model';

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
export class ItemService {
    private http = inject(HttpClient);
    private url  = '/pokedex/items.json';

    getAll() {
        return this.http.get<any>(this.url).pipe(
        map((raw) => {
            const list: any[] = Array.isArray(raw) ? raw : Object.values(raw || {});
            return list
            .map((o, i): Item => ({
                id: typeof o.id === 'number' ? o.id : (parseInt(String(o.id), 10) || i + 1),
                slug: o.slug ? slugify(o.slug) : slugify(o.name ?? `objet-${i + 1}`),
                name: o.name ?? `Objet ${i + 1}`,
                description:           o.description           ?? null,
                effet:                 o.effet                 ?? null,
                category:              o.category              ?? null,
                usage:                 o.usage                 ?? null,
                images:                o.images                ?? null,
                buy:                   o.buy                   ?? "Non achetable",
                sell:                  o.sell                   ?? "Non revendable",

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

    normalizeImg(path: string) {
        return path.startsWith('/') ? path : '/' + path;
    }
}