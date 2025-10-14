import { Component, computed, effect, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../game.service';

@Component({
  selector: 'app-forest',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forest.component.html',
  styleUrls: ['./forest.component.scss'],
})
export class ForestComponent {
  showLevelUp = signal(false);
  private lastLevelUpTick = 0;

  constructor(public game: GameService, private zone: NgZone) {

    this.lastLevelUpTick = this.game.levelUpTick();

    effect(() => {
      const t = this.game.levelUpTick();
      console.debug('[levelUpTick]', t);
      if (t > this.lastLevelUpTick) {
        this.zone.run(() => {
          this.showLevelUp.set(true);
          setTimeout(() => this.showLevelUp.set(false), 1500);
        });
        this.lastLevelUpTick = t;
      }
    });
  }

  playerHpPct = computed(() =>
    Math.max(0, Math.min(
      100,
      (this.game.player().currentHealth / this.game.player().stats.vitality) * 100
    ))
  );
}