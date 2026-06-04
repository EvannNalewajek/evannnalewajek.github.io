import { Component, Input, Output, EventEmitter } from '@angular/core';
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
        
        @for (room of rooms; track room.id) {
          <g class="room-group" 
             [class.active]="room.id === currentRoomId"
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
      stroke-width: 1;
      transition: fill 0.3s, stroke 0.3s;
      cursor: pointer;
    }
    .room-group:hover .room-rect {
      fill: #333;
      stroke: #999;
    }
    .room-group.active .room-rect {
      fill: #2a2a2a;
      stroke: #00bcd4;
      stroke-width: 2;
    }
    .room-label {
      fill: #888;
      font-size: 3px;
      pointer-events: none;
      text-transform: uppercase;
    }
    .room-group.active .room-label {
      fill: #00bcd4;
      font-weight: bold;
    }
  `]
})
export class DetectiveMapComponent {
  @Input() rooms: Room[] = [];
  @Input() currentRoomId: string | null = null;
  @Output() roomSelect = new EventEmitter<string>();
}
