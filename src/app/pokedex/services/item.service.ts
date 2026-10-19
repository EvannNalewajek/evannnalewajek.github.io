import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';
import { Item } from '../models/item.model';
import { normalizeImg, slugify } from '../utils/slugify';

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);
  private url = '/pokedex/items.json';

  readonly searchQuery = signal<string>('');
  readonly sortKey = signal<'id' | 'name'>('id');

  private _items$ = this.http.get<unknown>(this.url).pipe(
    map(raw => {
      const list: Record<string, any>[] = Array.isArray(raw)
        ? raw
        : Object.values((raw as Record<string, any>) || {});
      return list
        .map((o, i): Item => ({
          id: typeof o['id'] === 'number' ? o['id'] : (parseInt(String(o['id']), 10) || i + 1),
          slug: o['slug'] ? slugify(o['slug']) : slugify(o['name'] ?? `objet-${i + 1}`),
          name: o['name'] ?? `Objet ${i + 1}`,
          description: o['description'] ?? null,
          effet:       o['effet']       ?? null,
          category:    o['category']    ?? '',
          usage:       o['usage']       ?? '',
          images: {
            sprite:  normalizeImg(o['images']?.sprite, '/pokedex/img/items/default_sprite.png'),
            artwork: normalizeImg(o['images']?.artwork, '/pokedex/img/items/default_artwork.png'),
          },
          buy:  typeof o['buy'] === 'number' ? o['buy'] : null,
          sell: typeof o['sell'] === 'number' ? o['sell'] : null,
        }))
        .sort((x, y) => x.id - y.id);
    }),
    shareReplay(1)
  );

  getAll() {
    return this._items$;
  }

  getBySlug$(slug: string) {
    return this._items$.pipe(
      map(list => list.find(a => a.slug === slug) ?? null)
    );
  }

  normalizeImg(path: string): string {
    return normalizeImg(path);
  }
}