import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PokedexService } from '../../pokedex.service';
import { Pokemon } from '../../pokemon.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-pokedex-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./pokedex-detail.component.html",
  styleUrls: ["./pokedex-detail.component.scss"]
})
export class PokedexDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pokedex = inject(PokedexService);

  // id réactif depuis l'URL (réagit aux navigations prev/next)
  private id = toSignal(
    this.route.paramMap.pipe(map(pm => Number(pm.get('id')))),
    { initialValue: NaN }
  );

  // Pokémon courant
  pokemon = computed<Pokemon | null>(() => this.pokedex.getById(this.id()));

  // images
  imgSprite = () => this.pokedex.normalizeImg(this.pokemon()!.images.sprite);
  imgArtwork = () => this.pokedex.normalizeImg(this.pokemon()!.images.artwork);

  // navigation
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
}
