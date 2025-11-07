// pokedex/components/type-page/type-page.component.ts
import { Component, OnInit, computed, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TypesService } from '../../services/type.service';
import { PokedexService } from '../../services/pokedex.service';
import { Pokemon, PokemonType } from '../../models/pokemon.model';

@Component({
    selector: 'app-type-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './pokedex-type.component.html',
    styleUrls: ['./pokedex-type.component.scss']
})
export class TypePageComponent implements OnInit {
    private types = inject(TypesService);
    private pokedex = inject(PokedexService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    slug = toSignal(this.route.paramMap.pipe(map(pm => pm.get('slug') ?? '')), { initialValue: '' });

    allTypes = computed(() => this.types.types());
    current = computed(() => this.types.getBySlug(this.slug() ?? ''));

    defense = computed(() => this.current() ? this.types.defenseBuckets(this.current()!.name) : null);
    attack  = computed(() => this.current() ? this.types.attackBuckets(this.current()!.name)  : null);

    pokemonsOfType: Signal<Pokemon[] | null> = computed(() => {
        const all = this.pokedex.all();
        const c = this.current();
        if (!all || !c) return null;
        return all.filter(p => p.types.includes(c.name as PokemonType));
    });

    async ngOnInit() {
        await Promise.all([this.types.ensureLoaded(), this.pokedex.ensureLoaded()]);
        const c = this.current();
        if (!c) { this.router.navigate(['/pokedex']); return; }
        document.title = `${c.name} — Types | Pokédex`;
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    styleFor(t: PokemonType | undefined) {
        const tt = this.allTypes()?.find(x => x.name === t);
        return tt ? { '--type-color': tt.color } as any : {};
    }

    typesOf(p: Pokemon): PokemonType[] {
        const tuple = p.types as unknown as readonly PokemonType[];
        return [...tuple];
    }
}