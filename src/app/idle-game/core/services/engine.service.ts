import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CombatService } from './combat.service';
import { PersistenceService } from './persistence.service';
import { GameStore } from '../state/game.store';

const DELTA_CAP_SECONDS = 0.25; // Avoid sudden jumps of interface after tab inactivity
const AUTOSAVE_MS = 45000;      // 45s

@Injectable({ providedIn: 'root' })
export class EngineService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private rafId: number | null = null;
    private lastTs = 0;
    private running = false;

    private autosaveHandle: any = null;
    private boundOnVisibility = this.onVisibilityChange.bind(this);

    constructor(
        private combat: CombatService,
        private persist: PersistenceService,
        private store: GameStore,
    ) {}

    start(): void {
        if (!this.isBrowser || this.running) return;

        this.running = true;
        this.lastTs = 0;

        // Boucle principale
        const loop = (ts: number) => {
        if (!this.running) return;

        if (!this.lastTs) this.lastTs = ts;
        let delta = (ts - this.lastTs) / 1000;
        this.lastTs = ts;

        if (delta > DELTA_CAP_SECONDS) delta = DELTA_CAP_SECONDS;

        this.combat.tick(delta);

        this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
        document.addEventListener('visibilitychange', this.boundOnVisibility, false);

        // Autosave optionnel
        if (AUTOSAVE_MS > 0 && !this.autosaveHandle) {
        this.autosaveHandle = setInterval(() => this.persist.saveFrom(this.store), AUTOSAVE_MS);
        }
    }

    stop(): void {
        if (!this.isBrowser || !this.running) return;

        this.running = false;

        if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        }
        this.lastTs = 0;

        document.removeEventListener('visibilitychange', this.boundOnVisibility, false);

        if (this.autosaveHandle) {
        clearInterval(this.autosaveHandle);
        this.autosaveHandle = null;
        }
    }

    // -----------------------
    // Internals
    // -----------------------

    private onVisibilityChange(): void {
        if (document.hidden) {
            if (this.rafId !== null) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.lastTs = 0;
            } else {
            if (this.running && this.rafId === null) {
                this.rafId = requestAnimationFrame((ts) => {
                this.lastTs = 0;
                const loop = (t: number) => {
                    if (!this.running) return;
                    if (!this.lastTs) this.lastTs = t;
                    let delta = (t - this.lastTs) / 1000;
                    this.lastTs = t;
                    if (delta > DELTA_CAP_SECONDS) delta = DELTA_CAP_SECONDS;
                    this.combat.tick(delta);
                    this.rafId = requestAnimationFrame(loop);
                };
                loop(ts);
                });
            }
        }
    }
}
