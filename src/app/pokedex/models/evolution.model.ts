export type EvoTrigger =
  | { kind: 'level'; level: number; condition?: string }
  | { kind: 'item'; item: string; condition?: string }
  | { kind: 'friendship'; threshold?: number; condition?: string }
  | { kind: 'trade'; withItem?: string; condition?: string }
  | { kind: 'other'; text: string };

export interface EvolutionLink {
  from: number;
  to: number;
  trigger: EvoTrigger;
}

export interface EvolutionFamily {
  species: number[];
  links: EvolutionLink[];
}
export interface EvolutionDB {
  families: EvolutionFamily[];
}