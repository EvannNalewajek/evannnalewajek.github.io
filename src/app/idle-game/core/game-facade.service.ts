// src/app/core/game-facade.service.ts
import { Injectable } from '@angular/core';
import { GameStore } from './state/game.store';
import { EngineService } from './services/engine.service';
import { PersistenceService } from './services/persistence.service';
import { CombatService } from './services/combat.service';
import { GuildService } from './services/guild.service';
import { QuestService } from './services/quest.service';
import { EnemyService } from './services/enemy.service';
import { PlayerService } from './services/player.service';

@Injectable({ providedIn: 'root' })
export class GameFacadeService {
    constructor(
        // State
        private store: GameStore,
        // Systems
        private engine: EngineService,
        private persist: PersistenceService,
        private combat: CombatService,
        private guild: GuildService,
        private quests: QuestService,
        private enemies: EnemyService,
        private playerSvc: PlayerService,
    ) {}

    // State
    get location()           { return this.store.location; }
    get player()             { return this.store.player; }
    get guildLevel()         { return this.store.guildLevel; }
    get currentEnemy()       { return this.store.currentEnemy; }
    get enemyIndex()         { return this.store.enemyIndex; }

    // Quests
    get questOffers()        { return this.store.questOffers; }
    get acceptedQuests()     { return this.store.acceptedQuests; }
    get questCompleteTick()  { return this.store.questCompleteTick; }
    get lastCompletedQuest() { return this.store.lastCompletedQuest; }

    // UI ticks
    get levelUpTick()        { return this.store.levelUpTick; }

    // Computed
    get guildUpgradeCost()   { return this.store.guildUpgradeCost; }
    get hasQuestBoard()      { return this.store.hasQuestBoard; }
    get recruitSlots()       { return this.store.recruitSlots; }
    get maxAcceptedQuests()  { return this.store.maxAcceptedQuests; }
    get playerDPS()          { return this.store.playerDPS; }
    get playerHealthPercent(){ return this.store.playerHealthPercent; }
    get enemyHealthPercent() { return this.store.enemyHealthPercent; }
    get experiencePercent()  { return this.store.experiencePercent; }

    // ========= Loop =========
    startGameLoop(): void {
        this.engine.start();
    }
    stopGameLoop(): void {
        this.engine.stop();
    }

    // ========= Save =========
    loadGame(): void {
        this.persist.loadInto(this.store);

        if (this.guildLevel() >= 2) {
            this.quests.ensureQuestOffers(3);
        }

        if (this.location() !== 'forest') {
            this.enemies.clearCurrent();
        } else if (!this.currentEnemy()) {
            this.enemies.spawnCurrent();
        }
    }
    saveGame(): void {
        this.persist.saveFrom(this.store);
    }
    wipeSave(): void {
        this.persist.wipe();
    }

    // ========= Navigation / Actions =========
    enterForest(): void {
        if (this.location() === 'forest') return;
        this.location.set('forest');
        if (!this.currentEnemy()) {
        this.enemies.spawnCurrent();
        }
        this.persist.saveFrom(this.store);
    }

    leaveForest(): void {
        if (this.location() === 'guild') return;
        this.location.set('guild');
        this.enemies.clearCurrent();
        this.persist.saveFrom(this.store);
    }

    restAtGuild(): void {
        if (this.location() !== 'guild') return;
        this.playerSvc.fullHeal();
    }

    clickAttack(): void {
        this.combat.clickAttack();
    }

    // ========= Guild =========
    guildUpgrade(): boolean {
        return this.guild.upgrade();
    }

    // ========= Quest =========
    acceptQuest(id: string): boolean {
        return this.quests.accept(id);
    }

    abandonQuest(id: string): void {
        this.quests.abandon(id);
    }

    ensureQuestOffers(target = 3): void {
        this.quests.ensureQuestOffers(target);
    }

    generateQuestOffers(n = 3): void {
        this.quests.generateQuestOffers(n);
    }

    // ========= Enemies =========
    enemyTypes(): string[] {
        return this.enemies.getEnemyTypes();
    }

    // ========= Player =========
    addStat(stat: keyof ReturnType<GameStore['player']>['stats']): boolean {
        return this.playerSvc.addStat(stat as any);
    }

    getExperienceForLevel(level: number): number {
        return this.store.getExperienceForLevel(level);
    }
}
