import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AbilitiesService } from '../../ability.service';
import { Ability } from '../../ability.model';

@Component({
  selector: 'app-ability-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './abilities-detail.component.html',
  styleUrls: ['./abilities-detail.component.scss'],
})
export class AbilitiesDetailComponent {
  private route = inject(ActivatedRoute);
  private svc   = inject(AbilitiesService);

  loading = signal(true);
  list    = signal<Ability[]>([]);
  slug    = signal<string>('');

  ability = computed<Ability | null>(() => {
    const s = this.slug();
    return this.list().find(a => a.slug === s) ?? null;
  });

  index = computed(() => {
    const s = this.slug();
    return this.list().findIndex(a => a.slug === s);
  });

  prev = computed<Ability | undefined>(() => {
    const i = this.index(); const arr = this.list();
    return i > 0 ? arr[i - 1] : undefined;
  });

  next = computed<Ability | undefined>(() => {
    const i = this.index(); const arr = this.list();
    return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : undefined;
  });

  constructor() {
    this.route.paramMap.subscribe(pm => {
      this.slug.set(pm.get('slug') ?? '');
      this.svc.getAll().subscribe(list => {
        this.list.set(list);
        this.loading.set(false);
      });
    });
  }
}