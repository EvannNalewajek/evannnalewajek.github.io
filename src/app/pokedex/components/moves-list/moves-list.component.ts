import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovesService } from '../../moves.service';
import { Move } from '../../move.model';

import { TypeSlugPipe } from '../../pipes/type-slug.pipe';

@Component({
  selector: 'app-moves-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe],
  templateUrl: './moves-list.component.html',
  styleUrls: ['./moves-list.component.scss']
})
export class MovesListComponent {
  private svc = inject(MovesService);

  private _moves = signal<Move[] | null>(null);
  private _query = signal<string>('');
  private _type = signal<string>('');
  private _category = signal<string>('');
  private _sort = signal<'name'|'type'|'category'|'power'|'accuracy'|'pp'|'priority'>('name');

  constructor() {
    this.svc.getAll().subscribe(m => this._moves.set(m));
  }

  list = computed(() => {
    const data = this._moves() ?? [];
    const q = this._query().trim().toLowerCase();
    const t = this._type();
    const c = this._category();

    let out = data.filter(m => {
      const matchQ = !q || m.name.toLowerCase().includes(q) || (m.desc?.toLowerCase().includes(q) ?? false);
      const matchT = !t || m.type === t;
      const matchC = !c || normalizeCat(m.category) === c;
      return matchQ && matchT && matchC;
    });

    const sorting = this._sort();
    out = [...out].sort((a, b) => {
      const va = valueFor(a, sorting);
      const vb = valueFor(b, sorting);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return va < vb ? -1 : va > vb ? 1 : 0;
    });

    return out;
  });

  query(v: string) { this._query.set(v); }
  selectType(v: string) { this._type.set(v); }
  selectCategory(v: string) { this._category.set(v); }
  selectSort(v: typeof this._sort extends any ? any : never) { this._sort.set(v); }

  types = computed(() => {
    const set = new Set((this._moves() ?? []).map(m => m.type));
    return Array.from(set).sort();
  });

  categories = [
    { key: 'Physique', label: 'Physique' },
    { key: 'Spéciale', label: 'Spéciale' },
    { key: 'Statut',   label: 'Statut'   },
  ];

  sortKeys = [
    { key: 'name', label: 'Nom' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Catégorie' },
    { key: 'power', label: 'Puissance' },
    { key: 'accuracy', label: 'Précision' },
    { key: 'pp', label: 'PP' },
    { key: 'priority', label: 'Prio' },
  ];
}

function normalizeCat(cat: Move['category']): string {
  switch (cat) {
    case 'Physical': return 'Physique';
    case 'Special':  return 'Spéciale';
    case 'Status':   return 'Statut';
    default:         return cat as string;
  }
}
function valueFor(m: Move, key: string) {
  switch (key) {
    case 'name': return m.name?.toLowerCase() ?? '';
    case 'type': return m.type?.toLowerCase() ?? '';
    case 'category': return normalizeCat(m.category);
    case 'power': return m.power ?? -1;
    case 'accuracy': return m.accuracy ?? -1;
    case 'pp': return m.pp ?? -1;
    case 'priority': return m.priority ?? -99;
    default: return '';
  }
}