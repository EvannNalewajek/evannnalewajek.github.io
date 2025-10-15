import { Component, OnDestroy, OnInit, computed, inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GameService } from '../../game.service';
import { GuildComponent } from '../guild/guild.component';
import { ForestComponent } from '../forest/forest.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-guilde-game',
    standalone: true,
    imports: [CommonModule, GuildComponent, ForestComponent],
    templateUrl: './game-main.component.html',
    styleUrls: ['./game-main.component.scss'],
})
export class GuildeGameComponent implements OnInit, OnDestroy {
    private autosaveId: any;
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    constructor(public game: GameService, private router: Router) {}

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

    @HostListener('document:keydown.escape')
  onEsc() { this.exitGame(); }

  exitGame() {
    if (this.isBrowser) {
      this.game.saveGame();
      this.game.stopGameLoop();
    }
    this.router.navigateByUrl('/');
  }
}
