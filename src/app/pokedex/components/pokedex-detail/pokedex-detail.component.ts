import { Component, OnInit, inject, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { PokedexService } from '../../services/pokedex.service';
import { TypeSlugPipe } from '../../pipes/type-slug.pipe';
import { WikilinkPipe } from '../../pipes/wikilink.pipe';

import { Pokemon } from '../../models/pokemon.model';
import { EvolutionService } from '../../services/evolution.service';
import { EvolutionFamily, EvolutionLink } from '../../models/evolution.model';

import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

interface EvoRowEntry {
  id: number;
  mon: Pokemon;
  parentId: number | null;
  link: EvolutionLink | null;
}

@Component({
  selector: 'app-pokedex-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeSlugPipe, WikilinkPipe],
  templateUrl: "./pokedex-detail.component.html",
  styleUrls: ["./pokedex-detail.component.scss"]
})

export class PokedexDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pokedex = inject(PokedexService);
  private evo = inject(EvolutionService);

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

  family = computed<EvolutionFamily | null>(() => {
    const p = this.pokemon();
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


  isCurrent = (id: number) => this.pokemon()?.id === id;

  wikiifyName(id: number): string {
    const mon = this.pokedex.getById(id);
    if (!mon) return `#${id}`;
    if (this.isCurrent(id)) return mon.name;
    return `[[pokemon:${id}|${mon.name}]]`;
  }

  pokemonLink(mon: Pokemon): any[] {
    return ['/pokedex', 'pokemons', mon.id];
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
    const p = this.pokemon();
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
}