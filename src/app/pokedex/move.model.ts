export type MoveCategory = 'Physique' | 'Spécial' | 'Statut' | string;

export type TargetPreset = 'adjacent-one' | 'adjacent-foes-all' | 'adjacent-all' | 'all-one' | 'self';
export type TargetCell = 'FOE_L'|'FOE_C'|'FOE_R'|'SELF'|'ALLY_L'|'ALLY_R';

export interface Move {
  id: number;
  slug: string;
  name: string;
  type: string;
  category: MoveCategory;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  priority?: number | null;
  shortDesc?: string | null;
  desc?: string | null;
  effect?: string | null;
  makesContact?: boolean;
  critRate?: string | null;

  targetPreset?: TargetPreset;
  targetPattern?: TargetCell[];

}