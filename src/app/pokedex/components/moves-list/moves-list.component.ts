import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { MovesService } from '../../services/moves.service';
import { Move } from '../../models/move.model';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
  selector: 'app-moves-list',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TypeSlugPipe, BackButtonDirective],
  templateUrl: './moves-list.component.html',
  styleUrls: ['./moves-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovesListComponent {
  private readonly svc = inject(MovesService);
  private readonly title = inject(Title);

  private readonly _moves = toSignal<Move[] | null>(this.svc.getAll(), { initialValue: null });
  readonly loading = computed(() => this._moves() === null);

  readonly queryVal = this.svc.searchQuery;
  readonly typeVal = this.svc.filterType;
  readonly categoryVal = this.svc.filterCategory;
  readonly sortVal = this.svc.sortKey;

  constructor() {
    this.title.setTitle('Pokédex — Capacités');
  }

  readonly list = computed(() => {
    const data = this._moves();
    if (data === null) return null;

    const q = this.queryVal().trim().toLowerCase();
    const t = this.typeVal();
    const c = this.categoryVal();

    let out = data.filter(m => {
      const matchQ = !q || m.name.toLowerCase().includes(q) || (m.desc?.toLowerCase().includes(q) ?? false);
      const matchT = !t || m.type === t;
      const matchC = !c || normalizeCat(m.category) === c;
      return matchQ && matchT && matchC;
    });

    const sorting = this.sortVal();
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

  query(v: string) { this.queryVal.set(v); }
  selectType(v: string) { this.typeVal.set(v); }
  selectCategory(v: string) { this.categoryVal.set(v); }
  selectSort(v: 'id' | 'name' | 'type' | 'category' | 'power' | 'accuracy' | 'pp' | 'priority') {
    this.sortVal.set(v);
  }

  readonly types = computed(() => {
    const set = new Set((this._moves() ?? []).map(m => m.type));
    return Array.from(set).sort();
  });

  readonly categories = [
    { key: 'Physique', label: 'Physique' },
    { key: 'Spécial',  label: 'Spéciale' },
    { key: 'Statut',   label: 'Statut'   },
  ];

  readonly sortKeys = [
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
