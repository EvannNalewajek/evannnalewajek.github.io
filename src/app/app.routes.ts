import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EnigmeComponent } from './pages/enigme/enigme';
import { EnigmeLayoutComponent } from './layout/enigme-layout';
import { Enigme1Component } from './pages/enigme/enigme1/enigme1';
import { Enigme2Component } from './pages/enigme/enigme2/enigme2';
import { GuildeGameComponent } from './idle-game/components/game-main/game-main.component';
import { PokedexListComponent } from './pokedex/components/pokedex-list/pokedex-list.component';
import { PokedexDetailComponent } from './pokedex/components/pokedex-detail/pokedex-detail.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, title: 'Accueil' },
    { path: 'pokedex', component: PokedexListComponent, title: 'Pokédex' },
    { path: 'pokedex/:id', component: PokedexDetailComponent, title: 'Pokédex — Détail' },
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
