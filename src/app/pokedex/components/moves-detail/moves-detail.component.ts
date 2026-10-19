import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Subscription } from 'rxjs';

import { MovesService } from '../../services/moves.service';
import { LearnsetsService } from '../../services/learnsets.service';
import { PokedexService } from '../../services/pokedex.service';

import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { Move } from '../../models/move.model';
import { MoveTargetDiagramComponent } from '../move-target-diagram/move-target-diagram.component';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';
import { RouterizedContentDirective } from '../../routerized-content.directive';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';
import { BackButtonDirective } from '../../directives/back-button.directive';

interface LearnerRow {
  id: number;
  slug: string;
  name: string;
  sprite: string;
  level?: number;
}

@Component({
  selector: 'app-moves-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    TypeSlugPipe,
    MoveTargetDiagramComponent,
    WikilinkPipe,
    RouterizedContentDirective,
    ImageFallbackDirective,
    BackButtonDirective,
  ],
  templateUrl: './moves-detail.component.html',
  styleUrls: ['./moves-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovesDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly movesSvc = inject(MovesService);
  private readonly learnsets = inject(LearnsetsService);
  private readonly pokedex = inject(PokedexService);

  private readonly _list = toSignal<Move[] | null>(this.movesSvc.getAll(), { initialValue: null });
  readonly loading = computed(() => this._list() === null);
  readonly list = computed(() => this._list() ?? []);

  readonly currentSlug = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('slug') ?? pm.get('id') ?? '')),
    { initialValue: '' }
  );

  readonly learnersLevel = signal<LearnerRow[]>([]);
  readonly learnersTM = signal<LearnerRow[]>([]);
  readonly learnersEgg = signal<LearnerRow[]>([]);

  readonly move = computed<Move | null>(() => {
    const slug = this.currentSlug();
    const arr = this.list();
    if (!slug || !arr.length) return null;
    return (
      arr.find(m => m.slug === slug) ??
      arr.find(m => String(m.id) === slug) ??
      null
    );
  });

  readonly index = computed(() => {
    const m = this.move();
    const arr = this.list();
    if (!m || !arr.length) return -1;
    return arr.findIndex(x => x.slug === m.slug);
  });

  readonly prev = computed<Move | undefined>(() => {
    const i = this.index();
    const arr = this.list();
    return i > 0 ? arr[i - 1] : undefined;
  });

  readonly next = computed<Move | undefined>(() => {
    const i = this.index();
    const arr = this.list();
    return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : undefined;
  });

  constructor() {
    effect(onCleanup => {
      const m = this.move();
      if (!m) {
        this.learnersLevel.set([]);
        this.learnersTM.set([]);
        this.learnersEgg.set([]);
        return;
      }

      this.title.setTitle(`Pokédex — ${m.name}`);

      let cancelled = false;
      let sub: Subscription | null = null;

      onCleanup(() => {
        cancelled = true;
        sub?.unsubscribe();
      });

      this.pokedex.ensureLoaded().then(() => {
        if (cancelled) return;
        sub = this.learnsets.getPokemonByMove$(m.slug).subscribe(entries => {
          if (cancelled) return;
          if (!entries?.length) {
            this.learnersLevel.set([]);
            this.learnersTM.set([]);
            this.learnersEgg.set([]);
            return;
          }

          const rowsLevel: LearnerRow[] = [];
          const rowsTM: LearnerRow[] = [];
          const rowsEgg: LearnerRow[] = [];

          for (const e of entries) {
            const p = this.pokedex.getById(e.id);
            if (!p) continue;

            const sprite = p.images?.sprite ? this.pokedex.normalizeImg(p.images.sprite) : '';
            const row: LearnerRow = {
              id: p.id,
              slug: p.slug,
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
          rowsTM.sort((a, b) => a.id - b.id);
          rowsEgg.sort((a, b) => a.id - b.id);

          this.learnersLevel.set(rowsLevel);
          this.learnersTM.set(rowsTM);
          this.learnersEgg.set(rowsEgg);
        });
      });
    });
  }

  pokemonLink(slug: string) {
    return ['/pokedex/pokemons', slug];
  }

  hasAnyLearners(): boolean {
    return (
      this.learnersLevel().length +
      this.learnersTM().length +
      this.learnersEgg().length
    ) > 0;
  }

  critLabel(rate: Move['critRate'] | null): string {
    if (!rate || rate === 'normal') return 'Normal';
    if (rate === 'high') return 'Élevé';
    if (rate === 'very-high') return 'Très élevé';
    return '—';
  }
}
