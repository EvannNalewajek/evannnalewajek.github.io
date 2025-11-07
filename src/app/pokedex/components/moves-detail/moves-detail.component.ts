import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MovesService } from '../../services/moves.service';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { Move } from '../../models/move.model';
import { MoveTargetDiagramComponent } from '../move-target-diagram/move-target-diagram.component';

@Component({
  selector: 'app-moves-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe, MoveTargetDiagramComponent],
  templateUrl: './moves-detail.component.html',
  styleUrls: ['./moves-detail.component.scss'],
})
export class MovesDetailComponent {
  private route = inject(ActivatedRoute);
  private movesSvc = inject(MovesService);

  loading = signal(true);
  list    = signal<Move[]>([]);
  currentSlug = signal<string>('');

  move = computed<Move | null>(() => {
    const slug = this.currentSlug();
    const arr  = this.list();
    if (!slug || !arr.length) return null;
    return (
      arr.find(m => m.slug === slug) ??
      arr.find(m => String(m.id) === slug) ??
      null
    );
  });

  index = computed(() => {
    const m = this.move();
    const arr = this.list();
    if (!m || !arr.length) return -1;
    return arr.findIndex(x => x.slug === m.slug);
  });

  prev = computed<Move | undefined>(() => {
    const i = this.index();
    const arr = this.list();
    return i > 0 ? arr[i - 1] : undefined;
  });

  next = computed<Move | undefined>(() => {
    const i = this.index();
    const arr = this.list();
    return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : undefined;
  });

    constructor() {
        this.movesSvc.getAll().subscribe(list => {
            this.list.set(list);
            this.loading.set(false);
        });

        this.route.paramMap.subscribe(pm => {
            const slugOrId = pm.get('id') ?? pm.get('slug') ?? '';
            this.currentSlug.set(slugOrId);
        });
    }

    critLabel(rate: Move['critRate'] | null): string {
        if (!rate || rate === 'normal') return 'Normal';
        if (rate === 'high') return 'Élevé';
        if (rate === 'very-high') return 'Très élevé';
        return '—';
    }
}