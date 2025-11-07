import { PokemonType } from './pokemon.model';

export interface TypeInfo {
  name: PokemonType;
  slug: string;
  color: string;
  characteristics: string[];
}