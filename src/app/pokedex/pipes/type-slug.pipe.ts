import { Pipe, PipeTransform } from '@angular/core';
import { PokemonType } from '../models/pokemon.model';
import { slugify } from '../utils/slugify';

@Pipe({ name: 'typeSlug', standalone: true })
export class TypeSlugPipe implements PipeTransform {
  transform(t: PokemonType | string | null | undefined): string {
    return slugify(t);
  }
}
