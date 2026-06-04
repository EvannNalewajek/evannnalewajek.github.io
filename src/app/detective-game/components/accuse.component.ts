import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DetectiveService } from '../services/detective.service';

@Component({
  selector: 'app-accuse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accuse-container">
      <h2>Accusation Formelle</h2>
      <p>L'Inspecteur Henderson attend votre rapport. Soyez sûr de vous.</p>

      <form (submit)="onSubmit($event)">
        <div class="field">
          <label>Le Coupable :</label>
          <select [(ngModel)]="selection.killerId" name="killer">
            @for (s of service.mystery()?.suspects; track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label>L'Arme du Crime :</label>
          <select [(ngModel)]="selection.weaponId" name="weapon">
            @for (i of service.mystery()?.items; track i.id) {
              @if (i.canBeMurderWeapon) {
                <option [value]="i.id">{{ i.name }}</option>
              }
            }
          </select>
        </div>

        <div class="field">
          <label>Le Lieu :</label>
          <select [(ngModel)]="selection.roomId" name="room">
            @for (r of service.mystery()?.rooms; track r.id) {
              <option [value]="r.id">{{ r.name }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label>Le Mobile :</label>
          <select [(ngModel)]="selection.motive" name="motive">
            @for (m of motives; track m) {
              <option [value]="m">{{ m }}</option>
            }
          </select>
        </div>

        <button type="submit" [disabled]="!isValid()">Porter les Accusations</button>
      </form>
    </div>
  `,
  styles: [`
    .accuse-container {
      background: #2a2a2a;
      border: 2px solid #f44336;
      padding: 1.5rem;
      margin-top: 2rem;
    }
    h2 { color: #f44336; margin-top: 0; text-transform: uppercase; }
    p { font-size: 0.8rem; color: #888; margin-bottom: 1.5rem; }
    .field {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    label { font-size: 0.8rem; font-weight: bold; }
    select {
      background: #111;
      color: white;
      border: 1px solid #444;
      padding: 0.5rem;
    }
    button {
      width: 100%;
      background: #f44336;
      color: white;
      border: none;
      padding: 0.8rem;
      margin-top: 1rem;
      cursor: pointer;
      font-weight: bold;
      text-transform: uppercase;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class AccuseComponent {
  service = inject(DetectiveService);
  
  // Use a copy of motives for the dropdown
  motives = [
    'Vengeance pour une trahison passée.',
    'Dettes de jeu impayées.',
    'Jalousie amoureuse.',
    'Tentative de protéger un secret compromettant.',
    'Héritage disputé.'
  ];

  selection = {
    killerId: '',
    weaponId: '',
    roomId: '',
    motive: ''
  };

  isValid() {
    return this.selection.killerId && this.selection.weaponId && this.selection.roomId && this.selection.motive;
  }

  onSubmit(e: Event) {
    e.preventDefault();
    if (this.isValid()) {
      this.service.accuse(
        this.selection.killerId,
        this.selection.weaponId,
        this.selection.roomId,
        this.selection.motive
      );
    }
  }
}
