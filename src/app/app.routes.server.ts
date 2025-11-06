import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'pokedex', renderMode: RenderMode.Prerender },
  { path: 'pokedex/pokemons', renderMode: RenderMode.Prerender },
  { path: 'pokedex/pokemons/:id', renderMode: RenderMode.Client },
  { path: 'pokedex/fields', renderMode: RenderMode.Client },
  { path: 'pokedex/moves', renderMode: RenderMode.Client },
  { path: 'pokedex/moves/:slug', renderMode: RenderMode.Client },
  { path: 'pokedex/types/:slug', renderMode: RenderMode.Client },
  { path: 'pokedex/abilities', renderMode: RenderMode.Client },
  { path: 'pokedex/abilities/:slug', renderMode: RenderMode.Client },
  { path: 'pokedex/docs', renderMode: RenderMode.Client },
  { path: 'pokedex/docs/introduction', renderMode: RenderMode.Client },

  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
