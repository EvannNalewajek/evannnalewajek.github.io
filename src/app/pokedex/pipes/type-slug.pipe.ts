import { Pipe, PipeTransform } from '@angular/core';
import { PokemonType } from '../models/pokemon.model';

@Pipe({ name: 'typeSlug', standalone: true })
export class TypeSlugPipe implements PipeTransform {
  transform(t: PokemonType): string {
    return t
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
