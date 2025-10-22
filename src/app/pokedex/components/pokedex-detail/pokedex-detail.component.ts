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
  template: `
  <div class="dex-scene">
    <div class="dex-card">
      <div class="dex-header">
        <div class="dex-button" aria-hidden="true"></div>
        <div class="dex-lights" aria-hidden="true">
          <span class="led led-red"></span>
          <span class="led led-yellow"></span>
          <span class="led led-green"></span>
        </div>
        <h1>{{ pokemon()?.name || 'Pokémon' }}</h1>
      </div>

      <div class="dex-body detail">
        @if (pokemon()) {
          <div class="top">
            <img class="artwork"
              [src]="imgArtwork()"
              [alt]="pokemon()!.name"
              loading="eager" />

            <div class="summary">
              <h2>#{{ pokemon()!.id | number:'2.0-0' }} — {{ pokemon()!.name }}</h2>

              <div class="types">
                @for (t of pokemon()!.types; track t) {
                  <span class="type-chip" [attr.data-type]="t">{{ t }}</span>
                }
              </div>

              <div class="abilities">
                <div><strong>Talents :</strong> {{ pokemon()!.abilities.join(', ') }}</div>
                @if (pokemon()!.hiddenAbility) {
                  <div><strong>Talent caché :</strong> {{ pokemon()!.hiddenAbility }}</div>
                }
              </div>

              <div class="meta">
                <div><strong>Taille :</strong> {{ pokemon()!.height_m }} m</div>
                <div><strong>Poids :</strong> {{ pokemon()!.weight_kg }} kg</div>
                <div>
                  <strong>Genre :</strong>
                  @if (!isGenderless()) {
                    ♂ {{ malePercent() }}% · ♀ {{ femalePercent() }}%
                  } @else {
                    Asexué
                  }
                </div>
                <div><strong>Taux de capture :</strong> {{ pokemon()!.captureRate }}</div>
              </div>

              <div class="sprite-line">
                <img class="sprite"
                  [src]="imgSprite()"
                  [alt]="pokemon()!.name + ' sprite'"
                  loading="lazy" />
              </div>
            </div>
          </div>

          <div class="stats">
            <h3>Statistiques de base</h3>
            <ul>
              <li><span>PV</span><b>{{ pokemon()!.baseStats.hp }}</b></li>
              <li><span>Attaque</span><b>{{ pokemon()!.baseStats.atk }}</b></li>
              <li><span>Défense</span><b>{{ pokemon()!.baseStats.def }}</b></li>
              <li><span>Atq. Spé</span><b>{{ pokemon()!.baseStats.spa }}</b></li>
              <li><span>Déf. Spé</span><b>{{ pokemon()!.baseStats.spd }}</b></li>
              <li><span>Vitesse</span><b>{{ pokemon()!.baseStats.spe }}</b></li>
            </ul>
          </div>

          <div class="nav">
            @if (prevId() >= 1) {
              <a [routerLink]="['/pokedex', prevId()]">← #{{ prevId() | number:'2.0-0' }}</a>
            }
            <a [routerLink]="['/pokedex']">Retour à la liste</a>
            @if (nextId() <= maxId()) {
              <a [routerLink]="['/pokedex', nextId()]">#{{ nextId() | number:'2.0-0' }} →</a>
            }
          </div>
        } @else {
          <div class="notfound">
            <p>Pokémon introuvable.</p>
            <a [routerLink]="['/pokedex']">Retour au Pokédex</a>
          </div>
        }
      </div>
    </div>
  </div>
  `,
  styleUrl: "./pokedex-detail.component.scss"
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
