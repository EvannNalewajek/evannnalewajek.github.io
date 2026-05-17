import { Component, OnInit, inject, effect, computed, Signal, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PokedexService } from '../../services/pokedex.service';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';

import { Pokemon } from '../../models/pokemon.model';
import { EvolutionService } from '../../services/evolution.service';
import { EvolutionFamily, EvolutionLink } from '../../models/evolution.model';
import { MovesService } from '../../services/moves.service';
import { LearnsetsService, ResolvedLearnset } from '../../services/learnsets.service';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

interface EvoRowEntry {
  id: number;
  mon: Pokemon;
  parentId: number | null;
  link: EvolutionLink | null;
}

@Component({
  selector: 'app-pokedex-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe, WikilinkPipe, ImageFallbackDirective],
  templateUrl: "./pokedex-detail.component.html",
  styleUrls: ["./pokedex-detail.component.scss"]
})

export class PokedexDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private pokedex = inject(PokedexService);
  private evo = inject(EvolutionService);
  private learnsets = inject(LearnsetsService);

  private slug = toSignal(
    this.route.paramMap.pipe(map(pm => pm.get('slug') || '')),
    { initialValue: '' }
  );
  
  readonly resolvedLearnset = signal<ResolvedLearnset | null>(null);

  basePokemon = computed<Pokemon | null>(() => {
    const s = this.slug();
    return this.pokedex.getBySlug(s);
  });

  readonly forms = computed<Pokemon[]>(() => {
    const p = this.basePokemon();
    return p ? this.pokedex.getFormsById(p.id) : [];
  });

  readonly formIndex = signal(0);

  // This ensures that when basePokemon changes (via navigation), we reset to first form
  private formResetEffect = effect(() => {
    this.basePokemon(); 
    this.formIndex.set(0);
  }, { allowSignalWrites: true });

  readonly pokemon = computed<Pokemon | null>(() => {
    const list = this.forms();
    const idx = this.formIndex();
    return list.length > 0 ? list[idx] : this.basePokemon();
  });

  constructor() {
    effect(() => {
      const p = this.pokemon?.();
      if (!p) {
        this.resolvedLearnset.set(null);
        return;
      }
      this.learnsets
        .getResolvedLearnsetForPokemon$(p.id)
        .subscribe(ls => this.resolvedLearnset.set(ls));
    });
  }

  setFormIndex(i: number) {
    const list = this.forms();
    if (!list.length) return;

    const clamped = Math.min(Math.max(i, 0), list.length - 1);
    this.formIndex.set(clamped);

    const p = list[clamped];
    document.title = `#${p.id.toString().padStart(2,'0')} — ${p.name} | Pokédex`;
  }

  private currentIndex = computed(() => {
    const p = this.basePokemon();
    if (!p) return -1;
    return this.pokedex.uniqueList().findIndex(x => x.id === p.id);
  });

  prevMon = computed<Pokemon | null>(() => {
    const i = this.currentIndex();
    if (i <= 0) return null;
    return this.pokedex.uniqueList()[i - 1];
  });

  nextMon = computed<Pokemon | null>(() => {
    const i = this.currentIndex();
    const list = this.pokedex.uniqueList();
    if (i === -1 || i >= list.length - 1) return null;
    return list[i + 1];
  });

  imgSprite = computed(() => {
    const p = this.pokemon();
    return p ? this.pokedex.normalizeImg(p.images.sprite) : '';
  });

  imgArtwork = computed(() => {
    const p = this.pokemon();
    return p ? this.pokedex.normalizeImg(p.images.artwork) : '';
  });

  maxId = () => this.pokedex.maxId();
  // Les IDs ne sont plus utilisés pour la navigation directe
  prevId = () => -1; 
  nextId = () => -1;

  isGenderless = computed(() => {
    const g = this.pokemon()?.genderRatio;
    return g === 'genderless';
  });

  malePercent = computed(() => {
    const g = this.pokemon()?.genderRatio;
    if (!g || typeof g === 'string') return null;
    return g.male;
  });

  femalePercent = computed(() => {
    const g = this.pokemon()?.genderRatio;
    if (!g || typeof g === 'string') return null;
    return g.female;
  });

  family = computed<EvolutionFamily | null>(() => {
    const p = this.basePokemon();
    if (!p) return null;
    return this.evo.familyFor(p.id);
  });

  ordered = computed<{
    order: number[];
    links: EvolutionLink[];
  } | null>(() => {
    const fam = this.family();
    if (!fam) return null;
    return this.evo.orderedChain(fam);
  });

  etymologyEntries = computed(() => {
    const p = this.pokemon();
    if (!p?.etymology) return [];
    return Object.entries(p.etymology);
  });


  evoStages = computed<Pokemon[]>(() => {
    const ord = this.ordered();
    if (!ord) return [];
    return ord.order
      .map(id => this.pokedex.getById(id))
      .filter(Boolean) as Pokemon[];
  });

  evoLinks = computed<EvolutionLink[]>(() => this.ordered()?.links ?? []);

  evoRows = computed<EvoRowEntry[][]>(() => {
    const fam = this.family();
    if (!fam) return [];

    const byId = (id: number) => this.pokedex.getById(id) ?? null;
    const outsFrom = (from: number) => fam.links.filter(l => l.from === from);
    const incomingCount = new Map<number, number>();
    fam.species.forEach(id => incomingCount.set(id, 0));
    fam.links.forEach(l => incomingCount.set(l.to, (incomingCount.get(l.to) ?? 0) + 1));

    const root = fam.species.find(id => (incomingCount.get(id) ?? 0) === 0) ?? fam.species[0];

    const rootMon = byId(root);
    if (!rootMon) return [];

    const rows: EvoRowEntry[][] = [[{ id: root, mon: rootMon, parentId: null, link: null }]];
    const seen = new Set<number>([root]);

    let current = rows[0];
    while (current.length) {
      const nextRow: EvoRowEntry[] = [];
      for (const entry of current) {
        for (const l of outsFrom(entry.id)) {
          const child = byId(l.to);
          if (!child) continue;

          if (!nextRow.some(e => e.id === l.to)) {
            nextRow.push({ id: l.to, mon: child, parentId: entry.id, link: l });
          }
        }
      }
      if (nextRow.length === 0) break;
      rows.push(nextRow);
      current = nextRow;
      nextRow.forEach(e => seen.add(e.id));
    }

    return rows;
  });


  isCurrent = (id: number) => this.basePokemon()?.id === id;

  wikiifyName(id: number): string {
    const mon = this.pokedex.getById(id);
    if (!mon) return `#${id}`;
    if (this.isCurrent(id)) return mon.name;
    return `[[pokemon:${mon.slug}|${mon.name}]]`;
  }

  pokemonLink(mon: Pokemon): any[] {
    return ['/pokedex', 'pokemons', mon.slug];
  }

  evoLabel(link: EvolutionLink | null | undefined): string {
    if (!link) return '';
    const t = link.trigger as any;
    switch (t.kind) {
      case 'level':
        return `Niveau ${t.level}${t.condition ? ` (${t.condition})` : ''}`;
      case 'item':
        return `Objet : ${t.item}${t.condition ? ` (${t.condition})` : ''}`;
      case 'friendship':
        return `Bonheur${t.threshold ? ` (≥ ${t.threshold})` : ''}${t.condition ? ` (${t.condition})` : ''}`;
      case 'trade':
        return `Échange${t.withItem ? ` (tenir ${t.withItem})` : ''}${t.condition ? ` (${t.condition})` : ''}`;
      case 'other':
        return String(t.text ?? '');
      default:
        return '';
    }
  }

  evoSummaryHtml = computed<string | null>(() => {
    const p = this.basePokemon();
    const fam = this.family();
    if (!p || !fam) return null;

    const prevLinks = fam.links.filter(l => l.to === p.id);
    const nextLinks = fam.links.filter(l => l.from === p.id);

    const name = (id: number) => this.wikiifyName(id);
    const phr  = (l: EvolutionLink) => this.triggerInSentence(l);

    const listOu = (items: string[]) =>
      items.length <= 2 ? items.join(' ou ') : items.slice(0, -1).join(', ') + ' ou ' + items.slice(-1);

    if (prevLinks.length === 0 && nextLinks.length === 0) {
      return `<strong>${p.name}</strong> n'a pas d'évolution.`;
    }

    if (prevLinks.length === 0 && nextLinks.length >= 1) {
      if (nextLinks.length === 1) {
        const l = nextLinks[0];
        return `<strong>${p.name}</strong> évolue en ${name(l.to)} ${phr(l)}.`;
      }
      const choices = nextLinks.map(l => `en ${name(l.to)} ${phr(l)}`);
      return `<strong>${p.name}</strong> peut évoluer ${listOu(choices)}.`;
    }

    if (prevLinks.length >= 1 && nextLinks.length === 0) {
      if (prevLinks.length === 1) {
        const l = prevLinks[0];
        return `<strong>${p.name}</strong> est l'évolution de ${name(l.from)} ${phr(l)}.`;
      }
      const origins = prevLinks.map(l => `de ${name(l.from)} ${phr(l)}`);
      return `<strong>${p.name}</strong> est l'évolution ${listOu(origins)}.`;
    }

    const prevPart =
      prevLinks.length === 1
        ? `est l'évolution de ${name(prevLinks[0].from)} ${phr(prevLinks[0])}`
        : `est l'évolution ${listOu(prevLinks.map(l => `de ${name(l.from)} ${phr(l)}`))}`;

    if (nextLinks.length === 1) {
      const l = nextLinks[0];
      return `<strong>${p.name}</strong> ${prevPart}, et évolue en ${name(l.to)} ${phr(l)}.`;
    }

    const choices = nextLinks.map(l => `en ${name(l.to)} ${phr(l)}`);
    return `<strong>${p.name}</strong> ${prevPart}, et peut évoluer ${listOu(choices)}.`;
  });



  async ngOnInit() {
    await Promise.all([
      this.pokedex.ensureLoaded(),
      this.evo.ensureLoaded()
    ]);

    if (!this.basePokemon()) {
      this.router.navigate(['/pokedex']);
      return;
    }

    document.title = `#${this.basePokemon()!.id.toString().padStart(2,'0')} — ${this.basePokemon()!.name} | Pokédex`;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  totalBaseStats = computed(() => {
    const p = this.pokemon();
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
  });

  private triggerInSentence(l: EvolutionLink): string {
    const t: any = l.trigger;
    switch (t.kind) {
      case 'level':
        return `au niveau ${t.level}${t.condition ? `, ${t.condition}` : ''}`;
      case 'item':
        return `avec ${t.item}${t.condition ? `, ${t.condition}` : ''}`;
      case 'friendship':
        return `par bonheur${t.threshold ? ` (≥ ${t.threshold})` : ''}${t.condition ? `, ${t.condition}` : ''}`;
      case 'trade':
        return `par échange${t.withItem ? ` en tenant ${t.withItem}` : ''}${t.condition ? `, ${t.condition}` : ''}`;
      case 'other':
        return String(t.text ?? '');
      default:
        return '';
    }
  }

  moveLink(slug: string) {
    return ['/pokedex/moves', slug];
  }
  hasAnyLearnset() {
    const L = this.resolvedLearnset();
    return !!L && (L.levelUp.length + L.tm.length + L.egg.length) > 0;
  }
}
