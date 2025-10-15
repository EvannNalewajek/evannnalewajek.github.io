import { Component, OnDestroy, OnInit, computed, inject, PLATFORM_ID, HostListener, signal } from '@angular/core';
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

    showSettings = signal(false);

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

    toggleSettings() {
        this.showSettings.set(!this.showSettings());
    }

    resetProgress() {
        if (!confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression ?')) return;

        if (this.isBrowser) localStorage.removeItem('idle-game-save');

        // Reset Player Stats
        this.game.player.set({
            gold: 0,
            stats: { strength: 1, resilience: 0, vitality: 10, aura: 0, mental: 0 },
            currentHealth: 10,
            level: 1,
            experience: 0,
            unspentStatPoints: 0,
        });
        this.game.location.set('guild');
        this.game.currentEnemy.set(null);

        this.toggleSettings();
        alert('Progression réinitialisée ✅');
    }
}
