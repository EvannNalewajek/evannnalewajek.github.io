import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { slugify } from '../utils/slugify';

type Kind = 'move' | 'ability' | 'type' | 'pokemon' | 'item' | 'docs';

interface Ctx {
  kind?: Kind;
  slug?: string;
  id?: string;
}

@Pipe({
  name: 'wikilink',
  standalone: true,
  pure: true,
})
export class WikilinkPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(input: string | number | null | undefined, ctx?: Ctx): SafeHtml {
    if (input === null || input === undefined) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const text = String(input);

    const html = text.replace(
      /\[\[\s*([a-z]+)\s*:\s*([^\]|]+?)(?:\|([^\]]+))?\s*\]\]/gi,
      (_m, rawKind: string, rawKey: string, rawLabel?: string) => {
        const kind = normalizeKind(rawKind);
        if (!kind) return escapeHtml(_m);

        const key = rawKey.trim();
        const normalizedSlug = slugify(key);
        const label = (rawLabel ?? rawKey).trim();

        if (
          ctx?.kind === kind &&
          (ctx.slug === key || ctx.slug === normalizedSlug || ctx.id === key)
        ) {
          return escapeHtml(label);
        }

        const href = routeFor(kind, normalizedSlug);
        return `<a class="autolink" data-kind="${kind}" href="${href}">${escapeHtml(label)}</a>`;
      }
    );

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

function normalizeKind(k: string): Kind | null {
  const s = k.toLowerCase();
  if (s === 'does') return 'docs';
  if (
    s === 'move' ||
    s === 'ability' ||
    s === 'type' ||
    s === 'pokemon' ||
    s === 'item' ||
    s === 'docs'
  ) {
    return s;
  }
  return null;
}

function routeFor(kind: Kind, slug: string): string {
  switch (kind) {
    case 'move':
      return `/pokedex/moves/${slug}`;
    case 'ability':
      return `/pokedex/abilities/${slug}`;
    case 'type':
      return `/pokedex/types/${slug}`;
    case 'pokemon':
      return `/pokedex/pokemons/${slug}`;
    case 'item':
      return `/pokedex/docs/items/${slug}`;
    case 'docs':
      return `/pokedex/docs/${slug}`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}