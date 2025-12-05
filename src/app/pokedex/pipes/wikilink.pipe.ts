import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type Kind = 'move' | 'ability' | 'type' | 'pokemon' | 'docs';

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
        const label = (rawLabel ?? rawKey).trim();

        if (ctx?.kind === kind && (ctx.slug === key || ctx.id === key)) {
          return escapeHtml(label);
        }

        const href = routeFor(kind, key);
        return `<a class="autolink" data-kind="${kind}" href="${href}">${escapeHtml(label)}</a>`;
      }
    );

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

function normalizeKind(k: string): Kind | null {
  const s = k.toLowerCase();
  if (s === 'move' || s === 'ability' || s === 'type' || s === 'pokemon' || s === 'docs') return s;
  return null;
}
function routeFor(kind: Kind, key: string): string {
  switch (kind) {
    case 'move':     return `/pokedex/moves/${key}`;
    case 'ability':  return `/pokedex/abilities/${key}`;
    case 'type':     return `/pokedex/types/${slugify(key)}`;
    case 'pokemon':  return `/pokedex/pokemons/${key}`;
    case 'docs':    return `/pokedex/docs/${key}`;
  }
}
function slugify(input: string): string {
  return input.toLowerCase().normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}
function escapeHtml(s: string) {
  return s
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}