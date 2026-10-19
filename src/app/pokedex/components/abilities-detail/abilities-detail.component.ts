import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AbilitiesService } from '../../services/ability.service';
import { Ability } from '../../models/ability.model';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';
import { RouterizedContentDirective } from '../../routerized-content.directive';

@Component({
  selector: 'app-ability-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink, WikilinkPipe, RouterizedContentDirective],
  templateUrl: './abilities-detail.component.html',
  styleUrls: ['./abilities-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilitiesDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(AbilitiesService);
  private readonly title = inject(Title);

  private readonly _list = toSignal<Ability[] | null>(this.svc.getAll(), { initialValue: null });
  readonly loading = computed(() => this._list() === null);
  readonly list = computed(() => this._list() ?? []);

  readonly slug = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('slug') ?? '')),
    { initialValue: '' }
  );

  readonly ability = computed<Ability | null>(() => {
    const s = this.slug();
    return this.list().find(a => a.slug === s) ?? null;
  });

  readonly index = computed(() => {
    const s = this.slug();
    return this.list().findIndex(a => a.slug === s);
  });

  readonly prev = computed<Ability | undefined>(() => {
    const i = this.index();
    const arr = this.list();
    return i > 0 ? arr[i - 1] : undefined;
  });

  readonly next = computed<Ability | undefined>(() => {
    const i = this.index();
    const arr = this.list();
    return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : undefined;
  });

  constructor() {
    effect(() => {
      const a = this.ability();
      if (a) {
        this.title.setTitle(`Pokédex — ${a.name}`);
      }
    });
  }
}