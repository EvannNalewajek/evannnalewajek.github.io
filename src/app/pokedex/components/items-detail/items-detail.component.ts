import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';

@Component({
    selector: 'app-item-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, WikilinkPipe],
    templateUrl: './items-detail.component.html',
    styleUrls: ['./items-detail.component.scss'],
})
export class ItemsDetailComponent {
    private route = inject(ActivatedRoute);
    private svc   = inject(ItemService);

    loading = signal(true);
    list    = signal<Item[]>([]);
    slug    = signal<string>('');

    item = computed<Item | null>(() => {
        const s = this.slug();
        return this.list().find(a => a.slug === s) ?? null;
    });

    index = computed(() => {
        const s = this.slug();
        return this.list().findIndex(a => a.slug === s);
    });

    prev = computed<Item | undefined>(() => {
        const i = this.index(); const arr = this.list();
        return i > 0 ? arr[i - 1] : undefined;
    });

    next = computed<Item | undefined>(() => {
        const i = this.index(); const arr = this.list();
        return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : undefined;
    });

    imgSprite = () => this.svc.normalizeImg(this.item()!.images.sprite);
    imgArtwork = () => this.svc.normalizeImg(this.item()!.images.artwork);

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