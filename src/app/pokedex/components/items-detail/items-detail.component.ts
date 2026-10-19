import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';
import { RouterizedContentDirective } from '../../routerized-content.directive';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';
import { BackButtonDirective } from '../../directives/back-button.directive';

@Component({
    selector: 'app-item-detail',
    standalone: true,
    imports: [DecimalPipe, RouterLink, WikilinkPipe, RouterizedContentDirective, ImageFallbackDirective, BackButtonDirective],
    templateUrl: './items-detail.component.html',
    styleUrls: ['./items-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsDetailComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly svc = inject(ItemService);
    private readonly title = inject(Title);

    private readonly _list = toSignal<Item[] | null>(this.svc.getAll(), { initialValue: null });
    readonly loading = computed(() => this._list() === null);
    readonly list = computed(() => this._list() ?? []);

    readonly slug = toSignal(
        this.route.paramMap.pipe(map(pm => pm.get('slug') ?? '')),
        { initialValue: '' }
    );

    readonly item = computed<Item | null>(() => {
        const s = this.slug();
        return this.list().find(a => a.slug === s) ?? null;
    });

    readonly index = computed(() => {
        const s = this.slug();
        return this.list().findIndex(a => a.slug === s);
    });

    readonly prev = computed<Item | undefined>(() => {
        const i = this.index();
        const arr = this.list();
        return i > 0 ? arr[i - 1] : undefined;
    });

    readonly next = computed<Item | undefined>(() => {
        const i = this.index();
        const arr = this.list();
        return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : undefined;
    });

    readonly imgSprite = computed(() => {
        const cur = this.item();
        return cur ? this.svc.normalizeImg(cur.images.sprite) : '';
    });

    readonly imgArtwork = computed(() => {
        const cur = this.item();
        return cur ? this.svc.normalizeImg(cur.images.artwork) : '';
    });

    constructor() {
        effect(() => {
            const cur = this.item();
            if (cur) {
                this.title.setTitle(`Pokédex — ${cur.name}`);
            }
        });
    }
}
