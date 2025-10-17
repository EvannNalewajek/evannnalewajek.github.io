import { Injectable, signal, computed } from '@angular/core';
import { LocationKey, EnemyInstance, Player, QuestInstance } from '../../models';

/**
 * GameStore – Contains every signals and computed
 */
@Injectable({ providedIn: 'root' })
export class GameStore {
    // Guild cost variables
    private readonly GUILD_BASE_COST = 150;
    private readonly GUILD_COST_FACTOR = 1.6;

    // SIGNALS

    // Current location
    readonly location = signal<LocationKey>('guild');

    // Current player state
    readonly player = signal<Player>({
        gold: 0,
        stats: {
            strength: 1,
            resilience: 0,
            vitality: 10,
            aura: 0,
            mental: 0
        },
        currentHealth: 10,
        level: 1,
        experience: 0,
        unspentStatPoints: 0,
    });

    // Current guild level
    readonly guildLevel = signal<number>(1);

    // Tick used to create a level-up pop-up everytime it increases
    readonly levelUpTick = signal(0);

    // Current enemy the player is facing
    readonly currentEnemy = signal<EnemyInstance | null>(null);

    // Index of the current enemy (useful for enemy rotation)
    readonly enemyIndex = signal(0);

    // Current Quest offers
    readonly questOffers = signal<QuestInstance[]>([]);

    // Current accepted quests
    readonly acceptedQuests = signal<QuestInstance[]>([]);

    // Tick used to create a quest-completed pop-up everytime it increases
    readonly questCompleteTick = signal(0);
    readonly lastCompletedQuest = signal<QuestInstance | null>(null);

    // COMPUTED

    // Calculate the cost of the next guild upgrade
    readonly guildUpgradeCost = computed(() => {
        const lvl = this.guildLevel();
        return Math.floor(
            this.GUILD_BASE_COST * Math.pow(this.GUILD_COST_FACTOR, Math.max(0, lvl - 1))
        );
    });

    // Unlock the quest board when guild is at level 2
    readonly hasQuestBoard = computed(() => this.guildLevel() >= 2);

    // Unlock the recruit slot when guild is at level 5
    readonly recruitSlots = computed(() => (this.guildLevel() >= 5 ? 1 : 0));

    /**
     * Max number of accepted quests possible :
     * 1 starting at guild lvl 2, then +1 every two levels.
     */
    readonly maxAcceptedQuests = computed(() => {
        return 1 + Math.floor(Math.max(0, this.guildLevel() - 2) / 2);
    });

    // Automatic DPS from the payer (Aura * (1 + Mental/10))
    readonly playerDPS = computed(() => {
        const p = this.player();
        return p.stats.aura * (1 + p.stats.mental / 10);
    });

    // Player health in percentage (0–100)
    readonly playerHealthPercent = computed(() => {
        const p = this.player();
        const maxHP = Math.max(1, p.stats.vitality);
        return Math.max(0, Math.min(100, (p.currentHealth / maxHP) * 100));
    });

    // Enemy health in percentage (0–100)
    readonly enemyHealthPercent = computed(() => {
        const e = this.currentEnemy();
        if (!e) return 0;
        const maxHP = Math.max(1, e.baseHealth);
        return Math.max(0, Math.min(100, (e.currentHealth / maxHP) * 100));
    });

    // Amount of experience until the next level in percentage (0–100)
    readonly experiencePercent = computed(() => {
        const p = this.player();
        const nextLevelExp = this.getExperienceForLevel(p.level);
        const denom = nextLevelExp > 0 ? nextLevelExp : 1;
        return Math.max(0, Math.min(100, (p.experience / denom) * 100));
    });

    // Helpers


    // Calculate the amount of xp required for the next level

    getExperienceForLevel(level: number): number {
        const lvl = Number.isFinite(level) && level > 0 ? level : 1;
        return Math.floor(20 * Math.pow(1.2, lvl - 1));
    }
}