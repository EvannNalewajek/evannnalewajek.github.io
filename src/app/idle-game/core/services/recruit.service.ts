import { Injectable, computed, inject } from '@angular/core';
import { GameStore } from '../state/game.store';
import { PersistenceService } from './persistence.service';
import { Recruit, MissionTemplate, ActiveMission, ActiveTraining, ActiveRest, TrainingType } from '../../models';
import {
    missionDurationSeconds, missionSuccessChance, missionFailDamage,
    RECRUIT_DET_MAX, TRAIN_COST_DET, TRAIN_DURATION_S,
    TRAIN_GREAT_CHANCE, TRAIN_INJURY_CHANCE, REST_MIN_PER_HP
        } from '../data/recruits.constants';

function now() { return Date.now(); }
function rand() { return Math.random(); }

@Injectable({ providedIn: 'root' })
export class RecruitService {
  private store = inject(GameStore);
  private persist = inject(PersistenceService);

  /** Lecture réactive (read-only) */
  recruits = computed(() => this.store.recruits());

  constructor() {
    // Tick léger; si tu as déjà un EngineService, bascule dessus.
    setInterval(() => this.tick(), 250);
  }

  // --------------------- Utils ---------------------
  private write(mutator: (list: Recruit[]) => Recruit[]) {
    const next = mutator(this.store.recruits());
    this.store.recruits.set(next);
    this.persist.saveFrom(this.store); // <<< sauvegarde globale
  }

  private replaceById(rid: string, updater: (r: Recruit) => Recruit | null) {
    this.write((list) => {
      const i = list.findIndex(r => r.id === rid);
      if (i < 0) return list;
      const updated = updater(list[i]);
      if (!updated) return list;
      const clone = [...list];
      clone[i] = updated;
      return clone;
    });
  }

  // --------------------- API publique ---------------------
  addRecruit(name: string, stats = { strength: 1, resilience: 1, vitality: 10, aura: 1, mental: 1 }): void {
    const r: Recruit = {
      id: crypto.randomUUID(),
      name,
      stats,
      hp: stats.vitality,
      det: 0,
      detMax: RECRUIT_DET_MAX,
      status: 'idle'
    };
    this.write(list => [...list, r]);
  }

  // --- Missions ---
  startMission(rid: string, tpl: MissionTemplate): void {
    this.replaceById(rid, (r) => {
      if (r.status !== 'idle') return r;
      const durationS = missionDurationSeconds(tpl.baseDuration, r.stats.strength);
      const sc = missionSuccessChance(r.stats.mental, tpl.difficulty);
      const start = now();
      const mission: ActiveMission = {
        templateId: tpl.id,
        title: tpl.title,
        startedAt: start,
        eta: start + durationS * 1000,
        progress: 0,
        successChance: sc,
        preRolled: rand(),
        difficulty: tpl.difficulty,
        goldReward: tpl.goldReward
      };
      return { ...r, status: 'on-mission', mission };
    });
  }

  cancelMission(rid: string): void {
    this.replaceById(rid, (r) => {
      if (r.status !== 'on-mission' || !r.mission) return r;
      return { ...r, status: 'idle', mission: undefined };
    });
  }

  // --- Entraînement ---
  startTraining(rid: string, type: TrainingType): void {
    this.replaceById(rid, (r) => {
      if (r.status !== 'idle' || r.det < TRAIN_COST_DET) return r;
      const start = now();
      const training: ActiveTraining = {
        type,
        startedAt: start,
        eta: start + TRAIN_DURATION_S * 1000,
        greatPerformance: rand() < TRAIN_GREAT_CHANCE,
        injury: rand() < TRAIN_INJURY_CHANCE
      };
      return { ...r, status: 'training', training, det: r.det - TRAIN_COST_DET };
    });
  }

  cancelTraining(rid: string): void {
    this.replaceById(rid, (r) => {
      if (r.status !== 'training' || !r.training) return r;
      return { ...r, status: 'idle', training: undefined };
    });
  }

  // --- Repos ---
  startRest(rid: string): void {
    this.replaceById(rid, (r) => {
      if (r.status !== 'idle') return r;
      const missing = Math.max(0, r.stats.vitality - r.hp);
      if (missing === 0) return r;
      const minutes = missing * REST_MIN_PER_HP;
      const start = now();
      const rest: ActiveRest = {
        startedAt: start,
        eta: start + minutes * 60_000,
        missingAtStart: missing
      };
      return { ...r, status: 'resting', rest };
    });
  }

  stopRest(rid: string): void {
    this.replaceById(rid, (r) => {
      if (r.status !== 'resting' || !r.rest) return r;
      const hp = this.computeRestedHp(r, now());
      return { ...r, hp, status: 'idle', rest: undefined };
    });
  }

  // --- Debug: avance de +seconds sur tous les timers ---
  advanceTime(seconds: number) {
    const dt = seconds * 1000;
    this.write((list) => list.map(r => {
      if (r.mission) { r = { ...r, mission: { ...r.mission, startedAt: r.mission.startedAt - dt, eta: r.mission.eta - dt } }; }
      if (r.training) { r = { ...r, training: { ...r.training, startedAt: r.training.startedAt - dt, eta: r.training.eta - dt } }; }
      if (r.rest) { r = { ...r, rest: { ...r.rest, startedAt: r.rest.startedAt - dt, eta: r.rest.eta - dt } }; }
      return r;
    }));
    this.tick(); // mise à jour immédiate
  }

  // --------------------- Tick & helpers ---------------------
  private tick() {
    const t = now();
    let changed = false;

    const next = this.store.recruits().map(r => {
      // Mission
      if (r.status === 'on-mission' && r.mission) {
        const dur = Math.max(1, r.mission.eta - r.mission.startedAt);
        const prog = Math.min(1, Math.max(0, (t - r.mission.startedAt) / dur));
        if (prog !== r.mission.progress) { r = { ...r, mission: { ...r.mission, progress: prog } }; changed = true; }
        if (r.status === 'on-mission' && r.mission) {
        let m = r.mission; // <-- alias typé ActiveMission

        const dur = Math.max(1, m.eta - m.startedAt);
        const prog = Math.min(1, Math.max(0, (t - m.startedAt) / dur));

        if (prog !== m.progress) {
            m = { ...m, progress: prog };
            r = { ...r, mission: m };
            changed = true;
        }

        if (t >= m.eta) {
            const success = m.preRolled < m.successChance;
            if (success) {
              const p = this.store.player();
              this.store.player.set({ ...p, gold: p.gold + (this.goldOf(m.templateId) ?? 0) })
              const det = Math.min(r.detMax, r.det + 1);
              r = { ...r, det, status: 'idle', mission: undefined };
            } else {
              const dmg = missionFailDamage(m.difficulty, r.stats.resilience);
              const hp = Math.max(0, r.hp - dmg);
              const det = Math.max(0, r.det - 1);
              r = { ...r, hp, det, status: 'idle', mission: undefined };
            }
            changed = true;
        }
        }
      }

      // Entraînement
      if (r.status === 'training' && r.training) {
        if (t >= r.training.eta) {
          const inc = r.training.greatPerformance ? 2 : 1;
          const s = { ...r.stats };
          s[r.training.type] = (s[r.training.type] ?? 0) + inc;

          let hp = r.hp;
          if (r.training.injury) {
            const wound = Math.max(1, Math.round(0.05 * s.vitality));
            hp = Math.max(0, hp - wound);
          }

          r = { ...r, stats: s, hp, status: 'idle', training: undefined };
          changed = true;
        }
      }

      // Repos
      if (r.status === 'resting' && r.rest) {
        if (t >= r.rest.eta) {
          r = { ...r, hp: r.stats.vitality, status: 'idle', rest: undefined };
          changed = true;
        } else {
          const hp = this.computeRestedHp(r, t);
          if (hp !== r.hp) { r = { ...r, hp }; changed = true; }
        }
      }

      return r;
    });

    if (changed) {
      this.store.recruits.set(next);
      this.persist.saveFrom(this.store); // <<< sauvegarde globale
    }
  }

  private computeRestedHp(r: Recruit, tNow: number): number {
    if (!r.rest) return r.hp;
    const elapsed = Math.max(0, tNow - r.rest.startedAt);
    const total = Math.max(1, r.rest.eta - r.rest.startedAt);
    const ratio = Math.min(1, elapsed / total);
    const recovered = Math.round(r.rest.missingAtStart * ratio);
    return Math.min(r.stats.vitality, r.stats.vitality - r.rest.missingAtStart + recovered);
  }

  // Si tu veux gérer la récompense ici, mappe l’id → gold
  private goldOf(templateId: string): number {
    // simpliste; si tu fournis la MissionTemplate au démarrage,
    // remplace par une table réelle. Ici par défaut :
    switch (templateId) {
      case 'forest-scout': return 6;
      case 'boar-drive':   return 10;
      case 'night-watch':  return 16;
      case 'deep-woods':   return 28;
      default: return 5;
    }
  }
}