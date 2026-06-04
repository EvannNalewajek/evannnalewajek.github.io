import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetectiveService } from '../services/detective.service';
import { NOIR_MOTIVES } from '../data/noir-data';

@Component({
  selector: 'app-notebook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notebook">
      <h2>Carnet de l'Inspecteur</h2>
      
      <div class="section">
        <h3>Le Crime</h3>
        <p>Victime : <strong>{{ service.mystery()?.victim?.name }}</strong></p>
        
        <div class="deduction-field">
          <label>Meurtrier présumé :</label>
          <select [ngModel]="service.state().playerDeductions.killerId" (ngModelChange)="update('killerId', $event)">
            <option value="">-- Inconnu --</option>
            @for (s of service.mystery()?.suspects; track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>

        <div class="deduction-field">
          <label>Arme du crime :</label>
          <select [ngModel]="service.state().playerDeductions.weaponId" (ngModelChange)="update('weaponId', $event)">
            <option value="">-- Inconnue --</option>
            @for (i of service.mystery()?.items; track i.id) {
              @if (i.canBeMurderWeapon) {
                <option [value]="i.id">{{ i.name }}</option>
              }
            }
          </select>
        </div>

        <div class="deduction-field">
          <label>Lieu du meurtre :</label>
          <select [ngModel]="service.state().playerDeductions.roomId" (ngModelChange)="update('roomId', $event)">
            <option value="">-- À déterminer --</option>
            @for (r of service.mystery()?.rooms; track r.id) {
              <option [value]="r.id">{{ r.name }}</option>
            }
          </select>
        </div>

        <div class="deduction-field">
          <label>Mobile suspecté :</label>
          <select [ngModel]="service.state().playerDeductions.motive" (ngModelChange)="update('motive', $event)">
            <option value="">-- À découvrir --</option>
            @for (m of motives; track m) {
              <option [value]="m">{{ m }}</option>
            }
          </select>
        </div>
      </div>

      <div class="section">
        <h3>Suspects et Alibis</h3>
        <div class="suspect-alibis">
          @for (suspect of service.mystery()?.suspects; track suspect.id) {
            <div class="alibi-entry">
              <span class="status-icon" [class.interrogated]="hasInterrogated(suspect.id)">
                {{ hasInterrogated(suspect.id) ? '✅' : '❓' }}
              </span>
              <span class="name">{{ suspect.name }} :</span>
              <span class="location">{{ getAlibiText(suspect.id) }}</span>
            </div>
          }
        </div>
      </div>

      <div class="section">
        <h3>Indices trouvés</h3>
        @if (service.state().discoveredClues.length > 0) {
          <ul>
            @for (clue of service.state().discoveredClues; track clue.id) {
              <li>{{ clue.name }} : {{ clue.description }}</li>
            }
          </ul>
        } @else {
          <p class="empty">Aucun indice probant pour le moment.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .notebook {
      background: #fdf6e3;
      color: #333;
      padding: 1.5rem;
      border: 1px solid #ccc;
      box-shadow: 5px 5px 0 #333;
      font-family: 'Courier New', Courier, monospace;
      height: 100%;
      overflow-y: auto;
    }
    h2 { border-bottom: 2px solid #333; margin-top: 0; padding-bottom: 0.5rem; }
    h3 { font-size: 1rem; text-decoration: underline; margin-top: 1.5rem; }
    p { font-size: 0.9rem; margin: 0.5rem 0; }
    
    .deduction-field {
      margin-top: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .deduction-field label { font-size: 0.75rem; font-weight: bold; color: #666; }
    .deduction-field select {
      background: rgba(0,0,0,0.05);
      border: none;
      border-bottom: 1px solid #999;
      font-family: inherit;
      font-size: 0.85rem;
      padding: 0.2rem;
      color: #333;
    }

    .suspect-alibis { display: flex; flex-direction: column; gap: 0.5rem; }
    .alibi-entry { font-size: 0.8rem; line-height: 1.2; }
    .name { font-weight: bold; }
    .location { font-style: italic; margin-left: 0.5rem; }
    ul { padding-left: 1.2rem; }
    li { font-size: 0.8rem; margin-bottom: 0.5rem; }
    .empty { color: #888; font-style: italic; }
  `]
})
export class NotebookComponent {
  service = inject(DetectiveService);
  motives = NOIR_MOTIVES;

  update(field: any, value: string) {
    this.service.updatePlayerDeduction(field, value);
  }

  getAlibiText(charId: string): string {
    const alibi = this.service.mystery()?.alibis.find(a => a.characterId === charId);
    const room = this.service.mystery()?.rooms.find(r => r.id === alibi?.locationId);
    const roomName = room?.name || 'Inconnu';

    if (!this.hasInterrogated(charId)) return 'Témoignage non recueilli';

    const phrases = [
      `Prétend s'être trouvé dans : ${roomName}`,
      `Affirme avoir été à : ${roomName}`,
      `Déclare être resté à : ${roomName}`,
      `Lieu cité pour l'alibi : ${roomName}`
    ];
    return phrases[charId.length % phrases.length];
  }

  hasInterrogated(charId: string): boolean {
    const history = this.service.state().interrogationHistory;
    return !!(history[charId] && history[charId].length > 0);
  }
}
