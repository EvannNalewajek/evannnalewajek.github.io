import { Injectable } from '@angular/core';
import { GameStore } from '../state/game.store';
import { PersistenceService } from './persistence.service';
import { QuestInstance } from '../../models';

@Injectable({ providedIn: 'root' })
export class QuestService {
    // Type of enemy available for quests
    private readonly ENEMY_TYPES = ['goblin', 'sanglier'];

    constructor(
        private store: GameStore,
        private persist: PersistenceService,
    ) {}

    generateQuestOffers(n = 3): void {
        if (n <= 0) return;
        const offers = [...this.store.questOffers()];
        for (let i = 0; i < n; i++) {
            offers.push(this.rollQuest());
        }
        this.store.questOffers.set(offers);
        this.persist.saveFrom(this.store);
    }

    // Sort of refresh for quest offers
    replaceQuestOffers(n = 3): void {
        const offers: QuestInstance[] = [];
        for (let i = 0; i < n; i++) {
            offers.push(this.rollQuest());
        }
        this.store.questOffers.set(offers);
        this.persist.saveFrom(this.store);
    }

    /**
     * Accept a quest :
     * - Make sure the Guild is at level 2 and the Player hasn't reached the max amount of accepted quests
     * - Move the quest from "offer" to "accepted"
     * - Save
     */
    accept(id: string): boolean {
        if (this.store.guildLevel() < 2) return false;

        const offers = this.store.questOffers();
        const q = offers.find(o => o.id === id);
        if (!q) return false;

        if (this.store.acceptedQuests().length >= this.store.maxAcceptedQuests()) {
            return false;
        }

        const accepted: QuestInstance = { ...q, acceptedAt: Date.now() };
        this.store.acceptedQuests.set([...this.store.acceptedQuests(), accepted]);
        this.store.questOffers.set(offers.filter(o => o.id !== id));

        this.persist.saveFrom(this.store);
        return true;
    }

    abandon(id: string): void {
        const rest = this.store.acceptedQuests().filter(q => q.id !== id);
        this.store.acceptedQuests.set(rest);
        this.ensureQuestOffers();
        this.persist.saveFrom(this.store);
    }

    /**
     * When an enemy got killed :
     * - Increase the progression of corresponding quests
     * - Complete the quest when it reaches the end of progression
     */
    onEnemyKilled(type: string): void {
        const updated = this.store.acceptedQuests().map(q => {
            if (q.kind === 'HuntCountByType' && q.enemyType === type && !q.completed) {
                const progress = Math.min(q.count, (q.progress ?? 0) + 1);
                const completed = progress >= q.count;
                return { ...q, progress, completed };
            }
            return q;
        });

        this.store.acceptedQuests.set(updated);

        // Make an update so the pop-up can play
        updated
        .filter(q => q.completed)
        .forEach(q => this.completeQuest(q));
    }

    ensureQuestOffers(target = 3): void {
        if (this.store.guildLevel() < 2) return;

        const offers = [...this.store.questOffers()];
        while (offers.length < target) {
        offers.push(this.rollQuest());
        }
        this.store.questOffers.set(offers);
        this.persist.saveFrom(this.store);
    }

    // -----------------------
    // Internals
    // -----------------------

    private completeQuest(q: QuestInstance): void {
        if (!q.completed) return;

        // Popup "Quest Complete"
        this.store.lastCompletedQuest.set({ ...q });
        this.store.questCompleteTick.set(this.store.questCompleteTick() + 1);

        // Gold reward
        const p = this.store.player();
        this.store.player.set({ ...p, gold: p.gold + (q.goldReward ?? 0) });

        // Remove for "accepted quests" list
        const rest = this.store.acceptedQuests().filter(x => x.id !== q.id);
        this.store.acceptedQuests.set(rest);

        // Update the amount of quests if needed
        this.ensureQuestOffers();

        // Save
        this.persist.saveFrom(this.store);
    }

    // Generate a new random quest (only HuntCountByType for now)
    private rollQuest(): QuestInstance {
        const enemyType = this.ENEMY_TYPES[Math.floor(Math.random() * this.ENEMY_TYPES.length)];

        // More levels = More enemies to kill
        const playerLvl = this.store.player().level;
        const enemyIndex = this.store.enemyIndex();
        const baseCount = 4 + Math.floor(playerLvl * 0.6) + Math.floor((enemyIndex ?? 0) * 0.2);
        const count = Math.max(3, Math.min(30, Math.round(baseCount + (Math.random() * 3 - 1))));

        // gold : ~6–10 per kill
        const goldReward = count * (6 + Math.floor(Math.random() * 5));

        return {
        id: this.uid(),
        kind: 'HuntCountByType',
        enemyType,
        count,
        goldReward,
        progress: 0,
        completed: false,
        };
    }

    // ID generator for quests
    private uid(): string {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return (crypto as any).randomUUID();
        }
        return Math.random().toString(36).slice(2, 10);
    }
}
