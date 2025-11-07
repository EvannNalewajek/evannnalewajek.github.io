// moves.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';
import type { Move, TargetPreset, TargetCell, TMInfo } from '../models/move.model';

const VALID_CELLS: TargetCell[] = ['FOE_L','FOE_C','FOE_R','SELF','ALLY_L','ALLY_R'];

function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function asNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = +v;
  return Number.isFinite(n) ? n : null;
}

function normalizeCritRate(val: any): Move['critRate'] {
  if (val === null || val === undefined) return null;

  if (typeof val === 'number') {
    if (val >= 2) return 'very-high';
    if (val >= 1) return 'high';
    return 'normal';
  }
  if (typeof val === 'string') {
    const s = slugify(val).replace(/-/g, '');
    if (s.includes('veryhigh') || s.includes('++')) return 'very-high';
    if (s.includes('high') || s.includes('+') || s.includes('eleve')) return 'high';
    if (s.includes('normal')) return 'normal';
    return null;
  }
  return null;
}

function normalizeTarget(m: any): { preset?: TargetPreset; pattern?: TargetCell[] } {
  const presetRaw  = m.targetPreset ?? m.preset ?? m.target?.preset ?? m.target;
  const patternRaw = m.targetPattern ?? m.pattern ?? m.target?.pattern;

  if (Array.isArray(patternRaw)) {
    const pattern = (patternRaw as any[])
      .map(x => String(x).toUpperCase())
      .filter(x => VALID_CELLS.includes(x as TargetCell)) as TargetCell[];
    if (pattern.length) return { pattern };
  }

  if (
    presetRaw === 'adjacent-one'     ||
    presetRaw === 'adjacent-foes-all'||
    presetRaw === 'adjacent-all'     ||
    presetRaw === 'all-one'          ||
    presetRaw === 'self'
  ) {
    return { preset: presetRaw as TargetPreset };
  }

  const txt = typeof presetRaw === 'string' ? slugify(presetRaw) : '';

  if (txt === 'adjacentone')        return { preset: 'adjacent-one' };
  if (txt === 'adjacentfoesall' ||
      txt === 'adjacentfoes')       return { preset: 'adjacent-foes-all' };
  if (txt === 'adjacentall')        return { preset: 'adjacent-all' };
  if (txt === 'allone')             return { preset: 'all-one' };

  return {};
}

@Injectable({ providedIn: 'root' })
export class MovesService {
  private http = inject(HttpClient);
  private movesUrl = '/pokedex/moves.json';
  private tmsUrl   = '/pokedex/tms.json';

  private _moves$ = this.http.get<any>(this.movesUrl).pipe(
    map((raw) => {
      const list: any[] = Array.isArray(raw) ? raw : Object.values(raw || {});
      return list
        .map((m, i): Move => {
          const id: number =
            typeof m.id === 'number' ? m.id : (parseInt(String(m.id), 10) || i + 1);

          const slug: string = slugify(
            m.slug ?? m.url ?? m.name ?? m.nom ?? m.id ?? `move-${id}`
          );

          const { preset, pattern } = normalizeTarget(m);

          return {
            id,
            slug,
            name: m.name ?? m.nom ?? m.move ?? `Capacité ${id}`,
            type: m.type ?? m.typ ?? 'Normal',
            category: (m.category ?? m.cat ?? 'Statut') as Move['category'],
            power: asNumber(m.power ?? m.puissance),
            accuracy: asNumber(m.accuracy ?? m.precision),
            pp: asNumber(m.pp ?? m.PP),
            priority: asNumber(m.priority ?? m.prio) ?? 0,

            shortDesc: m.shortDesc ?? m.short_description ?? m.short ?? null,
            desc: m.desc ?? m.description ?? null,
            effect: m.effect ?? m.effet ?? null,

            makesContact: Boolean(m.makesContact ?? m.contact ?? false),
            critRate: normalizeCritRate(m.critRate ?? m.crit ?? m.tauxCrit),

            targetPreset: preset,
            targetPattern: pattern
          };
        })
        .sort((a, b) => a.id - b.id);
    }),
    shareReplay(1)
  );

  private _tms$ = this.http.get<TMInfo[]>(this.tmsUrl).pipe(
    map(arr => (Array.isArray(arr) ? arr : [])),
    shareReplay(1)
  );

  getAll() {
    return this._moves$;
  }
  getByUrl$(slug: string) {
    return this._moves$.pipe(map(list => list.find(m => m.slug === slug) ?? null));
  }
  getById$(id: number) {
    return this._moves$.pipe(map(list => list.find(m => m.id === id) ?? null));
  }

  getTMs$() {
    return this._tms$;
  }

  getTMtoMoveMap$() {
    return this._tms$.pipe(
      map(list => {
        const mp = new Map<string, string>();
        for (const t of list) {
          if (t.tm && t.move) mp.set(String(t.tm), String(t.move));
        }
        return mp;
      }),
      shareReplay(1)
    );
  }

  getMoveToTMsMap$() {
    return this._tms$.pipe(
      map(list => {
        const mp = new Map<string, string[]>();
        for (const t of list) {
          const m = String(t.move);
          const arr = mp.get(m) ?? [];
          arr.push(String(t.tm));
          mp.set(m, arr);
        }
        return mp;
      }),
      shareReplay(1)
    );
  }
}