import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { Move } from './move.model';

@Injectable({ providedIn: 'root' })
export class MovesService {
  private http = inject(HttpClient);

  private url = '/pokedex/moves.json';

  getAll() {
    return this.http.get<any>(this.url).pipe(
      map((raw) => {
        const list: any[] = Array.isArray(raw) ? raw : Object.values(raw || {});
        return list.map((m, i) => {
          const move: Move = {
            id: m.id ?? i + 1,
            name: m.name ?? m.nom ?? m.move ?? `Capacité ${i + 1}`,
            type: m.type ?? m.typ ?? 'Normal',
            category: (m.category ?? m.cat ?? 'Statut') as Move['category'],
            power: m.power ?? m.puissance ?? null,
            accuracy: m.accuracy ?? m.precision ?? null,
            pp: m.pp ?? m.PP ?? null,
            priority: m.priority ?? m.prio ?? 0,
            shortDesc: m.shortDesc ?? m.short_description ?? m.short ?? null,
            desc: m.desc ?? m.description ?? null,
            target: m.target,
            makesContact: m.makesContact ?? m.contact ?? false,
          };
          return move;
        });
      })
    );
  }
}
