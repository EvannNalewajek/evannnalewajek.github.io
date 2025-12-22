// learnsets.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, of, shareReplay, switchMap } from 'rxjs';
import type { Move, TMInfo, PokemonLearnset, MoveIndex } from '../models/move.model';
import { MovesService } from './moves.service';

export interface ResolvedLevelUp {
  level: number | 'Départ';
  levelSort: number;
  moveSlug: string;
  moveName: string;
  moveType: string;
  moveCategory: Move['category'];
  power?: number | null;
  accuracy?: number | null;
  pp?: number | null;
}

export interface ResolvedTM {
  tm: string;
  moveSlug: string;
  moveName: string;
  moveType: string;
  moveCategory: Move['category'];
}

export interface ResolvedEgg {
  moveSlug: string;
  moveName: string;
  moveType: string;
  moveCategory: Move['category'];
}

export interface ResolvedLearnset {
  id: number;
  slug: string;
  levelUp: ResolvedLevelUp[];
  tm: ResolvedTM[];
  egg: ResolvedEgg[];
}

export interface PokemonByMoveEntry {
  id: number;
  method: 'level' | 'tm' | 'egg';
  level?: number;
  tm?: string;
}

@Injectable({ providedIn: 'root' })
export class LearnsetsService {
  private http = inject(HttpClient);
  private moves = inject(MovesService);

  private base = '/pokedex/learnsets';

  private _moveIndex$ = this.http.get<MoveIndex>(`${this.base}/move-index.json`).pipe(
    map(idx => idx ?? {}),
    shareReplay(1)
  );

  getPokemonLearnset$(id: number) {
    return this.http.get<PokemonLearnset>(`${this.base}/pokemon/${id}.json`).pipe(
      map(ls => ({
        id: Number(ls.id),
        slug: String(ls.slug ?? ''),
        levelUp: Array.isArray(ls.levelUp) ? ls.levelUp : [],
        tm: Array.isArray(ls.tm) ? ls.tm : [],
        egg: Array.isArray(ls.egg) ? ls.egg : []
      }))
    );
  }

  getMoveIndex$() {
    return this._moveIndex$;
  }

  getPokemonByMove$(moveSlug: string) {
    return this._moveIndex$.pipe(
      map(idx => (idx[moveSlug] ?? []) as PokemonByMoveEntry[])
    );
  }

  getResolvedLearnsetForPokemon$(id: number) {
    return combineLatest([
      this.getPokemonLearnset$(id),
      this.moves.getAll(),
      this.moves.getTMtoMoveMap$()
    ]).pipe(
      map(([ls, moves, tmToMove]) => {
        const bySlug = new Map<string, Move>(moves.map(m => [m.slug, m]));

        const levelUp: ResolvedLevelUp[] = (ls.levelUp ?? [])
        .map(e => {
          const mv = bySlug.get(e.move);

          const raw = (e as any).level;

          const isStart =
            typeof raw === 'string' && raw.trim().toLowerCase() === 'départ';

          const level: number | 'Départ' = isStart ? 'Départ' : Number(raw);

          const levelSort = isStart ? 0 : (Number.isFinite(Number(raw)) ? Number(raw) : 9999);

          return {
            level,
            levelSort,
            moveSlug: e.move,
            moveName: mv?.name ?? e.move,
            moveType: mv?.type ?? 'Normal',
            moveCategory: (mv?.category ?? 'Statut') as Move['category'],
            power: mv?.power ?? null,
            accuracy: mv?.accuracy ?? null,
            pp: mv?.pp ?? null
          };
        })
        .sort((a, b) => a.levelSort - b.levelSort);

        const tm: ResolvedTM[] = (ls.tm ?? [])
          .map(code => {
            const slug = tmToMove.get(code);
            const mv = slug ? bySlug.get(slug) : undefined;
            return {
              tm: code,
              moveSlug: slug ?? '',
              moveName: mv?.name ?? (slug ?? ''),
              moveType: mv?.type ?? 'Normal',
              moveCategory: (mv?.category ?? 'Statut') as Move['category']
            };
          })
          .sort((a, b) => a.tm.localeCompare(b.tm, 'fr'));

        const egg: ResolvedEgg[] = (ls.egg ?? [])
          .map(slug => {
            const mv = bySlug.get(slug);
            return {
              moveSlug: slug,
              moveName: mv?.name ?? slug,
              moveType: mv?.type ?? 'Normal',
              moveCategory: (mv?.category ?? 'Statut') as Move['category']
            };
          })
          .sort((a, b) => a.moveName.localeCompare(b.moveName, 'fr'));

        const resolved: ResolvedLearnset = {
          id: ls.id,
          slug: ls.slug,
          levelUp,
          tm,
          egg
        };
        return resolved;
      }),
      shareReplay(1)
    );
  }
}