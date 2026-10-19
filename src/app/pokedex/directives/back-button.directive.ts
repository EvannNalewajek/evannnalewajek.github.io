import { computed, Directive, HostBinding, HostListener, inject, Injectable, input, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Nettoie une URL en retirant query params, ancres et slash final.
 */
export function normalizePokedexUrl(rawUrl: string): string {
  const clean = (rawUrl || '').split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean || '/';
}

/**
 * Regroupe les URLs de détail par catégorie afin que la navigation
 * d'un élément à un autre de la même catégorie (ex: Pokémon #1 -> Pokémon #2 -> Pokémon #3)
 * remplace l'étape courante au lieu d'empiler chaque fiche consultée.
 */
export function getPokedexRouteGroup(rawUrl: string): string {
  const url = normalizePokedexUrl(rawUrl);

  if (/^\/pokedex\/pokemons\/[^/]+$/.test(url)) return 'detail:pokemons';
  if (/^\/pokedex\/moves\/[^/]+$/.test(url)) return 'detail:moves';
  if (/^\/pokedex\/abilities\/[^/]+$/.test(url)) return 'detail:abilities';
  if (/^\/pokedex\/docs\/items\/[^/]+$/.test(url)) return 'detail:items';
  if (/^\/pokedex\/types\/[^/]+$/.test(url)) return 'detail:types';

  return `page:${url}`;
}

export function isSameDetailGroup(urlA: string, urlB: string): boolean {
  const groupA = getPokedexRouteGroup(urlA);
  const groupB = getPokedexRouteGroup(urlB);
  return groupA.startsWith('detail:') && groupA === groupB;
}

@Injectable({ providedIn: 'root' })
export class PokedexNavigationService {
  private readonly router = inject(Router);

  /** Pile d'historique intelligente (sans doublons consécutifs d'une même catégorie de détail) */
  private readonly stack = signal<string[]>([]);

  /** URL vers laquelle le bouton "Retour" renverra s'il existe un historique interne */
  readonly previousUrl = computed<string | null>(() => {
    const s = this.stack();
    return s.length > 1 ? s[s.length - 2] : null;
  });

  constructor() {
    const initial = normalizePokedexUrl(this.router.url);
    if (initial && initial !== '/') {
      this.stack.set([initial]);
    }

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => {
        this.recordNavigation(event.urlAfterRedirects || event.url);
      });
  }

  private recordNavigation(rawUrl: string): void {
    const url = normalizePokedexUrl(rawUrl);
    if (!url) return;

    this.stack.update(current => {
      if (current.length === 0) {
        return [url];
      }

      // Retour à l'accueil du Pokédex : on réinitialise la pile à la racine du Pokédex
      if (url === '/pokedex') {
        return ['/pokedex'];
      }

      const top = current[current.length - 1];
      if (top === url) {
        return current;
      }

      // Si on navigue d'une fiche détail à une autre fiche détail de la même branche
      // (ex: Pokémon -> Pokémon, Capacité -> Capacité, Talent -> Talent, Objet -> Objet, Type -> Type),
      // on remplace le sommet de la pile pour que "Retour" ramène directement à l'écran d'origine.
      if (isSameDetailGroup(top, url)) {
        const next = [...current];
        next[next.length - 1] = url;
        return next;
      }

      // Si l'URL cible est déjà présente dans la pile (ex: retour à une liste parente ou au Pokémon précédent),
      // on tronque la pile jusqu'à cette entrée pour éviter les boucles A -> B -> A.
      const existingIdx = current.lastIndexOf(url);
      if (existingIdx !== -1) {
        return current.slice(0, existingIdx + 1);
      }

      return [...current, url];
    });
  }

  /**
   * Dépile l'écran courant et retourne l'URL précédente (ou `fallbackUrl` si la pile est vide).
   */
  popBackTarget(fallbackUrl: string): string {
    const current = this.stack();
    if (current.length > 1) {
      const target = current[current.length - 2];
      this.stack.set(current.slice(0, -1));
      return target;
    }

    const fallback = normalizePokedexUrl(fallbackUrl || '/pokedex');
    this.stack.set([fallback]);
    return fallback;
  }
}

@Directive({
  selector: 'a[appBack]',
  standalone: true,
})
export class BackButtonDirective {
  private readonly router = inject(Router);
  private readonly nav = inject(PokedexNavigationService);

  /** Route de repli si l'utilisateur a ouvert la page directement sans historique interne */
  readonly appBack = input<string>('/pokedex');

  @HostBinding('attr.href')
  get href(): string {
    return this.nav.previousUrl() ?? (this.appBack() || '/pokedex');
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = this.nav.popBackTarget(this.appBack() || '/pokedex');
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
