import { Injectable, computed, signal, inject, PLATFORM_ID } from '@angular/core';
import { LocationKey, EnemyInstance, EnemyTemplate, Player, QuestInstance } from './models';
import { isPlatformBrowser } from '@angular/common';

/**
 * GameService – core loop, state and combat helpers
 */

// Constants & balance knobs
const RESILIENCE_MAX_REDUCTION = 0.5; // Max 50% damage reduction from resilience
const DELTA_CAP_SECONDS = 0.25;       // Cap delta to avoid big jumps after tab inactivity
const AUTOSAVE_MS = 45000;            // Optional: autosave every 45s; set to 0 to disable

@Injectable({ providedIn: 'root' })
export class GameService {
    // Environment
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // Persistence
    private get canPersist() {
        return this.isBrowser && typeof localStorage !== 'undefined';
    }

    // --- Enemies catalogue (can later be externalized)
    private ENNEMIES: EnemyTemplate[] = [
        { id: 'goblin', name: 'Goblin', baseHealth: 20, baseDamage: 1, attackSpeed: 0.5, baseGoldReward: 1 },
        { id: 'sanglier',   name: 'Sanglier',   baseHealth: 25, baseDamage: 2, attackSpeed: 0.4, baseGoldReward: 2 },
    ];

    // --- Guild progression ---
    private readonly GUILD_BASE_COST = 150;
    private readonly GUILD_COST_FACTOR = 1.6;

    // Enemy list for quests
    private ENEMY_TYPES = ["goblin", "sanglier"];

    // Signals (state)
    location = signal<LocationKey>('guild');

    player = signal<Player>({
        gold: 0,
        stats: { strength: 1, resilience: 0, vitality: 10, aura: 0, mental: 0 },
        currentHealth: 10,
        level: 1,
        experience: 0,
        unspentStatPoints: 0,
    });

    guildLevel = signal<number>(1);

    levelUpTick = signal(0);
    currentEnemy = signal<EnemyInstance | null>(null);
    private enemyIndex = signal(0);

    // --- Quests state ---
    questOffers = signal<QuestInstance[]>([]);
    acceptedQuests = signal<QuestInstance[]>([]);

    // Quest Complete Popup
    questCompleteTick = signal(0);
    lastCompletedQuest = signal<QuestInstance | null>(null);

    // Loop
    private running = signal(false);
    private lastTick = signal(performance.now());
    private autosaveHandle: any = null;

    constructor() {
        // Pause when tab hidden, resume when visible
        if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
            this.stopGameLoop();
            } else {
            this.startGameLoop();
            }
        });
        }
    }

    // Cost calculation for the next guild upgrade
    guildUpgradeCost = computed(() => {
        const lvl = this.guildLevel();
        return Math.floor(this.GUILD_BASE_COST * Math.pow(this.GUILD_COST_FACTOR, Math.max(0, lvl - 1)));
    });

    // Unlocked guild features flags
    hasQuestBoard = computed(() => this.guildLevel() >= 2);
    recruitSlots  = computed(() => (this.guildLevel() >= 5 ? 1 : 0)); // Temporary : only 1 slot unlocked at level 5

    // Max Quests acceptable at once: 1 at level 2, then 1 more every 2 guild levels
    maxAcceptedQuests = computed(() => 1 + Math.floor(Math.max(0, this.guildLevel() - 2) / 2));

    // Automated damage (Aura and Mental)
    playerDPS = computed(() => {
        const p = this.player();
        return p.stats.aura * (1 + p.stats.mental / 10);
    });

    // Health percentage (Self and Enemy)
    playerHealthPercent = computed(() => {
        const p = this.player();
        return Math.max(0, Math.min(100, (p.currentHealth / p.stats.vitality) * 100));
    });

    enemyHealthPercent = computed(() => {
        const e = this.currentEnemy();
        if (!e) return 0;
        return Math.max(0, Math.min(100, (e.currentHealth / e.baseHealth) * 100));
    });

    // Experience percentage
    experiencePercent = computed(() => {
        const p = this.player();
        const nextLevelExp = this.getExperienceForLevel(p.level);
        const denom = nextLevelExp > 0 ? nextLevelExp : 1;
        return Math.max(0, Math.min(100, (p.experience / denom) * 100));
    });

    // Public API
    upgradeGuild(): boolean {
        const p = this.player();
        const cost = this.guildUpgradeCost();
        if (p.gold < cost) return false;

        this.player.set({ ...p, gold: p.gold - cost });
        const prev = this.guildLevel();
        this.guildLevel.update(l => l + 1);

        const now = this.guildLevel();
        if (prev < 2 && now >= 2) {
            this.ensureQuestOffers();
        }

        this.saveGame();
        return true;
    }

    enterForest() {
        if (this.location() === 'forest') return;
        this.location.set('forest');
        if (!this.currentEnemy()) this.spawnEnemy();
    }

    leaveForest() {
        if (this.location() === 'guild') return;
        this.location.set('guild');
        this.currentEnemy.set(null);
    }

    clickAttack() {
        if (this.location() !== 'forest' || !this.currentEnemy()) return;
        const enemy = this.currentEnemy()!;
        const dmg = this.player().stats.strength;
        enemy.currentHealth = Math.max(0, enemy.currentHealth - dmg);
        this.currentEnemy.set({ ...enemy });
        if (enemy.currentHealth <= 0) this.onEnemyKilled(enemy);
    }

    restAtGuild() {
        const p = this.player();
        p.currentHealth = p.stats.vitality;
        this.player.set({ ...p });
    }

    startGameLoop() {
        if (this.running()) return;
        this.running.set(true);
        this.lastTick.set(performance.now());

        const loop = (now: number) => {
        if (!this.running()) return;
        const rawDelta = (now - this.lastTick()) / 1000;
        const delta = Math.min(rawDelta, DELTA_CAP_SECONDS);
        this.lastTick.set(now);
        this.tick(delta);
        requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);

        // Periodic autosave
        if (AUTOSAVE_MS > 0 && !this.autosaveHandle) {
        this.autosaveHandle = setInterval(() => this.saveGame(), AUTOSAVE_MS);
        }
    }

    stopGameLoop() {
        this.running.set(false);
        if (this.autosaveHandle) {
        clearInterval(this.autosaveHandle);
        this.autosaveHandle = null;
        }
    }

    saveGame() {
        if (!this.canPersist) return;
        try {
            const saveData = {
            v: 2,
            player: this.player(),
            location: this.location(),
            currentEnemy: this.currentEnemy(),
            enemyIndex: this.enemyIndex(),
            guildLevel: this.guildLevel(),
            questOffers: this.questOffers(),
            acceptedQuests: this.acceptedQuests(),
            ts: Date.now(),
            };
            localStorage.setItem('idle-game-save', JSON.stringify(saveData));
        } catch (e) {
            console.error('Failed to save game', e);
        }
        
    }

    loadGame() {
        if (!this.canPersist) return;
        try {
            const saveStr = localStorage.getItem('idle-game-save');
            if (!saveStr) return;
            try {
                const saveData = JSON.parse(saveStr);
                const version = Number(saveData.v ?? 1);

                const defaultPlayer = this.player();
                const savedPlayer = saveData.player ?? {};

                // Merge saved player data with default to ensure all fields are present
                const mergedPlayer: Player = {
                    gold: savedPlayer.gold ?? 0,
                    stats: {
                    strength: savedPlayer.stats?.strength ?? defaultPlayer.stats.strength,
                    resilience: savedPlayer.stats?.resilience ?? defaultPlayer.stats.resilience,
                    vitality: savedPlayer.stats?.vitality ?? defaultPlayer.stats.vitality,
                    aura: savedPlayer.stats?.aura ?? defaultPlayer.stats.aura,
                    mental: savedPlayer.stats?.mental ?? defaultPlayer.stats.mental,
                    },
                    currentHealth:
                    Math.min(
                        savedPlayer.currentHealth ?? (savedPlayer.stats?.vitality ?? defaultPlayer.stats.vitality),
                        savedPlayer.stats?.vitality ?? defaultPlayer.stats.vitality
                    ),
                    level: savedPlayer.level ?? 1,
                    experience: savedPlayer.experience ?? 0,
                    unspentStatPoints: savedPlayer.unspentStatPoints ?? 0,
                };
                this.player.set(mergedPlayer);

                this.location.set(saveData.location ?? 'guild');
                this.enemyIndex.set(saveData.enemyIndex ?? 0);

                this.guildLevel.set(typeof saveData.guildLevel === 'number' ? saveData.guildLevel : 1);

                this.questOffers.set(Array.isArray(saveData.questOffers) ? saveData.questOffers : []);
                this.acceptedQuests.set(Array.isArray(saveData.acceptedQuests) ? saveData.acceptedQuests : []);

                if (this.guildLevel() >= 2) {
                    this.ensureQuestOffers();
                }

                if (this.location() === 'forest' && saveData.currentEnemy) {
                    this.currentEnemy.set(saveData.currentEnemy);
                } else {
                    this.currentEnemy.set(null);
                }
            } catch (e) {
            console.error('Failed to load save', e);
            }
        } catch (e) {
            console.error('Failed to access localStorage', e);
        }
    }

    acceptQuest(id: string): boolean {
        if (this.guildLevel() < 2) return false;
        const offers = this.questOffers();
        const q = offers.find(o => o.id === id);
        if (!q) return false;
        if (this.acceptedQuests().length >= this.maxAcceptedQuests()) return false;

        q.acceptedAt = Date.now();
        this.acceptedQuests.set([...this.acceptedQuests(), q]);
        this.questOffers.set(offers.filter(o => o.id !== id));
        this.saveGame();
        return true;
    }

    abandonQuest(id: string) {
        const rest = this.acceptedQuests().filter(q => q.id !== id);
        this.acceptedQuests.set(rest);
        this.ensureQuestOffers();
        this.saveGame();
    }

    private completeQuest(q: QuestInstance) {
        if (!q.completed) return;

        // Quest Complete Popup
        this.lastCompletedQuest.set({ ...q });
        this.questCompleteTick.update(n => n + 1);

        // Reward
        const p = this.player();
        this.player.set({ ...p, gold: p.gold + q.goldReward });

        // Remove from the list
        this.acceptedQuests.set(this.acceptedQuests().filter(x => x.id !== q.id));
        this.ensureQuestOffers();
        
        this.saveGame();
    }

    private ensureQuestOffers(target = 3) {
        if (this.guildLevel() < 2) return;
        const offers = [...this.questOffers()];
        while (offers.length < target) offers.push(this.rollQuest());
        this.questOffers.set(offers);
        this.saveGame();
    }

    // Core combat loop
    private tick(delta: number) {
        if (this.location() !== 'forest') return;

        const p = this.player();
        let e = this.currentEnemy();
        if (!e) {
        this.spawnEnemy();
        e = this.currentEnemy()!;
        if (!e) return;
        }

        // Player automated damage (Aura and Mental)
        const playerDps = this.playerDPS();
        if (playerDps > 0) {
        e.currentHealth = Math.max(0, e.currentHealth - playerDps * delta);
        }

        // Enemy damage to player (with resilience cap)
        const enemyDpsRaw = e.baseDamage * e.attackSpeed;
        const enemyDpsEffective = this.enemyDpsAfterResilience(enemyDpsRaw);
        const newHealth = Math.max(0, p.currentHealth - enemyDpsEffective * delta);

        // Enemy death handling
        if (e.currentHealth <= 0) {
        this.onEnemyKilled(e);
        } else {
        this.currentEnemy.set({ ...e });
        }

        // Player death handling
        if (newHealth <= 0) {
        this.leaveForest();
        this.player.update(prev => ({ ...prev, currentHealth: prev.stats.vitality }));
        return;
        }

        if (newHealth !== p.currentHealth) {
        this.player.update(prev => ({ ...prev, currentHealth: newHealth }));
        }
    }

    // Helpers (Private methods)
    private enemyDpsAfterResilience(enemyDpsRaw: number): number {
        const r = this.player().stats.resilience;
        const reduced = enemyDpsRaw - r; // flat reduction first
        // Cap: never reduce below (1 - cap) of raw damage
        const floored = Math.max(enemyDpsRaw * (1 - RESILIENCE_MAX_REDUCTION), reduced);
        return Math.max(0, floored);
    }

    private onEnemyKilled(enemy: EnemyInstance) {

        // Gold reward
        const p = this.player();
        this.player.set({ ...p, gold: p.gold + enemy.baseGoldReward });
        
        // Experience reward
        const xpGain = Math.ceil(enemy.baseHealth / 5);
        this.gainExperience(xpGain);

        // Quest progression
        const type = this.enemyTypeOf(enemy);
        const updated = this.acceptedQuests().map(q => {
            if (q.kind === "HuntCountByType" && q.enemyType === type && !q.completed) {
            const progress = Math.min(q.count, q.progress + 1);
            const done = progress >= q.count;
            return { ...q, progress, completed: done };
            }
            return q;
        });

        this.acceptedQuests.set(updated);
        updated
            .filter(q => q.completed)
            .forEach(q => this.completeQuest(q));

        // Spawn another ennemy
        const nextIndex = (this.enemyIndex() + 1) % this.ENNEMIES.length;
        this.enemyIndex.set(nextIndex);
        this.spawnEnemy();
    }

    private enemyTypeOf(e: EnemyInstance): string {
        const t = (e as any).type as string | undefined;
        if (t) return t;
        const name = e.name.toLowerCase();
        if (name.includes("goblin")) return "goblin";
        if (name.includes("sanglier")) return "sanglier";
        // fallback
        return "goblin";
    }

    private spawnEnemy() {
        const template = this.ENNEMIES[this.enemyIndex()];
        const instance: EnemyInstance = {
        id: template.id,
        name: template.name,
        baseHealth: template.baseHealth,
        baseDamage: template.baseDamage,
        attackSpeed: template.attackSpeed,
        baseGoldReward: template.baseGoldReward,
        currentHealth: template.baseHealth,
        };
        this.currentEnemy.set(instance);
    }

    private gainExperience(amount: number) {
        const p = this.player();
        p.experience += amount;

        let lvl = p.level;
        let unspent = p.unspentStatPoints;

        while (true) {
        const expToNext = this.getExperienceForLevel(lvl);
        if (p.experience < expToNext) break;
        p.experience -= expToNext;
        lvl++;
        unspent += 3;
        }

        const leveledUp = lvl > p.level;

        this.player.set({
        ...p,
        level: lvl,
        experience: p.experience,
        unspentStatPoints: unspent,
        });

        if (leveledUp) this.levelUpTick.update((n) => n + 1);
    }

    getExperienceForLevel(level: number): number {
        const lvl = Number.isFinite(level) && level > 0 ? level : 1;
        return Math.floor(20 * Math.pow(1.2, lvl - 1));
    }

    private uid(): string {
        return Math.random().toString(36).slice(2, 9);
    }

    private rollQuest(): QuestInstance {
        const type = this.ENEMY_TYPES[Math.floor(Math.random() * this.ENEMY_TYPES.length)];

        // Logic for now : more levels = more enemies to kill
        const playerLvl = this.player().level;
        const baseCount = 4 + Math.floor(playerLvl * 0.6) + Math.floor(this.enemyIndex ? this.enemyIndex() * 0.2 : 0);
        const count = Math.max(3, Math.min(30, Math.round(baseCount + (Math.random()*3 - 1))));

        // gold: ~ 6–10 per kill
        const goldReward = count * (6 + Math.floor(Math.random() * 5));

        return {
            id: this.uid(),
            kind: "HuntCountByType",
            enemyType: type,
            count,
            goldReward,
            progress: 0,
            completed: false,
        };
    }

    generateQuestOffers(n = 3) {
    if (this.questOffers().length >= n) return; // If already 3 quests, don't create
    const offers: QuestInstance[] = [];
    for (let i = 0; i < n; i++) offers.push(this.rollQuest());
    this.questOffers.set(offers);
    this.saveGame();
    }
}