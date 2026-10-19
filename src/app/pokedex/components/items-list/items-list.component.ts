import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';
import { RouterizedContentDirective } from '../../routerized-content.directive';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

type SortKey = 'id' | 'name';

@Component({
    selector: 'app-items-list',
    standalone: true,
    imports: [DecimalPipe, RouterLink, WikilinkPipe, RouterizedContentDirective, ImageFallbackDirective],
    templateUrl: './items-list.component.html',
    styleUrls: ['./items-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsListComponent {
    private readonly svc = inject(ItemService);
    private readonly title = inject(Title);

    private readonly _raw = toSignal<Item[] | null>(this.svc.getAll(), { initialValue: null });
    readonly loading = computed(() => this._raw() === null);
    readonly raw = computed(() => this._raw() ?? []);

    readonly q = this.svc.searchQuery;
    readonly sortKey = this.svc.sortKey;

    readonly list = computed(() => {
        const query = this.q().trim().toLowerCase();
        const key = this.sortKey();
        let arr = this.raw();
        if (query) {
            arr = arr.filter(a =>
                a.name.toLowerCase().includes(query) ||
                (a.description ?? '').toLowerCase().includes(query)
            );
        }
        return [...arr].sort((a, b) => {
            if (key === 'id') return a.id - b.id;
            if (key === 'name') return a.name.localeCompare(b.name, 'fr');
            return 0;
        });
    });

    constructor() {
        this.title.setTitle('Pokédex — Objets');
    }

    query(v: string) { this.q.set(v ?? ''); }
    selectSort(v: string) { this.sortKey.set((v as SortKey) || 'id'); }
}
