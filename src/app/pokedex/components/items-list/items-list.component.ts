import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';

type SortKey = 'id' | 'name';

@Component({
    selector: 'app-items-list',
    standalone: true,
    imports: [CommonModule, RouterLink, WikilinkPipe],
    templateUrl: './items-list.component.html',
    styleUrls: ['./items-list.component.scss']
})
export class ItemsListComponent {
    private svc = inject(ItemService);

    loading = signal<boolean>(true);
    raw     = signal<Item[]>([]);
    q       = signal<string>('');
    sortKey = signal<SortKey>('id');

    list = computed(() => {
        const query = this.q().trim().toLowerCase();
        const key   = this.sortKey();
        let arr = this.raw();
        if (query) {
            arr = arr.filter(a =>
                a.name.toLowerCase().includes(query) ||
                (a.description ?? '').toLowerCase().includes(query)
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
            document.title = 'Pokédex - Items';
        });
    }

    query(v: string) { this.q.set(v ?? ''); }
    selectSort(v: string) { this.sortKey.set((v as SortKey) || 'id'); }
}