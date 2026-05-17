import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovesService } from '../../services/moves.service';
import { Move } from '../../models/move.model';

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
  private location = inject(Location);

  loading = signal<boolean>(true);
  private _moves = signal<Move[] | null>(null);
  private _query = this.svc.searchQuery;
  private _type = this.svc.filterType;
  private _category = this.svc.filterCategory;
  private _sort = this.svc.sortKey;

  constructor() {
    this.svc.getAll().subscribe(m => {
      this._moves.set(m);
      this.loading.set(false);
    });
  }

  list = computed(() => {
    const data = this._moves();
    if (data === null) return null;

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
    { key: 'id', label: 'ID' },
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
    case 'Special':  return 'Spécial';
    case 'Status':   return 'Statut';
    default:         return cat as string;
  }
}
function valueFor(m: Move, key: string) {
  switch (key) {
    case 'id': return m.id ?? -1;
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
