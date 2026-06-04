import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectiveService } from '../services/detective.service';

@Component({
  selector: 'app-end-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="end-overlay">
      <div class="end-box" [class.win]="service.state().gameResult === 'win'" [class.loss]="service.state().gameResult === 'loss'">
        @if (service.state().gameResult === 'win') {
          <h1>Affaire Classée !</h1>
          <p class="summary">Vous avez démasqué le coupable. <strong>{{ service.mystery()?.killer?.name }}</strong> a été arrêté.</p>
          <p>Le mobile était bien : <em>{{ service.mystery()?.motive }}</em></p>
          <div class="celebration">🏆</div>
        } @else {
          <h1>Affaire Classée... Sans Suite</h1>
          <p class="summary">Vous avez accusé un innocent. Le vrai coupable court toujours.</p>
          <div class="truth">
            <p>Le vrai coupable était : <strong>{{ service.mystery()?.killer?.name }}</strong></p>
            <p>L'arme : <strong>{{ service.mystery()?.murderWeapon?.name }}</strong></p>
            <p>Le lieu : <strong>{{ service.mystery()?.murderRoom?.name }}</strong></p>
          </div>
          <div class="failure">💀</div>
        }
        
        <button (click)="service.generateNewGame()">Rejouer</button>
      </div>
    </div>
  `,
  styles: [`
    .end-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    .end-box {
      background: #111;
      border: 4px solid #444;
      padding: 3rem;
      text-align: center;
      max-width: 500px;
    }
    .end-box.win { border-color: #4caf50; }
    .end-box.loss { border-color: #f44336; }
    h1 { text-transform: uppercase; letter-spacing: 3px; margin-bottom: 2rem; }
    .summary { font-size: 1.2rem; margin-bottom: 1rem; }
    .truth { background: #222; padding: 1rem; margin: 1rem 0; font-size: 0.9rem; text-align: left; }
    .celebration, .failure { font-size: 4rem; margin: 2rem 0; }
    button {
      background: #333;
      color: white;
      border: 1px solid #666;
      padding: 1rem 2rem;
      cursor: pointer;
      text-transform: uppercase;
      font-weight: bold;
    }
    button:hover { background: #444; }
  `]
})
export class EndScreenComponent {
  service = inject(DetectiveService);
}
