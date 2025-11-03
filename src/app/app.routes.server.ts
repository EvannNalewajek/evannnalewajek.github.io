import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'pokedex', renderMode: RenderMode.Prerender },
  { path: 'pokedex/fields', renderMode: RenderMode.Client },
  { path: 'pokedex/moves', renderMode: RenderMode.Client },
  { path: 'pokedex/:id', renderMode: RenderMode.Client },
  { path: 'pokedex/types/:slug', renderMode: RenderMode.Client },

  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
