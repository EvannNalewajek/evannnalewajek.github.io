import { Injectable } from '@angular/core';
import { GameStore } from '../state/game.store';
import { ENEMIES } from '../data/enemies.data';
import { EnemyInstance, EnemyTemplate } from '../../models';

@Injectable({ providedIn: 'root' })
export class EnemyService {
    // Access to enemies.data.ts
    get catalogue(): EnemyTemplate[] {
        return ENEMIES;
    }

    // List all enemy types (useful for quests)
    getEnemyTypes(): string[] {
        return ENEMIES.map(e => e.id);
    }

    // Raw DPS based on its stats
    enemyDps(enemy: Pick<EnemyInstance, 'baseDamage' | 'attackSpeed'>): number {
        return enemy.baseDamage * enemy.attackSpeed;
    }

    // Type of the Enemy instance
    enemyTypeOf(e: EnemyInstance): string {
        const t = (e as any).type as string | undefined;
        if (t) return t;

        const name = e.name?.toLowerCase?.() ?? '';
        if (name.includes('goblin')) return 'goblin';
        if (name.includes('sanglier')) return 'sanglier';
        // fallback
        return 'goblin';
    }

    goldReward(): number {
        const e = this.store.currentEnemy();
        return e ? e.baseGoldReward : 0;
    }

    spawnCurrent(): void {
        const idx = this.normalizeIndex(this.store.enemyIndex());
        const tpl = ENEMIES[idx];
        const inst = this.instantiate(tpl);
        this.store.currentEnemy.set(inst);
    }

    // Enemy rotation
    spawnNext(): void {
        const next = this.normalizeIndex(this.store.enemyIndex() + 1);
        this.store.enemyIndex.set(next);
        this.spawnCurrent();
    }

    // Force the index of the enemy (Debug)
    spawnAt(index: number): void {
        const idx = this.normalizeIndex(index);
        this.store.enemyIndex.set(idx);
        this.spawnCurrent();
    }

    clearCurrent(): void {
        this.store.currentEnemy.set(null);
    }

    // -----------------------
    // Internals
    // -----------------------

    private instantiate(tpl: EnemyTemplate): EnemyInstance {
        return {
            id: tpl.id,
            name: tpl.name,
            baseHealth: tpl.baseHealth,
            baseDamage: tpl.baseDamage,
            attackSpeed: tpl.attackSpeed,
            baseGoldReward: tpl.baseGoldReward,
            currentHealth: tpl.baseHealth,
        };
    }

    private normalizeIndex(i: number): number {
        const n = ENEMIES.length;
        if (n === 0) return 0;
        return ((i % n) + n) % n;
    }

    constructor(private store: GameStore) {}
}