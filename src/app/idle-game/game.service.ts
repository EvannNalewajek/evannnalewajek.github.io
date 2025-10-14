import { Injectable, computed, signal, inject, PLATFORM_ID } from '@angular/core';
import { LocationKey, EnemyInstance, EnemyTemplate, Player } from './models';
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
        { id: 'boar',   name: 'Boar',   baseHealth: 25, baseDamage: 2, attackSpeed: 0.4, baseGoldReward: 2 },
    ];

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

    levelUpTick = signal(0);
    currentEnemy = signal<EnemyInstance | null>(null);
    private enemyIndex = signal(0);

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
            v: 1,
            player: this.player(),
            location: this.location(),
            currentEnemy: this.currentEnemy(),
            enemyIndex: this.enemyIndex(),
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
                if (saveData.v !== 1) {
                    console.warn('Unknown save version', saveData.v);
                    return;
                }

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
        const p = this.player();
        this.player.set({ ...p, gold: p.gold + enemy.baseGoldReward });

        const xpGain = Math.ceil(enemy.baseHealth / 5);
        this.gainExperience(xpGain);

        const nextIndex = (this.enemyIndex() + 1) % this.ENNEMIES.length;
        this.enemyIndex.set(nextIndex);
        this.spawnEnemy();
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
}