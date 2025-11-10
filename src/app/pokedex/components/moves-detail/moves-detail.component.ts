import { Component, computed, inject, signal, DestroyRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap, combineLatest, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MovesService } from '../../services/moves.service';
import { LearnsetsService } from '../../services/learnsets.service';
import { PokedexService } from '../../services/pokedex.service';

import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { Move } from '../../models/move.model';
import { MoveTargetDiagramComponent } from '../move-target-diagram/move-target-diagram.component';

import { WikilinkPipe } from '../../pipes/wikilink.pipe';

interface LearnerRow {
  id: number;
  name: string;
  sprite: string;
  level?: number;
}

@Component({
  selector: 'app-moves-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe, MoveTargetDiagramComponent, WikilinkPipe],
  templateUrl: './moves-detail.component.html',
  styleUrls: ['./moves-detail.component.scss'],
})
export class MovesDetailComponent {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private movesSvc = inject(MovesService);
  private learnsets = inject(LearnsetsService);
  private pokedex  = inject(PokedexService);

  loading = signal(true);

  list = signal<Move[]>([]);
  currentSlug = signal<string>('');

  readonly learnersLevel = signal<LearnerRow[]>([]);
  readonly learnersTM    = signal<LearnerRow[]>([]);
  readonly learnersEgg   = signal<LearnerRow[]>([]);

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
    this.movesSvc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => {
        this.list.set(list);
        this.loading.set(false);
      });

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pm => {
        const slugOrId = pm.get('slug') ?? pm.get('id') ?? '';
        this.currentSlug.set(slugOrId);
      });

    effect(() => {
      const m = this.move();
      if (!m) {
        this.learnersLevel.set([]);
        this.learnersTM.set([]);
        this.learnersEgg.set([]);
        return;
      }
      (async () => {
        await this.pokedex.ensureLoaded();

        this.learnsets.getPokemonByMove$(m.slug)
          .pipe(
            switchMap(entries => {
              if (!entries?.length) return of({ level: [], tm: [], egg: [] as LearnerRow[] });

              const rowsLevel: LearnerRow[] = [];
              const rowsTM:    LearnerRow[] = [];
              const rowsEgg:   LearnerRow[] = [];

              for (const e of entries) {
                const p = this.pokedex.getById(e.id);
                if (!p) continue;

                const sprite = p.images?.sprite ? this.pokedex.normalizeImg(p.images.sprite) : '';
                const row: LearnerRow = {
                  id: p.id,
                  name: p.name,
                  sprite
                };

                if (e.method === 'level') {
                  rowsLevel.push({ ...row, level: e.level ?? undefined });
                } else if (e.method === 'tm') {
                  rowsTM.push(row);
                } else {
                  rowsEgg.push(row);
                }
              }

              rowsLevel.sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.id - b.id);
              rowsTM.sort((a, b)    => a.id - b.id);
              rowsEgg.sort((a, b)   => a.id - b.id);

              return of({ level: rowsLevel, tm: rowsTM, egg: rowsEgg });
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(({ level, tm, egg }) => {
            this.learnersLevel.set(level);
            this.learnersTM.set(tm);
            this.learnersEgg.set(egg);
          });
      })();
    });
  }

  pokemonLink(id: number) {
    return ['/pokedex/pokemons', id];
  }

  hasAnyLearners() {
    return (
      this.learnersLevel().length +
      this.learnersTM().length +
      this.learnersEgg().length
    ) > 0;
  }

  trackId = (_: number, r: LearnerRow) => r.id;

  critLabel(rate: Move['critRate'] | null): string {
    if (!rate || rate === 'normal') return 'Normal';
    if (rate === 'high') return 'Élevé';
    if (rate === 'very-high') return 'Très élevé';
    return '—';
  }
}