import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetectiveService } from '../services/detective.service';

@Component({
  selector: 'app-interrogation',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (service.interrogatingCharacter(); as char) {
      <div class="interrogation-overlay">
        <div class="interrogation-box">
          <header>
            <div class="char-info">
              <span class="avatar">👤</span>
              <div>
                <h2>Interrogatoire : {{ char.name }}</h2>
                <p>{{ char.profession }}</p>
              </div>
            </div>
            <button class="close-btn" (click)="close()">×</button>
          </header>

          <div class="dialogue-area">
            @if (lastResponse()) {
              <div class="response bubble">
                <p>{{ lastResponse() }}</p>
              </div>
            } @else {
              <div class="intro bubble">
                <p>« Qu'est-ce que vous me voulez, l'inspecteur ? »</p>
              </div>
            }
          </div>

          <div class="actions">
            @if (char.id === 'henderson') {
               <button (click)="askAlibi()">« Que faisiez-vous au moment du crime ? »</button>
               <button (click)="askSpecial('family')">« Comment va ta femme, Henderson ? »</button>
               <button (click)="askSpecial('drink')">« On va boire un verre après ça ? »</button>
            } @else {
               <button (click)="askAlibi()">« Où étiez-vous ? »</button>
            }
            
            <div class="person-selector">
              <span>« Que savez-vous sur... »</span>
              <div class="chips">
                @for (suspect of service.mystery()?.suspects; track suspect.id) {
                   @if (suspect.id !== char.id) {
                    <button class="chip" (click)="askAbout(suspect.id)">{{ suspect.name }}</button>
                   }
                }
                <button class="chip victim" (click)="askAbout(service.mystery()!.victim.id)">
                    {{ service.mystery()!.victim.name }} (Victime)
                </button>
                @if (char.id !== 'henderson') {
                    <button class="chip henderson" (click)="askAbout('henderson')">Inspecteur Henderson</button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .interrogation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .interrogation-box {
      background: #1a1a1a;
      border: 2px solid #444;
      width: 95%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 0 30px rgba(0,0,0,1);
    }
    header {
      padding: 1rem;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .char-info {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .avatar { font-size: 2rem; }
    h2 { margin: 0; font-size: 1.2rem; color: #00bcd4; }
    p { margin: 0; font-size: 0.8rem; color: #888; }
    .close-btn {
      background: none;
      border: none;
      color: #666;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
    }
    .dialogue-area {
      padding: 2rem;
      min-height: 150px;
      background: #121212;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bubble {
      background: #222;
      border-left: 4px solid #00bcd4;
      padding: 1rem;
      max-width: 80%;
      font-style: italic;
    }
    .actions {
      padding: 1rem;
      border-top: 1px solid #333;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    button {
      background: #333;
      color: white;
      border: 1px solid #444;
      padding: 0.5rem 1rem;
      cursor: pointer;
      text-align: left;
    }
    button:hover { background: #444; border-color: #00bcd4; }
    .person-selector {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .person-selector span { font-size: 0.8rem; color: #666; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip { font-size: 0.7rem; padding: 0.2rem 0.5rem; background: #222; border: 1px solid #333; }
    .chip.victim { border-color: #f44336; color: #f44336; }
    .chip.henderson { border-color: #00bcd4; color: #00bcd4; }
  `]
})
export class InterrogationComponent {
  service = inject(DetectiveService);
  lastResponse = signal<string | null>(null);

  close() {
    this.service.interrogatingCharacterId.set(null);
    this.lastResponse.set(null);
  }

  askAlibi() {
    const char = this.service.interrogatingCharacter();
    if (char) {
      this.lastResponse.set(this.service.askAboutAlibi(char.id));
    }
  }

  askAbout(targetId: string) {
    const char = this.service.interrogatingCharacter();
    if (char) {
      this.lastResponse.set(this.service.askAboutPerson(char.id, targetId));
    }
  }

  askSpecial(type: 'family' | 'drink') {
    this.lastResponse.set(this.service.askHendersonSpecial(type));
  }
}
