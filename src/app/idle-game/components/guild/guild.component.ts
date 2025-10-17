import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameFacadeService } from '../../core/game-facade.service';
import { Player } from '../../models';

@Component({
    selector: 'app-guild',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './guild.component.html',
    styleUrls: ['./guild.component.scss'],
})

export class GuildComponent {
    constructor(public game: GameFacadeService) {}

    nextLevelExp = computed(() => this.game.getExperienceForLevel(this.game.player().level));

    addStat(stat: keyof Player['stats']) {
        const p = this.game.player();
        if (p.unspentStatPoints <= 0) return;
        const stats = { ...p.stats, [stat]: p.stats[stat] + 1 };

        let currentHealth = p.currentHealth;
        if (stat === 'vitality') currentHealth = stats.vitality;

        this.game.player.set({
            ...p,
            stats,
            unspentStatPoints: p.unspentStatPoints - 1,
            currentHealth,
        });
    }


}