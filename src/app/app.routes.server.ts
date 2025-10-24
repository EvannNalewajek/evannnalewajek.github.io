import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'pokedex', renderMode: RenderMode.Prerender },
  { path: 'pokedex/:id', renderMode: RenderMode.Client },
  { path: 'types/:slug', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
