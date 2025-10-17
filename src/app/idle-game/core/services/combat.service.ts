import { Injectable } from '@angular/core';
import { GameStore } from '../state/game.store';
import { EnemyService } from './enemy.service';
import { QuestService } from './quest.service';
import { PersistenceService } from './persistence.service';
import { EnemyInstance } from '../../models';

const RESILIENCE_MAX_REDUCTION = 0.5; // 50% damage reduction

@Injectable({ providedIn: 'root' })
export class CombatService {
    constructor(
        private store: GameStore,
        private enemies: EnemyService,
        private quests: QuestService,
        private persist: PersistenceService,
    ) {}

    tick(delta: number): void {
        if (this.store.location() !== 'forest') return;

        const p = this.store.player();
        let e = this.store.currentEnemy();
        if (!e) {
            this.enemies.spawnCurrent();
            e = this.store.currentEnemy();
            if (!e) return;
        }

        const playerDps = this.store.playerDPS();
        if (playerDps > 0) {
            e.currentHealth = Math.max(0, e.currentHealth - playerDps * delta);
        }

        const enemyDpsRaw = this.enemies.enemyDps(e); // baseDamage * attackSpeed
        const enemyDpsEff = this.enemyDpsAfterResilience(enemyDpsRaw);
        const newHP = Math.max(0, p.currentHealth - enemyDpsEff * delta);

        if (e.currentHealth <= 0) {
            this.onEnemyKilled(e);
            return;
        } else {
            this.store.currentEnemy.set({ ...e });
        }

        if (newHP <= 0) {
            this.onPlayerDead();
            return;
        }

        if (newHP !== p.currentHealth) {
            this.store.player.set({ ...p, currentHealth: newHP });
        }
    }

    clickAttack(): void {
        if (this.store.location() !== 'forest') return;
        const e = this.store.currentEnemy();
        if (!e) return;

        const dmg = this.store.player().stats.strength;
        const hp = Math.max(0, e.currentHealth - dmg);
        if (hp <= 0) {
            this.onEnemyKilled(e);
        } else {
            this.store.currentEnemy.set({ ...e, currentHealth: hp });
        }
    }

    private enemyDpsAfterResilience(enemyDpsRaw: number): number {
        const r = this.store.player().stats.resilience;
        const reduced = enemyDpsRaw - r;
        const floored = Math.max(enemyDpsRaw * (1 - RESILIENCE_MAX_REDUCTION), reduced);
        return Math.max(0, floored);
    }

    private onEnemyKilled(enemy: EnemyInstance): void {
        const p = this.store.player();
        const goldGain = enemy.baseGoldReward ?? 0;
        this.store.player.set({ ...p, gold: p.gold + goldGain });

        const xpGain = Math.ceil((enemy.baseHealth ?? 0) / 5);
        this.gainExperience(xpGain);

        const type = this.enemies.enemyTypeOf(enemy);
        this.quests.onEnemyKilled(type);

        this.enemies.spawnNext();

        this.persist.saveFrom(this.store);
    }

    private onPlayerDead(): void {
        this.leaveForest();

        const p = this.store.player();
        this.store.player.set({ ...p, currentHealth: p.stats.vitality });

        this.persist.saveFrom(this.store);
    }

    private leaveForest(): void {
        if (this.store.location() !== 'guild') {
            this.store.location.set('guild');
        }
        this.enemies.clearCurrent();
    }

    private gainExperience(amount: number): void {
        const cur = this.store.player();
        let xp = (cur.experience ?? 0) + Math.max(0, amount);
        let lvl = cur.level ?? 1;
        let unspent = cur.unspentStatPoints ?? 0;

        let leveled = false;
        while (true) {
            const cost = this.store.getExperienceForLevel(lvl);
            if (xp < cost) break;
            xp -= cost;
            lvl += 1;
            unspent += 3;
            leveled = true;
        }

        this.store.player.set({
            ...cur,
            level: lvl,
            experience: xp,
            unspentStatPoints: unspent,
        });

        if (leveled) {
        this.store.levelUpTick.set(this.store.levelUpTick() + 1);
        }
    }
}
