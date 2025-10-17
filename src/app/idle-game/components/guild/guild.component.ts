import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameFacadeService } from '../../core/game-facade.service';
import { Player } from '../../models';

type Stats = Player['stats'];
type StatKey = keyof Stats;

@Component({
  selector: 'app-guild',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guild.component.html',
  styleUrls: ['./guild.component.scss'],
})
export class GuildComponent {
    constructor(public game: GameFacadeService) {}

    Math = Math;

    readonly STAT_ENTRIES: Array<{
        key: StatKey;
        label: string;
        info: string;
    }> = [
        {
        key: 'strength',
        label: 'Force',
        info: 'Augmente les dégâts infligés par tes attaques manuelles.',
        },
        {
        key: 'resilience',
        label: 'Résilience',
        info: 'Réduit les dégâts subis (plafonné par l’équilibrage du jeu).',
        },
        {
        key: 'vitality',
        label: 'Vitalité',
        info: 'Augmente les PV max. Les PV actuels sont ajustés si besoin.',
        },
        {
        key: 'aura',
        label: 'Aura',
        info: 'Renforce les dégâts infligés automatiquement par seconde.',
        },
        {
        key: 'mental',
        label: 'Mental',
        info: 'Accélère la cadence des attaques automatiques.',
        },
    ];

    get availablePoints(): number {
        return this.game.player().unspentStatPoints ?? 0;
    }
    
    bulkCount(): number {
        const ap = this.availablePoints;
        return Math.max(2, Math.min(5, ap));
    }

    investOne(stat: StatKey): void {
        if (this.availablePoints > 0) {
            this.game.addStat(stat);
        }
    }

    investBulk(stat: StatKey): void {
        const n = Math.min(5, this.availablePoints);
        if (n >= 2) {
            this.game.addStatBulk(stat, n);
        }
    }

    getStatValue(statKey: StatKey): number {
        return this.game.player().stats[statKey] ?? 0;
    }

    getAllocatedStatValue(statKey: StatKey): number {
        return this.game.player().spentStats?.[statKey] ?? 0;
    }
}