import { Component, OnInit, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PokedexService } from '../../pokedex.service';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { Pokemon } from '../../pokemon.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-pokedex-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe],
  templateUrl: "./pokedex-detail.component.html",
  styleUrls: ["./pokedex-detail.component.scss"]
})
export class PokedexDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pokedex = inject(PokedexService);

  private id = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('id')))),
    { initialValue: NaN }
  );

  pokemon = computed<Pokemon | null>(() => this.pokedex.getById(this.id()));

  prevMon: Signal<Pokemon | null> = computed(() => {
    const id = this.prevId();
    return id >= 1 ? this.pokedex.getById(id) : null;
  });

  nextMon: Signal<Pokemon | null> = computed(() => {
    const id = this.nextId();
    return id <= this.maxId() ? this.pokedex.getById(id) : null;
  });

  imgSprite = () => this.pokedex.normalizeImg(this.pokemon()!.images.sprite);
  imgArtwork = () => this.pokedex.normalizeImg(this.pokemon()!.images.artwork);

  maxId = () => this.pokedex.maxId();
  prevId = () => Math.max(1, (this.id() || 1) - 1);
  nextId = () => (this.id() || 1) + 1;

  isGenderless(): boolean {
    const g = this.pokemon()?.genderRatio;
    return g === 'genderless';
  }

  malePercent(): number | null {
    const g = this.pokemon()?.genderRatio;
    if (!g || typeof g === 'string') return null;
    return g.male;
  }

  femalePercent(): number | null {
    const g = this.pokemon()?.genderRatio;
    if (!g || typeof g === 'string') return null;
    return g.female;
  }

  async ngOnInit() {
    await this.pokedex.ensureLoaded();

    if (!this.pokemon()) {
      this.router.navigate(['/pokedex']);
      return;
    }

    document.title = `#${this.pokemon()!.id.toString().padStart(2,'0')} — ${this.pokemon()!.name} | Pokédex`;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  totalBaseStats(): number {
    const p = this.pokemon?.();
    if (!p || !p.baseStats) return 0;

    const {
      hp = 0,
      atk = 0,
      def = 0,
      spa = 0,
      spd = 0,
      spe = 0,
    } = p.baseStats;

    return hp + atk + def + spa + spd + spe;
  }

}
