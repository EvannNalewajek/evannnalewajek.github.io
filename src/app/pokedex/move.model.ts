export type MoveCategory = 'Physique' | 'Spéciale' | 'Statut' | 'Physical' | 'Special' | 'Status';

export interface Move {
  id: number;
  name: string;
  type: string;
  category: MoveCategory;
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
  priority?: number | null;
  shortDesc?: string;
  desc?: string;
  target?: string;
  makesContact?: boolean;
}
