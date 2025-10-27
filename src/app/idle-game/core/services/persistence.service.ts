import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GameStore } from '../state/game.store';
import { EnemyInstance, Player, QuestInstance, Recruit } from '../../models';

const STORAGE_KEY = 'idle-game-save';
const SAVE_VERSION = 2;

type Save = {
    v: number;                // version
    ts: number;               // timestamp
    player: Player;
    location: string;
    currentEnemy: EnemyInstance | null;
    enemyIndex: number;
    guildLevel: number;
    questOffers: QuestInstance[];
    acceptedQuests: QuestInstance[];
    recruits: Recruit[], 
};

type AnySave = Partial<Save> & Record<string, any>;

@Injectable({ providedIn: 'root' })
export class PersistenceService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    constructor() {}

    // ---------- Public API ----------

    saveFrom(store: GameStore): void {
        if (!this.canPersist()) return;
        try {
            const blob: Save = {
                v: SAVE_VERSION,
                ts: Date.now(),
                player: store.player(),
                location: store.location(),
                currentEnemy: store.currentEnemy(),
                enemyIndex: store.enemyIndex(),
                guildLevel: store.guildLevel(),
                questOffers: store.questOffers(),
                acceptedQuests: store.acceptedQuests(),
                recruits: store.recruits(), 
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
        } catch (e) {
            console.warn('[Persistence] Failed to save game:', e);
        }
    }

    loadInto(store: GameStore): void {
        if (!this.canPersist()) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            let parsed: AnySave;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                console.warn('[Persistence] Corrupted JSON, ignoring:', e);
                return;
            }

            const migrated = this.migrate(parsed);

            // Player merge (prevents inconsistency between old and new save version)
            const def = store.player();
            const sp = migrated.player ?? {} as Player;

            const mergedPlayer: Player = {
                gold: sp.gold ?? 0,
                stats: {
                strength: sp.stats?.strength ?? def.stats.strength,
                resilience: sp.stats?.resilience ?? def.stats.resilience,
                vitality:  sp.stats?.vitality  ?? def.stats.vitality,
                aura:      sp.stats?.aura      ?? def.stats.aura,
                mental:    sp.stats?.mental    ?? def.stats.mental,
                },
                spentStats: {
                strength: sp.spentStats?.strength ?? def.spentStats.strength,
                resilience: sp.spentStats?.resilience ?? def.spentStats.resilience,
                vitality:  sp.spentStats?.vitality  ?? def.spentStats.vitality,
                aura:      sp.spentStats?.aura      ?? def.spentStats.aura,
                mental:    sp.spentStats?.mental    ?? def.spentStats.mental,
                },
                currentHealth: 0,
                level: sp.level ?? 1,
                experience: sp.experience ?? 0,
                unspentStatPoints: sp.unspentStatPoints ?? 0,
            };
            const vitality = mergedPlayer.stats.vitality;
            const savedHP = (sp.currentHealth ?? vitality);
            mergedPlayer.currentHealth = Math.min(Math.max(0, savedHP), vitality);
            store.player.set(mergedPlayer);

            const loc = (typeof migrated.location === 'string' ? migrated.location : 'guild') as any;
            store.location.set(loc);
            store.enemyIndex.set(Number.isFinite(migrated.enemyIndex) ? (migrated.enemyIndex as number) : 0);
            store.guildLevel.set(typeof migrated.guildLevel === 'number' ? migrated.guildLevel : 1);

            store.questOffers.set(Array.isArray(migrated.questOffers) ? migrated.questOffers : []);
            store.acceptedQuests.set(Array.isArray(migrated.acceptedQuests) ? migrated.acceptedQuests : []);
            store.recruits.set(Array.isArray((migrated as any).recruits) ? (migrated as any).recruits : []);
        } catch (e) {
            console.warn('[Persistence] Failed to load game:', e);
        }
    }

    wipe(): void {
        if (!this.canPersist()) return;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('[Persistence] Failed to wipe save:', e);
        }
    }

    // ---------- Internals ----------

    private canPersist(): boolean {
        return this.isBrowser && typeof localStorage !== 'undefined';
    }

    /**
     * Migration to v2 schema
     */
    private migrate(src: AnySave): Save {
        const v = Number(src.v ?? 1);

        if (v >= 2) {
            return {
                v: 2,
                ts: Number(src.ts ?? Date.now()),
                player: src.player as Player,
                location: typeof src.location === 'string' ? src.location : 'guild',
                currentEnemy: (src.currentEnemy ?? null) as EnemyInstance | null,
                enemyIndex: Number.isFinite(src.enemyIndex) ? Number(src.enemyIndex) : 0,
                guildLevel: typeof src.guildLevel === 'number' ? src.guildLevel : 1,
                questOffers: Array.isArray(src.questOffers) ? src.questOffers as QuestInstance[] : [],
                acceptedQuests: Array.isArray(src.acceptedQuests) ? src.acceptedQuests as QuestInstance[] : [],
                recruits: src.recruits as Recruit[],
            };
        }

        // --- Migration V1 -> V2 ---
        return {
            v: 2,
            ts: Date.now(),
            player: (src.player ?? {}) as Player,
            location: typeof src.location === 'string' ? src.location : 'guild',
            currentEnemy: (src.currentEnemy ?? null) as EnemyInstance | null,
            enemyIndex: Number.isFinite(src.enemyIndex) ? Number(src.enemyIndex) : 0,
            guildLevel: typeof src.guildLevel === 'number' ? src.guildLevel : 1,
            questOffers: Array.isArray(src.questOffers) ? src.questOffers as QuestInstance[] : [],
            acceptedQuests: Array.isArray(src.acceptedQuests) ? src.acceptedQuests as QuestInstance[] : [],
            recruits: src.recruits as Recruit[],
        };
    }
}