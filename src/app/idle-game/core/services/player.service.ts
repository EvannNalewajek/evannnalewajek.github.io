import { Injectable } from '@angular/core';
import { GameStore } from '../state/game.store';
import { PersistenceService } from './persistence.service';
import { Player } from '../../models';

type StatKey = keyof Player['stats']; // 'strength' | 'resilience' | 'vitality' | 'aura' | 'mental'

@Injectable({ providedIn: 'root' })
export class PlayerService {
    constructor(
        private store: GameStore,
        private persist: PersistenceService,
    ) {}

    // --------- Gold ---------

    gainGold(amount: number): void {
        const inc = Math.max(0, Math.floor(amount));
        if (inc === 0) return;

        const p = this.store.player();
        this.store.player.set({ ...p, gold: p.gold + inc });
        this.persist.saveFrom(this.store);
    }

    trySpendGold(amount: number): boolean {
        const cost = Math.max(0, Math.floor(amount));
        const p = this.store.player();
        if (p.gold < cost) return false;
        this.store.player.set({ ...p, gold: p.gold - cost });
        return true;
    }

    // --------- XP / Level ---------

    gainExperience(amount: number): void {
        const add = Math.max(0, Math.floor(amount));
        if (add === 0) return;

        const cur = this.store.player();
        let xp = (cur.experience ?? 0) + add;
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

        if (!leveled && xp === cur.experience) return;

        this.store.player.set({
            ...cur,
            level: lvl,
            experience: xp,
            unspentStatPoints: unspent,
        });

        if (leveled) {
            this.store.levelUpTick.set(this.store.levelUpTick() + 1);
        }
        this.persist.saveFrom(this.store);
    }

    // --------- Stats points ---------

    canSpendPoint(): boolean {
        return (this.store.player().unspentStatPoints ?? 0) > 0;
    }

    addStat(stat: StatKey): boolean {
        const p = this.store.player();
        if ((p.unspentStatPoints ?? 0) <= 0) return false;

        const nextStats = { ...p.stats, [stat]: (p.stats as any)[stat] + 1 };

        let nextHealth = p.currentHealth;
        if (stat === 'vitality') {
            const newMax = nextStats.vitality;
            if (nextHealth > newMax) nextHealth = newMax;
        }

        this.store.player.set({
            ...p,
            unspentStatPoints: (p.unspentStatPoints ?? 0) - 1,
            stats: nextStats,
            currentHealth: nextHealth,
        });

        this.persist.saveFrom(this.store);
        return true;
    }

    // Add several stat points at once
    addStatBulk(stat: StatKey, count: number): number {
        const n = Math.max(0, Math.floor(count));
        if (n === 0) return 0;

        let spent = 0;
        for (; spent < n; spent++) {
            if (!this.addStat(stat)) break;
        }
        return spent;
    }

    // --------- Heal / Rest ---------

    fullHeal(): void {
        const p = this.store.player();
        const maxHP = p.stats.vitality;
        if (p.currentHealth >= maxHP) return;
        this.store.player.set({ ...p, currentHealth: maxHP });
        this.persist.saveFrom(this.store);
    }

    // Partial Heal
    heal(amount: number): number {
        const inc = Math.max(0, Math.floor(amount));
        if (inc === 0) return 0;

        const p = this.store.player();
        const maxHP = p.stats.vitality;
        const next = Math.min(maxHP, p.currentHealth + inc);
        const healed = next - p.currentHealth;
        if (healed <= 0) return 0;

        this.store.player.set({ ...p, currentHealth: next });
        this.persist.saveFrom(this.store);
        return healed;
    }
}
