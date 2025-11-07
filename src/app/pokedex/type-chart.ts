import { PokemonType } from './models/pokemon.model';

const T: PokemonType[] = [
  'Normal','Feu','Eau','Plante','Électrik','Glace','Combat','Poison','Sol',
  'Vol','Psy','Insecte','Roche','Spectre','Dragon','Ténèbres','Acier','Fée'
] as const;

type Mult = Record<PokemonType, Record<PokemonType, 0 | 0.5 | 1 | 2>>;

function row(base: Partial<Record<PokemonType, 0|0.5|2>>): Record<PokemonType, 0|0.5|1|2> {
  const r: any = {};
  for (const d of T) r[d] = 1;
  for (const [k,v] of Object.entries(base)) r[k as PokemonType] = v as any;
  return r;
}

export const TYPE_MULTIPLIER: Mult = {
  Normal:   row({ Roche:0.5, Acier:0.5, Spectre:0 }),
  Feu:      row({ Plante:2, Glace:2, Insecte:2, Acier:2, Feu:0.5, Eau:0.5, Roche:0.5, Dragon:0.5 }),
  Eau:      row({ Feu:2, Sol:2, Roche:2, Eau:0.5, Plante:0.5, Dragon:0.5 }),
  Plante:   row({ Eau:2, Sol:2, Roche:2, Feu:0.5, Plante:0.5, Poison:0.5, Vol:0.5, Insecte:0.5, Dragon:0.5, Acier:0.5 }),
  Électrik: row({ Eau:2, Vol:2, Plante:0.5, Électrik:0.5, Dragon:0.5, Sol:0 }),
  Glace:    row({ Plante:2, Sol:2, Vol:2, Dragon:2, Feu:0.5, Eau:0.5, Glace:0.5, Acier:0.5 }),
  Combat:   row({ Normal:2, Glace:2, Roche:2, Ténèbres:2, Acier:2, Poison:0.5, Vol:0.5, Psy:0.5, Insecte:0.5, Fée:0.5, Spectre:0 }),
  Poison:   row({ Plante:2, Fée:2, Poison:0.5, Sol:0.5, Roche:0.5, Spectre:0.5, Acier:0 }),
  Sol:      row({ Feu:2, Électrik:2, Poison:2, Roche:2, Acier:2, Plante:0.5, Insecte:0.5, Vol:0 }),
  Vol:      row({ Plante:2, Combat:2, Insecte:2, Roche:0.5, Acier:0.5, Électrik:0.5 }),
  Psy:      row({ Combat:2, Poison:2, Psy:0.5, Acier:0.5, Ténèbres:0 }),
  Insecte:  row({ Plante:2, Psy:2, Ténèbres:2, Feu:0.5, Combat:0.5, Poison:0.5, Vol:0.5, Spectre:0.5, Acier:0.5, Fée:0.5 }),
  Roche:    row({ Feu:2, Glace:2, Vol:2, Insecte:2, Combat:0.5, Sol:0.5, Acier:0.5 }),
  Spectre:  row({ Psy:2, Spectre:2, Ténèbres:0.5, Normal:0 }),
  Dragon:   row({ Dragon:2, Acier:0.5, Fée:0 }),
  Ténèbres: row({ Psy:2, Spectre:2, Combat:0.5, Ténèbres:0.5, Fée:0.5 }),
  Acier:    row({ Glace:2, Roche:2, Fée:2, Feu:0.5, Eau:0.5, Électrik:0.5, Acier:0.5 }),
  Fée:      row({ Combat:2, Dragon:2, Ténèbres:2, Feu:0.5, Poison:0.5, Acier:0.5 })
};