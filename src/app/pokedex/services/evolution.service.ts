import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { EvolutionDB, EvolutionFamily, EvolutionLink } from '../models/evolution.model';

@Injectable({ providedIn: 'root' })
export class EvolutionService {
  private http = inject(HttpClient);
  private _db = signal<EvolutionDB | null>(null);
  private _loadingPromise: Promise<void> | null = null;

  readonly db = this._db.asReadonly();
  readonly loaded = computed(() => this._db() !== null);

  async ensureLoaded(): Promise<void> {
    if (this._db() !== null) return;
    if (this._loadingPromise) return this._loadingPromise;

    this._loadingPromise = firstValueFrom(
      this.http.get<EvolutionDB>('/pokedex/evolutions.json')
    )
      .then(data => {
        this._db.set(data ?? { families: [] });
      })
      .finally(() => {
        this._loadingPromise = null;
      });

    return this._loadingPromise;
  }

  familyFor(speciesId: number): EvolutionFamily | null {
    const db = this._db();
    if (!db) return null;
    return db.families.find(f => f.species.includes(speciesId)) ?? null;
  }

  formatTriggerLabel(link: EvolutionLink | null | undefined): string {
    if (!link) return '';
    const t = link.trigger;
    switch (t.kind) {
      case 'level':
        return `Niveau ${t.level}${t.condition ? ` (${t.condition})` : ''}`;
      case 'item':
        return `Objet : ${t.item}${t.condition ? ` (${t.condition})` : ''}`;
      case 'friendship':
        return `Bonheur${t.threshold ? ` (≥ ${t.threshold})` : ''}${t.condition ? ` (${t.condition})` : ''}`;
      case 'trade':
        return `Échange${t.withItem ? ` (tenir ${t.withItem})` : ''}${t.condition ? ` (${t.condition})` : ''}`;
      case 'other':
        return String(t.text ?? '');
    }
  }

  formatTriggerInSentence(link: EvolutionLink): string {
    const t = link.trigger;
    switch (t.kind) {
      case 'level':
        return `au niveau ${t.level}${t.condition ? `, ${t.condition}` : ''}`;
      case 'item':
        return `avec ${t.item}${t.condition ? `, ${t.condition}` : ''}`;
      case 'friendship':
        return `par bonheur${t.threshold ? ` (≥ ${t.threshold})` : ''}${t.condition ? `, ${t.condition}` : ''}`;
      case 'trade':
        return `par échange${t.withItem ? ` en tenant ${t.withItem}` : ''}${t.condition ? `, ${t.condition}` : ''}`;
      case 'other':
        return String(t.text ?? '');
    }
  }
}