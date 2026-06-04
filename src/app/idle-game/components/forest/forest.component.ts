import { Component, computed, effect, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameFacadeService } from '../../core/game-facade.service';

type ToastItem = {
  type: 'level' | 'quest';
  message: string;
  duration?: number;
}

@Component({
  selector: 'app-forest',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forest.component.html',
  styleUrls: ['./forest.component.scss'],
})

export class ForestComponent {

  // Queue
  private toastsQueue = signal<ToastItem[]>([]);
  currentToast = signal<ToastItem | null>(null);
  private processingToast = false;

  isShaking = signal(false);

  // Prevent repetition
  private lastLevelUpTick = 0;
  private lastQuestTick = 0;

  constructor(public game: GameFacadeService, private zone: NgZone) {

    this.lastLevelUpTick = this.game.levelUpTick();
    this.lastQuestTick = this.game.questCompleteTick();

    effect(() => {
      const t = this.game.levelUpTick();
      if (t > this.lastLevelUpTick) {
        this.enqueueToast({
          type: 'level',
          message: `🎉 Niveau ${this.game.player().level} atteint !`,
          duration: 1500,
        });
        this.lastLevelUpTick = t;
      }
    });

    effect(() => {
      const tick = this.game.questCompleteTick();
      if (tick > this.lastQuestTick) {
        const q = this.game.lastCompletedQuest();
        if (q) {
          this.enqueueToast({
            type: 'quest',
            message: `Quête complétée — ${q.count} × ${q.enemyType} (+${q.goldReward} or)`,
            duration: 1500,
          });
        }
        this.lastQuestTick = tick;
      }
    });
  }

  private enqueueToast(item: ToastItem) {
    this.toastsQueue.update(q => [...q, item]);
    this.processQueue();
  }

  private processQueue() {
    if (this.processingToast) return;
    const next = this.toastsQueue()[0];
    if (!next) return;

    this.processingToast = true;
    this.currentToast.set(next);

    const dur = next.duration ?? 1500;

    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => {
          this.currentToast.set(null);
          this.toastsQueue.update(q => q.slice(1));
          this.processingToast = false;

          // Wait before next animation
          setTimeout(() => this.processQueue(), 60);
        });
      }, dur);
    });
  }

  playerHpPct = computed(() => {
    const p = this.game.player();
    if (!p) return 0;
    return Math.max(0, Math.min(100, (p.currentHealth / p.stats.vitality) * 100));
  });

  enemyHpPct = computed(() => {
    const e = this.game.currentEnemy();
    if (!e) return 0;
    return Math.max(0, Math.min(100, (e.currentHealth / e.baseHealth) * 100));
  });

  clickAttack() {
    this.game.clickAttack();
    this.triggerShake();
  }

  private triggerShake() {
    this.isShaking.set(true);
    setTimeout(() => this.isShaking.set(false), 100);
  }
}
