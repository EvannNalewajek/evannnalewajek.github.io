import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecruitService } from '../../core/services/recruit.service';
import { MissionTemplate, Recruit, TrainingType } from '../../models';
import { missionSuccessChance, missionDurationSeconds } from '../../core/data/recruits.constants';
import { GameFacadeService } from '../../core/game-facade.service';

@Component({
  selector: 'app-recruits',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="dex-scene">
    <div class="dex-card">
      <div class="dex-header">
        <h1>Recrues</h1>
        <div class="slots" [class.limit-hit]="!canRecruit()">
          {{ recruitsCount() }} / {{ recruitSlots() }} Recrues
        </div>
      </div>

      <div class="dex-body">
        <div class="toolbar">
          <button
            (click)="recruitOne()"
            [disabled]="!canRecruit()"
            title="Recruter une nouvelle recrue"
          >
            + Recrue
          </button>
        </div>

        <div class="recruits">
          <div class="card" *ngFor="let r of rs.recruits()">
            <div class="head">
              <strong>{{ r.name }}</strong>
              <span class="badge" [class.idle]="r.status==='idle'">{{ r.status }}</span>
            </div>

            <div class="bars">
              <div class="row">
                <div class="label">PV</div>
                <div class="value">{{ r.hp }} / {{ r.stats.vitality }}</div>
              </div>
              <div class="bar bar--hp" aria-label="Points de vie">
                <div
                  class="fill"
                  [style.width.%]="100 * r.hp / r.stats.vitality"
                  [style.background]="hpColor(r)"
                ></div>
              </div>

              <div class="row det">
                <div class="label">Détermination</div>
                <div class="value">{{ r.det }} / {{ r.detMax }}</div>
              </div>

              <div class="stats">
                FOR {{r.stats.strength}} · RES {{r.stats.resilience}} · VIT {{r.stats.vitality}}
                · AUR {{r.stats.aura}} · MEN {{r.stats.mental}}
              </div>
            </div>

            <ng-container [ngSwitch]="r.status">
              <div *ngSwitchCase="'on-mission'">
                <div>Mission: {{ r.mission?.title }}</div>

                <div class="row">
                  <div class="label">Progression</div>
                  <div class="value">{{ (r.mission?.progress ?? 0) * 100 | number:'1.0-0' }}%</div>
                </div>
                <div class="bar bar--progress" aria-label="Progression de mission">
                  <div class="fill" [style.width.%]="100*(r.mission?.progress ?? 0)"></div>
                </div>

                <div class="eta">ETA: {{ r.mission?.eta | date:'shortTime' }}</div>
                <button (click)="cancelMission(r.id)">Interrompre</button>
              </div>

              <div *ngSwitchCase="'training'">
                <div>Entraînement: {{ r.training?.type }}</div>

                <div class="row">
                  <div class="label">Progression</div>
                  <div class="value">{{ trainingProgressPct(r) | number:'1.0-0' }}%</div>
                </div>
                <div class="bar bar--train" aria-label="Progression de l'entraînement">
                  <div class="fill" [style.width.%]="trainingProgressPct(r)"></div>
                </div>

                <div class="eta">ETA: {{ r.training?.eta | date:'shortTime' }}</div>
                <button (click)="cancelTraining(r.id)">Interrompre</button>
              </div>

              <div *ngSwitchCase="'resting'">
                <div class="row">
                  <div class="label">Repos</div>
                  <div class="value">ETA: {{ r.rest?.eta | date:'shortTime' }}</div>
                </div>
                <div class="bar bar--rest" aria-label="Progression du repos">
                  <!-- Variante A (width) :
                  <div class="fill" [style.width.%]="restProgressPct(r)"></div>
                  -->
                  <!-- Variante B (transform pour un rendu plus propre) : -->
                  <div class="fill" [style.transform]="'scaleX(' + (restProgressPct(r)/100) + ')'"></div>
                </div>
                <button (click)="stopRest(r.id)">Réveiller</button>
              </div>

              <div *ngSwitchDefault>
                <div class="actions">
                  <button (click)="openMission(r)">Envoyer en mission</button>
                  <button (click)="openTraining(r)">Entraîner</button>
                  <button (click)="startRest(r.id)" [disabled]="r.hp>=r.stats.vitality">Repos</button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Panneaux simples (placeholder modals) -->
        <div class="panel" *ngIf="panelRecruit() && panelMode()==='mission'">
          <h3>Choisir une mission</h3>

          <div class="mission-list">
            <button
              *ngFor="let m of missions"
              class="mission-item"
              (click)="startMission(panelRecruit()!.id, m)"
            >
              <div class="mi-title">{{ m.title }}</div>
              <div class="mi-meta">
                <span>Diff {{ m.difficulty }}</span>
                <span>🟡 {{ m.goldReward }}</span>
                <span class="mi-chance" [class]="chanceClass(successChance(panelRecruit()!, m))"
                      title="Probabilité de succès (cap 90%)">
                  {{ successChance(panelRecruit()!, m) }}%
                </span>
                <span title="Durée estimée (réduction via Force)">
                  ⏱ {{ fmtClock(missionDurationSec(panelRecruit()!, m)) }}
                </span>
              </div>
            </button>
          </div>

          <button (click)="closePanel()">Fermer</button>
        </div>

        <div class="panel" *ngIf="panelRecruit() && panelMode()==='training'">
          <h3>Choisir un entraînement (coût 4 DET)</h3>
          <button *ngFor="let t of trainingTypes" (click)="startTraining(panelRecruit()!.id, t)">
            {{ t }}
          </button>
          <button (click)="closePanel()">Fermer</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .dex-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
    .slots { font-weight:800; }
    .slots.limit-hit { color:#c01818; }

    .toolbar { display:flex; gap:.5rem; margin-bottom:1rem; }
    .recruits { display:grid; gap:.75rem; }
    .card { border:2px solid #b5b7ba; border-radius:12px; padding:.75rem; background:#f7fbfe; }
    .head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; }
    .badge { padding:.1rem .5rem; border-radius:.5rem; background:#d0e7ff; text-transform:uppercase; font-size:.75rem; }
    .badge.idle { background:#e8ffe8; }

    /* Lignes label / valeur */
    .row { display:flex; justify-content:space-between; gap:.75rem; margin:.25rem 0 .35rem; font-weight:600; }
    .row .label { opacity:.85; }
    .row.det { margin-top:.4rem; }

    /* Barres : base */
    .bar {
      position: relative;
      height: 10px;
      border-radius: 6px;
      overflow: hidden;
      background: #e9edf2;             /* fond neutre par défaut */
      border: 1px solid #cfd6df;
    }
    .bar .fill {
      height: 100%;
      width: 0%;
      transition: width .25s ease, transform .25s ease;
    }

    /* PV : couleur unie (définie inline via hpColor) */
    .bar--hp .fill {
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.05);
    }

    /* Progression mission : multicolore (on garde l'effet) */
    .bar--progress .fill {
      background: linear-gradient(90deg, #8bff95, #ffe26b, #ffa46b, #ff5b5b);
    }

    /* Entraînement : barre bleue douce */
    .bar--train {
      background: #e9f2ff;
      border-color: #c8daf8;
    }
    .bar--train .fill {
      background: linear-gradient(90deg, #9fc5ff, #6aa8ff);
    }

    /* Repos : rayures avec boucle parfaite (tuile 22px) + transform scaleX */
    .bar--rest { background: #eef3ff; border-color: #cfd9ff; }
    .bar--rest .fill {
      width: 100%;
      transform-origin: left center;
      background-color: #dfe7ff;
      background-image: linear-gradient(
        45deg,
        rgba(52, 73, 170, .20) 25%,
        transparent 25%,
        transparent 50%,
        rgba(52, 73, 170, .20) 50%,
        rgba(52, 73, 170, .20) 75%,
        transparent 75%,
        transparent 100%
      );
      background-size: 22px 22px;
      animation: restStripes 1s linear infinite;
      will-change: transform, background-position;
      box-shadow: inset -1px 0 0 rgba(0,0,0,.04);
    }
    @keyframes restStripes {
      to { background-position: 22px 0; }
    }

    .stats { margin-top:.4rem; }

    .actions { display:flex; gap:.5rem; flex-wrap:wrap; }
    .panel { position:fixed; right:1rem; bottom:1rem; background:white; border:2px solid #000; border-radius:12px; padding:1rem; box-shadow:0 8px 30px rgba(0,0,0,.2); }

    /* Missions panel */
    .mission-list { display: grid; gap: .5rem; margin: .5rem 0 0; }
    .mission-item { width: 100%; text-align: left; padding: .6rem .8rem; border: 2px solid #b5b7ba; border-radius: 10px; background: #f7fbfe; }
    .mi-title { font-weight: 800; margin-bottom: .2rem; }
    .mi-meta { display: flex; gap: .8rem; flex-wrap: wrap; font-weight: 600; }
    .mi-chance.good { color: #1a7f00; }
    .mi-chance.ok   { color: #c17a00; }
    .mi-chance.risk { color: #c01818; }
    .eta { margin-top:.25rem; opacity:.8; }
  `]
})
export class RecruitListComponent {
  rs = inject(RecruitService);
  facade = inject(GameFacadeService);

  // --- Slots / limitation
  recruitsCount = computed(() => this.rs.recruits().length);
  recruitSlots = () => {
    // supporte propriété ou méthode (selon ton impl)
    const any = this.facade as any;
    return typeof any.recruitSlots === 'function' ? any.recruitSlots() : (any.recruitSlots ?? 0);
  };
  canRecruit = () => this.recruitsCount() < this.recruitSlots();

  missions: MissionTemplate[] = [
    { id:'forest-scout', title:'Éclaireur de la Forêt', difficulty:1, baseDuration:300, goldReward:6 },
    { id:'boar-drive', title:'Repousser les Sangliers', difficulty:2, baseDuration:420, goldReward:10 },
    { id:'night-watch', title:'Veille Nocturne', difficulty:3, baseDuration:600, goldReward:16 },
    { id:'deep-woods', title:'Exploration du Bois Profond', difficulty:4, baseDuration:900, goldReward:28 },
  ];

  trainingTypes: TrainingType[] = ['strength','resilience','vitality','aura','mental'];

  private _panelRecruit = signal<Recruit | null>(null);
  panelRecruit = this._panelRecruit.asReadonly();
  private _panelMode = signal<'mission'|'training'|null>(null);
  panelMode = this._panelMode.asReadonly();

  recruitOne() {
    if (!this.canRecruit()) return;
    this.rs.addRecruit('Recrue');
  }

  debugPlus60() { this.rs.advanceTime(60); }

  openMission(r: Recruit) { this._panelRecruit.set(r); this._panelMode.set('mission'); }
  openTraining(r: Recruit) { this._panelRecruit.set(r); this._panelMode.set('training'); }
  closePanel() { this._panelRecruit.set(null); this._panelMode.set(null); }

  startMission(rid: string, m: MissionTemplate) { this.rs.startMission(rid, m); this.closePanel(); }
  cancelMission(rid: string) { this.rs.cancelMission(rid); }

  startTraining(rid: string, t: TrainingType) { this.rs.startTraining(rid, t); this.closePanel(); }
  cancelTraining(rid: string) { this.rs.cancelTraining(rid); }

  startRest(rid: string) { this.rs.startRest(rid); }
  stopRest(rid: string) { this.rs.stopRest(rid); }

  // ---- Helpers pour l'affichage de la réussite et de la durée ----
  successChance(r: Recruit, m: MissionTemplate): number {
    return Math.round(100 * missionSuccessChance(r.stats.mental, m.difficulty));
  }

  missionDurationSec(r: Recruit, m: MissionTemplate): number {
    return missionDurationSeconds(m.baseDuration, r.stats.strength);
  }

  fmtClock(totalSec: number): string {
    const mm = Math.floor(totalSec / 60);
    const ss = Math.floor(totalSec % 60);
    return `${mm}m ${ss.toString().padStart(2,'0')}s`;
  }

  chanceClass(pct: number): string {
    if (pct >= 80) return 'good';
    if (pct >= 60) return 'ok';
    return 'risk';
  }

  // ---- Helpers visuels PV & repos ----
  hpColor(r: Recruit): string {
    const ratio = Math.max(0, Math.min(1, r.hp / Math.max(1, r.stats.vitality)));
    const hue = Math.round(120 * ratio); // 0 (rouge) → 120 (vert)
    const sat = 70;
    const light = 45;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
    // Variante bicolore (sans HSL) :
    // return ratio > 0.5 ? '#59c057' : (ratio > 0.25 ? '#c9a22b' : '#d84a3a');
  }

  restProgressPct(r: Recruit): number {
    const rest = r.rest;
    if (!rest) return 0;
    const now = Date.now();
    const total = Math.max(1, rest.eta - rest.startedAt);
    const elapsed = Math.max(0, now - rest.startedAt);
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }

  // Progression entraînement
  trainingProgressPct(r: Recruit): number {
    const tr = r.training;
    if (!tr) return 0;
    const now = Date.now();
    const total = Math.max(1, tr.eta - tr.startedAt);
    const elapsed = Math.max(0, now - tr.startedAt);
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }
}