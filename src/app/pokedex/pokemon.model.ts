export type PokemonType =
  | 'Normal' | 'Feu' | 'Eau' | 'Plante' | 'Électrik' | 'Glace'
  | 'Combat' | 'Poison' | 'Sol' | 'Vol' | 'Psy' | 'Insecte'
  | 'Roche' | 'Spectre' | 'Dragon' | 'Ténèbres' | 'Acier' | 'Fée';

export interface GenderRatio { male: number; female: number } // %
export type GenderInfo = GenderRatio | 'genderless';

export interface BaseStats {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

export interface PokemonImages {
  sprite: string;
  artwork: string;
}

export interface Pokemon {
  id: number;                 // pokedex number, starting with 1
  name: string;
  types: [PokemonType] | [PokemonType, PokemonType];
  category: string;
  abilities: string[];
  hiddenAbility?: string;
  height_m: number;
  weight_kg: number;
  genderRatio: GenderInfo;
  captureRate: number;
  images: PokemonImages;
  baseStats: BaseStats;
  description: string;
}
