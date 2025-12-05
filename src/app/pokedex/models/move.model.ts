export type MoveCategory = 'Physique' | 'Spécial' | 'Statut' | string;

export type TargetPreset = 'adjacent-one' | 'adjacent-foes-all' | 'adjacent-all' | 'all-one' | 'all-allies' | 'all-ennemies' | 'variable' | 'all' | 'self';
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

  tables?: MoveTable[];
}

export interface MoveTableColumn {
  key: string;
  label: string;
}

export interface MoveTable {
  id: string;
  title?: string;
  caption?: string;
  columns: MoveTableColumn[];
  rows: Array<Record<string, string | number>>;
}

export interface TMInfo {
  tm: string;
  move: string;
}

export interface PokemonLearnset {
  id: number;
  slug: string;
  levelUp: { level: number; move: string }[];
  tm: string[];
  egg: string[];
}

export type MoveIndex = Record<string, {
  id: number;
  method: 'level' | 'tm' | 'egg';
  level?: number;
  tm?: string;
}[]>;
