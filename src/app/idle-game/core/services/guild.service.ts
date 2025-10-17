import { Injectable } from '@angular/core';
import { GameStore } from '../state/game.store';
import { QuestService } from './quest.service';
import { PersistenceService } from './persistence.service';

/**
 * GuildService
 * - Manage guild upgrades
 * - Unlock the Quest Board and manage its content
 */
@Injectable({ providedIn: 'root' })
export class GuildService {
    constructor(
        private store: GameStore,
        private quests: QuestService,
        private persist: PersistenceService,
    ) {}

    getUpgradeCost(): number {
        return this.store.guildUpgradeCost();
    }

    canUpgrade(): boolean {
        return this.store.player().gold >= this.getUpgradeCost();
    }

    hasQuestBoard(): boolean {
        return this.store.hasQuestBoard();
    }

    recruitSlots(): number {
        return this.store.recruitSlots();
    }

    maxAcceptedQuests(): number {
        return this.store.maxAcceptedQuests();
    }

    /**
     * Manage the upgarde of the guild:
     * - Check player's gold
     * - Remove the right amount of gold from their purse
     * - Increase guild level
     * - If Quest Board got unlocked by the upgrade, check if they are quests on it
     * - Save
     * @returns true if upgrade, false otherwise
     */
    upgrade(): boolean {
        const cost = this.getUpgradeCost();
        const p = this.store.player();

        if (p.gold < cost) return false;

        this.store.player.set({ ...p, gold: p.gold - cost });

        const prev = this.store.guildLevel();
        this.store.guildLevel.set(prev + 1);

        // Make sure the Quest Board has quests, especially when it got recently unlocked
        if (prev < 2 && this.store.guildLevel() >= 2) {
        this.ensureQuestOffers();
        }

        this.persist.saveFrom(this.store);
        return true;
    }

    private ensureQuestOffers(target = 3): void {
        if (!this.hasQuestBoard()) return;

        const current = this.store.questOffers().length;
        if (current >= target) return;

        const toGenerate = target - current;
        this.quests.generateQuestOffers(toGenerate);
    }
}
