import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../models/detective.model';

@Component({
  selector: 'app-detective-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <svg viewBox="0 0 100 100" class="blueprint-svg">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#222" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />
        
        @for (room of sortedRooms(); track room.id) {
          <g class="room-group" 
             [class.active]="room.id === currentRoomId()"
             [class.hovered]="room.id === hoveredRoomId()"
             (mouseenter)="hoveredRoomId.set(room.id)"
             (mouseleave)="hoveredRoomId.set(null)"
             (click)="roomSelect.emit(room.id)">
            <rect 
              [attr.x]="room.x" 
              [attr.y]="room.y" 
              [attr.width]="room.width" 
              [attr.height]="room.height"
              class="room-rect" />
            <text 
              [attr.x]="room.x! + room.width! / 2" 
              [attr.y]="room.y! + room.height! / 2" 
              text-anchor="middle" 
              dominant-baseline="middle" 
              class="room-label">
              {{ room.name }}
            </text>
          </g>
        }
      </svg>
    </div>
  `,
  styles: [`
    .map-wrapper {
      width: 100%;
      background: #0a0a0a;
      border: 3px solid #333;
      padding: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
    .blueprint-svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .room-rect {
      fill: #1a1a1a;
      stroke: #666;
      stroke-width: 0.5;
      transition: fill 0.2s, stroke 0.2s, stroke-width 0.2s;
      cursor: pointer;
    }
    /* Priority 3: Hovered State */
    .room-group.hovered .room-rect {
      fill: #333;
      stroke: #999;
      stroke-width: 1;
    }
    /* Priority 2: Active State */
    .room-group.active .room-rect {
      fill: #222;
      stroke: #00bcd4;
      stroke-width: 1.5;
    }
    /* Priority 1: Hovered & Active */
    .room-group.active.hovered .room-rect {
      fill: #2a2a2a;
      stroke: #00e5ff;
    }
    .room-label {
      fill: #888;
      font-size: 3px;
      pointer-events: none;
      text-transform: uppercase;
      transition: fill 0.2s;
    }
    .room-group.active .room-label {
      fill: #00bcd4;
      font-weight: bold;
    }
    .room-group.hovered .room-label {
      fill: #eee;
    }
  `]
})
export class DetectiveMapComponent {
  rooms = input<Room[]>([]);
  currentRoomId = input<string | null>(null);
  roomSelect = output<string>();

  hoveredRoomId = signal<string | null>(null);

  // Sorting logic to ensure Active and Hovered rooms are rendered last (on top)
  sortedRooms = computed(() => {
    return [...this.rooms()].sort((a, b) => {
      const aScore = this.getPriorityScore(a.id);
      const bScore = this.getPriorityScore(b.id);
      return aScore - bScore;
    });
  });

  private getPriorityScore(id: string): number {
    let score = 0;
    if (id === this.currentRoomId()) score += 100;
    if (id === this.hoveredRoomId()) score += 50;
    return score;
  }
}
