import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectiveService } from '../services/detective.service';

@Component({
  selector: 'app-room-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="room-view">
      @if (service.currentRoom(); as room) {
        <h2>{{ room.name }}</h2>
        <p class="description">{{ room.description }}</p>

        <div class="room-actions">
           <button class="examine-btn" (click)="service.examineCurrentRoom()">
             🔍 Examiner la pièce
           </button>
        </div>

        <div class="section">
          <h3>Personnes présentes</h3>
          @if (service.charactersInCurrentRoom().length > 0) {
            <div class="character-list">
              @for (char of service.charactersInCurrentRoom(); track char.id) {
                <div class="character-card" (click)="interrogate(char.id)">
                  <div class="avatar">👤</div>
                  <div class="info">
                    <span class="name">{{ char.name }}</span>
                    <span class="job">{{ char.profession }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="empty">Personne n'est ici.</p>
          }
        </div>

        <div class="section">
          <h3>Indices et Objets</h3>
          @if (service.itemsInCurrentRoom().length > 0) {
            <div class="item-list">
              @for (item of service.itemsInCurrentRoom(); track item.id) {
                <div class="item-card" (click)="inspect(item.id)">
                  <span class="icon">🔍</span>
                  <span class="name">{{ item.name }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="empty">Aucun objet notable.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .room-view {
      background: #1a1a1a;
      border: 1px solid #333;
      padding: 1.5rem;
      height: 100%;
    }
    h2 {
      color: #00bcd4;
      margin-top: 0;
      border-bottom: 1px solid #333;
      padding-bottom: 0.5rem;
    }
    .description {
      font-style: italic;
      color: #aaa;
      margin-bottom: 1rem;
    }
    .room-actions {
      margin-bottom: 2rem;
    }
    .examine-btn {
      background: #444;
      color: white;
      border: 1px solid #666;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-family: inherit;
    }
    .examine-btn:hover {
      background: #555;
      border-color: #00bcd4;
    }
    .section h3 {
      font-size: 0.9rem;
      text-transform: uppercase;
      color: #666;
      border-bottom: 1px solid #222;
      padding-bottom: 0.2rem;
    }
    .character-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .character-card {
      background: #222;
      border: 1px solid #444;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: border-color 0.3s, background 0.3s;
    }
    .character-card:hover {
      border-color: #00bcd4;
      background: #2a2a2a;
    }
    .avatar {
      font-size: 1.5rem;
    }
    .info {
      display: flex;
      flex-direction: column;
    }
    .name {
      font-weight: bold;
      font-size: 0.9rem;
    }
    .job {
      font-size: 0.7rem;
      color: #888;
    }
    .item-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .item-card {
      background: #222;
      border: 1px dashed #444;
      padding: 0.5rem 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .item-card:hover {
      border-style: solid;
      border-color: #ffc107;
      color: #ffc107;
    }
    .empty {
      color: #444;
      font-size: 0.8rem;
    }
  `]
})
export class RoomViewComponent {
  service = inject(DetectiveService);

  interrogate(charId: string) {
    this.service.interrogatingCharacterId.set(charId);
  }

  inspect(itemId: string) {
    const item = this.service.mystery()?.items.find(i => i.id === itemId);
    if (item) {
        this.service.discoverClue({
            id: `discovered_${item.id}`,
            name: item.name,
            description: this.service.getItemDescription(item.id),
            type: 'physical'
        });
    }
  }
}
