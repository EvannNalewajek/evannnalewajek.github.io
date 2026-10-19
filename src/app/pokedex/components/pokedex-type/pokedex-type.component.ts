import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, Signal } from '@angular/core';
import { NgStyle } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TypesService } from '../../services/type.service';
import { PokedexService } from '../../services/pokedex.service';
import { Pokemon, PokemonType } from '../../models/pokemon.model';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';

@Component({
    selector: 'app-type-page',
    standalone: true,
    imports: [NgStyle, RouterLink, ImageFallbackDirective, TypeSlugPipe],
    templateUrl: './pokedex-type.component.html',
    styleUrls: ['./pokedex-type.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TypePageComponent implements OnInit {
    private readonly types = inject(TypesService);
    private readonly pokedex = inject(PokedexService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly title = inject(Title);

    readonly slug = toSignal(this.route.paramMap.pipe(map(pm => pm.get('slug') ?? '')), { initialValue: '' });

    readonly allTypes = computed(() => this.types.types());
    readonly current = computed(() => this.types.getBySlug(this.slug() ?? ''));

    readonly defense = computed(() => this.current() ? this.types.defenseBuckets(this.current()!.name) : null);
    readonly attack  = computed(() => this.current() ? this.types.attackBuckets(this.current()!.name)  : null);

    readonly defensiveStrengths = computed<PokemonType[]>(() => {
        const d = this.defense();
        if (!d) return [];
        return [...d.zero, ...d.half];
    });

    readonly pokemonsOfType: Signal<Pokemon[] | null> = computed(() => {
        if (!this.pokedex.loaded()) return null;
        const c = this.current();
        if (!c) return null;
        return this.pokedex.uniqueList().filter(p => p.types.includes(c.name as PokemonType));
    });

    constructor() {
        effect(() => {
            const c = this.current();
            if (c) {
                this.title.setTitle(`${c.name} — Types | Pokédex`);
            } else if (this.types.loaded() && this.slug()) {
                this.router.navigate(['/pokedex']);
            }
        });
    }

    async ngOnInit() {
        await Promise.all([this.types.ensureLoaded(), this.pokedex.ensureLoaded()]);
    }

    styleFor(t: PokemonType | undefined): Record<string, string> {
        const tt = this.allTypes()?.find(x => x.name === t);
        return tt ? { '--type-color': tt.color } : {};
    }

    typesOf(p: Pokemon): PokemonType[] {
        const tuple = p.types as unknown as readonly PokemonType[];
        return [...tuple];
    }
}
