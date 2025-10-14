import { Component, OnDestroy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../game.service';
import { GuildComponent } from '../guild/guild.component';
import { ForestComponent } from '../forest/forest.component';

@Component({
    selector: 'app-guilde-game',
    standalone: true,
    imports: [CommonModule, GuildComponent, ForestComponent],
    templateUrl: './game-main.component.html',
    styleUrls: ['./game-main.component.scss'],
})
export class GuildeGameComponent implements OnInit, OnDestroy {
    private autosaveId: any;

    constructor(public game: GameService) {}

    ngOnInit() {
    this.game.loadGame();
    this.game.startGameLoop();
    this.autosaveId = setInterval(() => this.game.saveGame(), 15000);
    }

    ngOnDestroy() {
    this.game.stopGameLoop();
    clearInterval(this.autosaveId);
    this.game.saveGame();
    }

    isGuild = computed(() => this.game.location() === 'guild');
    isForest = computed(() => this.game.location() === 'forest');

    go(tab: 'guild'|'forest') {
    tab === 'guild' ? this.game.leaveForest() : this.game.enterForest();
    }
}
