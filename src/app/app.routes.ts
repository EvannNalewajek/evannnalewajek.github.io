import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EnigmeComponent } from './pages/enigme/enigme';
import { EnigmeLayoutComponent } from './layout/enigme-layout';
import { Enigme1Component } from './pages/enigme/enigme1/enigme1';
import { Enigme2Component } from './pages/enigme/enigme2/enigme2';
import { Enigme3Component } from './pages/enigme/enigme3/enigme3';
import { GuildeGameComponent } from './idle-game/components/game-main/game-main.component';
import { DetectiveMainComponent } from './detective-game/components/detective-main.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, title: 'Accueil' },
    { path: 'detective', component: DetectiveMainComponent, title: 'Détective - Film Noir' },
    {
        path: 'pokedex',
        loadComponent: () => import('./pokedex/components/pokedex-main/pokedex-main.component').then(m => m.PokedexMainComponent),
        title: 'Pokédex'
    },
    {
        path: 'pokedex/pokemons',
        loadComponent: () => import('./pokedex/components/pokedex-list/pokedex-list.component').then(m => m.PokedexListComponent),
        title: 'Pokédex - Liste'
    },
    {
        path: 'pokedex/pokemons/:slug',
        loadComponent: () => import('./pokedex/components/pokedex-detail/pokedex-detail.component').then(m => m.PokedexDetailComponent),
        title: 'Pokédex - Détail'
    },
    {
        path: 'pokedex/moves',
        loadComponent: () => import('./pokedex/components/moves-list/moves-list.component').then(m => m.MovesListComponent),
        title: 'Pokédex - Capacités'
    },
    {
        path: 'pokedex/moves/:slug',
        loadComponent: () => import('./pokedex/components/moves-detail/moves-detail.component').then(m => m.MovesDetailComponent),
        title: 'Pokédex - Capacités Détail'
    },
    {
        path: 'pokedex/types/:slug',
        loadComponent: () => import('./pokedex/components/pokedex-type/pokedex-type.component').then(m => m.TypePageComponent),
        title: 'Pokédex - Type'
    },
    {
        path: 'pokedex/abilities',
        loadComponent: () => import('./pokedex/components/abilities-list/abilities-list.component').then(m => m.AbilitiesListComponent),
        title: 'Pokédex - Talents'
    },
    {
        path: 'pokedex/abilities/:slug',
        loadComponent: () => import('./pokedex/components/abilities-detail/abilities-detail.component').then(m => m.AbilitiesDetailComponent),
        title: 'Pokédex - Talents Détail'
    },
    {
        path: 'pokedex/docs',
        loadComponent: () => import('./pokedex/components/documentation/documentation.component').then(m => m.DocumentationComponent),
        title: 'Pokédex - Documentation'
    },
    {
        path: 'pokedex/docs/introduction',
        loadComponent: () => import('./pokedex/components/docs-introduction/docs-introduction.component').then(m => m.DocsIntroductionComponent),
        title: 'Pokédex - Introduction'
    },
    {
        path: 'pokedex/docs/statistics',
        loadComponent: () => import('./pokedex/components/docs-statistics/docs-statistics.component').then(m => m.DocsStatisticsComponent),
        title: 'Pokédex - Statistiques'
    },
    {
        path: 'pokedex/docs/fields',
        loadComponent: () => import('./pokedex/components/pokedex-field/pokedex-field.component').then(m => m.PokedexFieldComponent),
        title: 'Pokédex - Champ'
    },
    {
        path: 'pokedex/docs/weather',
        loadComponent: () => import('./pokedex/components/docs-weather/docs-weather.component').then(m => m.DocsWeatherComponent),
        title: 'Pokédex - Météo'
    },
    {
        path: 'pokedex/docs/status',
        loadComponent: () => import('./pokedex/components/docs-status/docs-status.component').then(m => m.DocsStatusComponent),
        title: 'Pokédex - Statut'
    },
    {
        path: 'pokedex/docs/items',
        loadComponent: () => import('./pokedex/components/items-list/items-list.component').then(m => m.ItemsListComponent),
        title: 'Pokédex - Objets'
    },
    {
        path: 'pokedex/docs/items/:slug',
        loadComponent: () => import('./pokedex/components/items-detail/items-detail.component').then(m => m.ItemsDetailComponent),
        title: 'Pokédex - Objets Détail'
    },
    {
        path: 'pokedex/docs/ko',
        loadComponent: () => import('./pokedex/components/docs-ko/docs-ko.component').then(m => m.DocsKOComponent),
        title: 'Pokédex - K.O.'
    },
    { path: 'enigmemain',
        component: EnigmeComponent,
        title: 'Énigme Main',
    },
    {
        path: 'enigme',
        component: EnigmeLayoutComponent,
        title: 'Énigmes',
        children: [
            {   path: '1', 
                component: Enigme1Component, 
                title: 'Énigme1',
                data: {
                    title: 'Énigme 1 : Un simple digicode', 
                    description: "J'ai laissé le code quelque part mais je ne me souviens plus où..." 
                }
            },
            {   path: '2', 
                component: Enigme2Component, 
                title: 'Énigme2',
                data: {
                    title: 'Énigme 2 : Encore un digicode ?', 
                    description: "J'ai envie de le casser ce digicode..." 
                }
            },
            {   path: '3', 
                component: Enigme3Component, 
                title: 'Énigme3',
                data: {
                    title: 'Énigme 3 : Accès Terminal', 
                    description: "Vous avez franchi la brèche. Maintenant, infiltrez le système." 
                }
            },
        ]
    },
    {
    path: 'guilde',
    component: GuildeGameComponent,
    title: 'Jeu de la Guilde'
  },
    { path: '**', redirectTo: '' }
];
