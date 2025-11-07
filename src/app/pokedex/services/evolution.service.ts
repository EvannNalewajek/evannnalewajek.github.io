import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EvolutionDB, EvolutionFamily, EvolutionLink, EvoTrigger } from '../models/evolution.model';

@Injectable({ providedIn: 'root' })
export class EvolutionService {
  private http = inject(HttpClient);
  private _db = signal<EvolutionDB | null>(null);

  db = this._db.asReadonly();

  async ensureLoaded() {
    if (!this._db()) {
      const data = await this.http.get<EvolutionDB>('/pokedex/evolutions.json').toPromise();
      this._db.set(data ?? { families: [] });
    }
  }

  familyFor(speciesId: number): EvolutionFamily | null {
    const db = this._db();
    if (!db) return null;
    return db.families.find(f => f.species.includes(speciesId)) ?? null;
  }

  orderedChain(fam: EvolutionFamily): { order: number[]; links: EvolutionLink[] } {
    const incoming = new Map<number, number>();
    fam.species.forEach(id => incoming.set(id, 0));
    fam.links.forEach(l => incoming.set(l.to, (incoming.get(l.to) ?? 0) + 1));
    const root = fam.species.find(id => (incoming.get(id) ?? 0) === 0) ?? fam.species[0];

    const order: number[] = [root];
    const links: EvolutionLink[] = [];
    let current = root;
    while (true) {
      const outs = fam.links.filter(l => l.from === current);
      if (!outs.length) break;
      const next = outs[0];
      links.push(next);
      order.push(next.to);
      current = next.to;
    }
    return { order, links };
  }

  triggerText(tr: EvoTrigger): string {
    switch (tr.kind) {
      case 'level': return `au niveau ${tr.level}${tr.condition ? ` (${tr.condition})` : ''}`;
      case 'item': return `avec ${tr.item}${tr.condition ? ` (${tr.condition})` : ''}`;
      case 'friendship': return `par bonheur${tr.threshold ? ` (≥ ${tr.threshold})` : ''}${tr.condition ? ` (${tr.condition})` : ''}`;
      case 'trade': return `par échange${tr.withItem ? ` (tenir ${tr.withItem})` : ''}${tr.condition ? ` (${tr.condition})` : ''}`;
      case 'other': return tr.text;
    }
  }
}