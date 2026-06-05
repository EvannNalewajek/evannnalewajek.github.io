import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectiveService } from '../services/detective.service';
import { DetectiveMapComponent } from './detective-map.component';
import { RoomViewComponent } from './room-view.component';
import { InterrogationComponent } from './interrogation.component';
import { NotebookComponent } from './notebook.component';
import { AccuseComponent } from './accuse.component';
import { EndScreenComponent } from './end-screen.component';

@Component({
  selector: 'app-detective-main',
  standalone: true,
  imports: [CommonModule, DetectiveMapComponent, RoomViewComponent, InterrogationComponent, NotebookComponent, AccuseComponent, EndScreenComponent],
  template: `
    <div class="detective-container">
      <header>
        <h1>Enquête : Mystère au Speakeasy</h1>
        <button (click)="newGame()">Nouvelle Enquête</button>
      </header>

      <main>
        @if (service.mystery()) {
          <div class="game-layout">
            <div class="left-panel">
              <div class="map-section">
                <app-detective-map 
                  [rooms]="service.mystery()!.rooms" 
                  [currentRoomId]="service.state().currentRoomId"
                  (roomSelect)="service.setCurrentRoom($event)">
                </app-detective-map>
              </div>
              
              <div class="room-section">
                <app-room-view></app-room-view>
              </div>

              <app-accuse></app-accuse>
            </div>

            <div class="right-panel">
               <app-notebook></app-notebook>
            </div>
          </div>

          <app-interrogation></app-interrogation>
          
          @if (service.state().isGameOver) {
            <app-end-screen></app-end-screen>
          }
        } @else {
          <div class="start-screen">
            <p>Appuyez sur "Nouvelle Enquête" pour commencer.</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .detective-container {
      padding: clamp(1rem, 5vw, 2rem);
      color: #e0e0e0;
      background: #121212;
      min-height: 100vh;
      font-family: 'Courier New', Courier, monospace;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #444;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    h1 {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: clamp(1rem, 4vw, 2rem);
    }
    button {
      background: #333;
      color: white;
      border: 1px solid #666;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background 0.3s;
      font-size: 0.8rem;
    }
    button:hover {
      background: #555;
    }
    .game-layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .left-panel {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .right-panel {
      position: sticky;
      top: 2rem;
      height: calc(100vh - 10rem);
    }
    @media (max-width: 1200px) {
      .game-layout {
        grid-template-columns: 1fr;
      }
      .right-panel {
        position: static;
        height: auto;
      }
    }
  `]
})
export class DetectiveMainComponent implements OnInit {
  service = inject(DetectiveService);

  ngOnInit() {
    // Optionally start a game automatically
    // this.service.generateNewGame();
  }

  newGame() {
    this.service.generateNewGame();
  }
}
