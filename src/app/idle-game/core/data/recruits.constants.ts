export const RECRUIT_DET_MAX = 10;
export const TRAIN_COST_DET = 4;

export const REST_MIN_PER_HP = 2;          // 2 min par PV manquant
export const MISSION_MAX_SUCCESS = 0.9;    // cap 90%

// Chances d’entraînement
export const TRAIN_GREAT_CHANCE = 0.12;    // ~12% d’excellente perf
export const TRAIN_INJURY_CHANCE = 0.10;   // ~10% de blessure
export const TRAIN_DURATION_S = 180;       // 3 minutes par entraînement (modulable)

// Mitigation via resilience (reprend ta philo cap 50%)
export const RESILIENCE_MAX_REDUCTION = 0.5;
export const RESILIENCE_PER_POINT = 0.03;  // 3% par point (cap 50%)

// Vitesse mission via strength (plus de force => plus rapide)
export function missionDurationSeconds(baseSeconds: number, strength: number): number {
  // Ex: chaque point de force accélère de 10% (1/(1+0.1*str))
  return Math.max(10, Math.round(baseSeconds / (1 + 0.10 * strength)));
}

export function missionSuccessChance(mental: number, difficulty: number): number {
  const p = 0.6 + 0.05 * (mental - difficulty);
  return Math.max(0.05, Math.min(MISSION_MAX_SUCCESS, p));
}

// Dégâts sur échec de mission, selon difficulté et resilience
export function missionFailDamage(difficulty: number, resilience: number): number {
  const raw = 5 + 3 * difficulty; // échelle simple
  const reduction = Math.min(RESILIENCE_MAX_REDUCTION, resilience * RESILIENCE_PER_POINT);
  return Math.ceil(raw * (1 - reduction));
}
