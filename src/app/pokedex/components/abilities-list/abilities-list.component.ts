import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AbilitiesService } from '../../services/ability.service';
import { Ability } from '../../models/ability.model';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';

type SortKey = 'id' | 'name';

@Component({
    selector: 'app-abilities-list',
    standalone: true,
    imports: [CommonModule, RouterLink, WikilinkPipe],
    templateUrl: './abilities-list.component.html',
    styleUrls: ['./abilities-list.component.scss']
})
export class AbilitiesListComponent {
    private svc = inject(AbilitiesService);

    loading = signal<boolean>(true);
    raw     = signal<Ability[]>([]);
    q       = signal<string>('');
    sortKey = signal<SortKey>('id');

    list = computed(() => {
        const query = this.q().trim().toLowerCase();
        const key   = this.sortKey();
        let arr = this.raw();
        if (query) {
            arr = arr.filter(a =>
                a.name.toLowerCase().includes(query) ||
                (a.battleEffectShort ?? '').toLowerCase().includes(query)
            );
        }
        return [...arr].sort((a, b) => {
            if (key === 'id')   return a.id - b.id;
            if (key === 'name') return a.name.localeCompare(b.name);
            return 0;
        });
    });

    constructor() {
        this.svc.getAll().subscribe(list => {
            this.raw.set(list);
            this.loading.set(false);
        });

        effect(() => {
            document.title = 'Pokédex - Talents';
        });
    }

    query(v: string) { this.q.set(v ?? ''); }
    selectSort(v: string) { this.sortKey.set((v as SortKey) || 'id'); }
}