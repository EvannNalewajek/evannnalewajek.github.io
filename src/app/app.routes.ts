import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EnigmeComponent } from './pages/enigme/enigme';
import { EnigmeLayoutComponent } from './layout/enigme-layout';
import { Enigme1Component } from './pages/enigme/enigme1/enigme1';
import { Enigme2Component } from './pages/enigme/enigme2/enigme2';
import { GuildeGameComponent } from './idle-game/components/game-main/game-main.component';
import { PokedexMainComponent } from './pokedex/components/pokedex-main/pokedex-main.component';
import { PokedexListComponent } from './pokedex/components/pokedex-list/pokedex-list.component';
import { PokedexDetailComponent } from './pokedex/components/pokedex-detail/pokedex-detail.component';
import { TypePageComponent } from './pokedex/components/pokedex-type/pokedex-type.component';
import { PokedexFieldComponent } from './pokedex/components/pokedex-field/pokedex-field.component';
import { MovesListComponent } from './pokedex/components/moves-list/moves-list.component';
import { MovesDetailComponent } from './pokedex/components/moves-detail/moves-detail.component';
import { AbilitiesListComponent } from './pokedex/components/abilities-list/abilities-list.component';
import { AbilitiesDetailComponent } from './pokedex/components/abilities-detail/abilities-detail.component';
import { ItemsListComponent } from './pokedex/components/items-list/items-list.component';
import { ItemsDetailComponent } from './pokedex/components/items-detail/items-detail.component';
import { DocumentationComponent } from './pokedex/components/documentation/documentation.component';
import { DocsIntroductionComponent } from './pokedex/components/docs-introduction/docs-introduction.component';
import { DocsStatisticsComponent } from './pokedex/components/docs-statistics/docs-statistics.component';
import { DocsStatusComponent } from './pokedex/components/docs-status/docs-status.component';
import { DocsWeatherComponent } from './pokedex/components/docs-weather/docs-weather.component';
import { DocsKOComponent } from './pokedex/components/docs-ko/docs-ko.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, title: 'Accueil' },
    { path: 'pokedex', component: PokedexMainComponent, title: 'Pokédex' },
    { path: 'pokedex/pokemons', component: PokedexListComponent, title: 'Pokédex - Liste' },
    { path: 'pokedex/pokemons/:id', component: PokedexDetailComponent, title: 'Pokédex - Détail' },
    { path: 'pokedex/moves', component: MovesListComponent, title: 'Pokédex - Capacités' },
    { path: 'pokedex/moves/:slug', component: MovesDetailComponent, title : 'Pokédex - Capacités Détail' },
    { path: 'pokedex/types/:slug', component: TypePageComponent, title: 'Pokédex - Type' },
    { path: 'pokedex/abilities', component: AbilitiesListComponent, title: 'Pokédex - Talents' },
    { path: 'pokedex/abilities/:slug', component: AbilitiesDetailComponent, title: 'Pokédex - Talents Détail' },
    { path: 'pokedex/docs', component: DocumentationComponent, title: 'Pokédex - Documentation' },
    { path: 'pokedex/docs/introduction', component: DocsIntroductionComponent, title: 'Pokédex - Introduction' },
    { path: 'pokedex/docs/statistics', component: DocsStatisticsComponent, title: 'Pokédex - Statistiques' },
    { path: 'pokedex/docs/fields', component: PokedexFieldComponent, title: 'Pokédex - Champ' },
    { path: 'pokedex/docs/weather', component: DocsWeatherComponent, title: 'Pokédex - Météo' },
    { path: 'pokedex/docs/status', component: DocsStatusComponent, title: 'Pokédex - Statut' },
    { path: 'pokedex/docs/items', component: ItemsListComponent, title: 'Pokédex - Objets' },
    { path: 'pokedex/docs/items/:slug', component: ItemsDetailComponent, title: 'Pokédex - Objets Détail' },
    { path: 'pokedex/docs/ko', component: DocsKOComponent, title: 'Pokédex - K.O.' },
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
        ]
    },
    {
    path: 'guilde',
    component: GuildeGameComponent,
    title: 'Jeu de la Guilde'
  },
    { path: '**', redirectTo: '' }
];
