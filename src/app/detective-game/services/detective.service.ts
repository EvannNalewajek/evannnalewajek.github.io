import { Injectable, signal, computed } from '@angular/core';
import { Character, Room, Item, Clue, Alibi, Mystery, GameState, Personality, RelationshipType } from '../models/detective.model';
import { NOIR_CHARACTERS, NOIR_ROOMS, NOIR_ITEMS, NOIR_MOTIVES, HENDERSON, PERSONALITIES, DIALOGUE_TEMPLATES } from '../data/noir-data';

@Injectable({
  providedIn: 'root'
})
export class DetectiveService {
  private _state = signal<GameState>({
    mystery: null,
    discoveredClues: [],
    interrogationHistory: {},
    currentRoomId: null,
    isGameOver: false,
    gameResult: null
  });

  interrogatingCharacterId = signal<string | null>(null);

  // Selectors
  state = computed(() => this._state());
  mystery = computed(() => this._state().mystery);
  
  interrogatingCharacter = computed(() => {
    const id = this.interrogatingCharacterId();
    if (id === HENDERSON.id) return HENDERSON;
    return this.mystery()?.suspects.find(s => s.id === id) || null;
  });

  currentRoom = computed(() => {
    const state = this._state();
    return state.mystery?.rooms.find(r => r.id === state.currentRoomId) || null;
  });

  charactersInCurrentRoom = computed(() => {
    const state = this._state();
    if (!state.mystery || !state.currentRoomId) return [];
    
    // Suspects at their alibi location
    const suspects = state.mystery.suspects.filter(s => {
      const alibi = state.mystery?.alibis.find(a => a.characterId === s.id);
      return alibi?.locationId === state.currentRoomId;
    });

    // Add Henderson if he is in the current room (let's say he follows the player or stays at the bar)
    if (state.currentRoomId === 'bar') {
        return [...suspects, HENDERSON];
    }

    return suspects;
  });

  itemsInCurrentRoom = computed(() => {
    const state = this._state();
    if (!state.mystery || !state.currentRoomId) return [];
    
    // For now, let's just place the murder weapon in the murder room as a clue
    if (state.currentRoomId === state.mystery.murderRoom.id) {
        return [state.mystery.murderWeapon];
    }
    return [];
  });

  constructor() {}

  /**
   * Generates a new procedural mystery.
   */
  generateNewGame() {
    // 1. Selection (Henderson is NEVER victim or killer)
    const baseCharacters = this.shuffle([...NOIR_CHARACTERS]);
    const numSuspects = Math.floor(Math.random() * 3) + 4; // 4 to 6 suspects
    const selectedCharacters = baseCharacters.slice(0, numSuspects + 1);

    const victim = selectedCharacters[0];
    const killer = selectedCharacters[1];
    const suspects = selectedCharacters.slice(1);
    
    // Assign Personalities
    suspects.forEach(s => {
      s.personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    });
    victim.personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

    // Assign Relationships (Symmetrical)
    suspects.forEach(s => s.relationships = []);
    
    const relTypes: RelationshipType[] = ['friend', 'enemy', 'lover', 'colleague', 'rival', 'debtor'];

    for (let i = 0; i < suspects.length; i++) {
      const s1 = suspects[i];
      
      // Mandatory relationship with victim
      const vRel = relTypes[Math.floor(Math.random() * relTypes.length)];
      s1.relationships!.push({ targetId: victim.id, type: vRel, description: '' });

      // Relationship with other suspects (ensure symmetry)
      for (let j = i + 1; j < suspects.length; j++) {
        const s2 = suspects[j];
        
        // 60% chance of having a link, otherwise 'stranger'
        if (Math.random() > 0.4) {
          const type = relTypes[Math.floor(Math.random() * relTypes.length)];
          
          s1.relationships!.push({ targetId: s2.id, type: type, description: '' });
          
          // Symmetrical link for s2
          if (!s2.relationships) s2.relationships = [];
          
          // Basic logic for symmetry: 
          // lover <-> lover, friend <-> friend, enemy <-> enemy, etc.
          // debtor <-> creditor (rival for simplicity)
          let s2Type = type;
          if (type === 'debtor') s2Type = 'rival'; 
          
          s2.relationships.push({ targetId: s1.id, type: s2Type, description: '' });
        }
      }
    }

    const rooms = this.shuffle([...NOIR_ROOMS]);
    const items = this.shuffle([...NOIR_ITEMS]);
    const motives = this.shuffle([...NOIR_MOTIVES]);

    const murderRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const murderWeapon = items.find(i => i.canBeMurderWeapon) || items[0];
    const motive = motives[Math.floor(Math.random() * motives.length)];

    // 2. Generate Alibis
    const alibis: Alibi[] = [];
    suspects.forEach((suspect) => {
      const isKiller = suspect.id === killer.id;
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      
      alibis.push({
        characterId: suspect.id,
        locationId: room.id,
        isFake: isKiller,
        timeSlot: '21:00'
      });
    });

    const clues: Clue[] = [{
      id: 'clue_weapon',
      name: `Traces de ${murderWeapon.name}`,
      description: `Des traces suspectes indiquent que le crime a été commis avec ${murderWeapon.name}.`,
      type: 'physical'
    }];

    const mystery: Mystery = {
      victim,
      killer,
      murderWeapon,
      murderRoom,
      motive,
      suspects,
      rooms,
      items,
      clues,
      alibis
    };

    this._state.set({
      mystery,
      discoveredClues: [],
      interrogationHistory: {},
      currentRoomId: rooms[0].id,
      isGameOver: false,
      gameResult: null
    });
  }

  setCurrentRoom(roomId: string) {
    this._state.update(s => ({ ...s, currentRoomId: roomId }));
  }

  discoverClue(clue: Clue) {
    this._state.update(s => {
      if (s.discoveredClues.find(c => c.id === clue.id)) return s;
      return { ...s, discoveredClues: [...s.discoveredClues, clue] };
    });
  }

  private updateInterrogationHistory(characterId: string, topic: string) {
    this._state.update(s => {
      const history = { ...s.interrogationHistory };
      if (!history[characterId]) {
        history[characterId] = [];
      }
      if (!history[characterId].includes(topic)) {
        history[characterId] = [...history[characterId], topic];
      }
      return { ...s, interrogationHistory: history };
    });
  }

  askAboutAlibi(characterId: string): string {
    if (characterId === HENDERSON.id) {
        return "Moi ? J'étais au poste, à remplir de la paperasse. Comme d'habitude.";
    }

    const mystery = this.mystery();
    if (!mystery) return "...";
    
    const char = mystery.suspects.find(s => s.id === characterId);
    const alibi = mystery.alibis.find(a => a.characterId === characterId);
    const room = mystery.rooms.find(r => r.id === alibi?.locationId);
    
    if (!char || !alibi || !room) return "Je ne sais plus.";

    // Track in history
    this.updateInterrogationHistory(characterId, 'alibi');

    const templates = DIALOGUE_TEMPLATES['alibi'][char.personality || 'friendly'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let text = template.replace(/{room}/g, room.shortName || room.name);
    text = text.replace(/{room_at}/g, room.preposition);
    text = text.replace(/{room_at_cap}/g, room.preposition.charAt(0).toUpperCase() + room.preposition.slice(1));
    
    // For specific cases like "Les ombres de la cuisine" vs "Les ombres du Speakeasy"
    let dePrep = 'de la';
    if (room.preposition === 'au') dePrep = 'du';
    if (room.preposition === 'dans le') dePrep = 'du';
    if (room.preposition === 'dans les') dePrep = 'des';
    text = text.replace(/{room_at_de}/g, dePrep);

    return text;
  }

  askAboutPerson(subjectId: string, targetId: string): string {
    if (subjectId === HENDERSON.id) {
        if (targetId === HENDERSON.id) return "C'est moi, petit malin.";
        return "Un sacré dossier sur cette personne. Soyez prudent.";
    }

    const mystery = this.mystery();
    if (!mystery) return "...";
    
    const subject = mystery.suspects.find(s => s.id === subjectId);
    if (!subject) return "...";

    // Track in history
    this.updateInterrogationHistory(subjectId, `person_${targetId}`);

    if (subjectId === targetId) return "C'est moi. Vous avez besoin de lunettes ?";

    const target = mystery.suspects.find(s => s.id === targetId) || (mystery.victim.id === targetId ? mystery.victim : null);
    if (!target) return "Je ne connais pas cette personne.";

    const relationship = subject.relationships?.find(r => r.targetId === targetId);
    const relType = relationship?.type || 'stranger';

    if (targetId === mystery.victim.id) {
        const templates = DIALOGUE_TEMPLATES['victim'][relType];
        const template = templates[Math.floor(Math.random() * templates.length)];
        return template.replace(/{victim}/g, target.name);
    }
    
    const templates = DIALOGUE_TEMPLATES['suspect'][relType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/{target}/g, target.name);
  }

  askHendersonSpecial(type: 'family' | 'drink'): string {
    if (type === 'family') {
        return "Ma femme ? Toujours en train de se plaindre de mes heures sup', mais elle m'attend avec un bon ragoût. Merci de demander, gamin.";
    }
    return "Un verre ? Après avoir bouclé cette affaire, c'est moi qui régale au bar d'en face !";
  }

  accuse(killerId: string, weaponId: string, roomId: string, motive: string) {
    const mystery = this.mystery();
    if (!mystery) return;

    const isKillerCorrect = killerId === mystery.killer.id;
    const isWeaponCorrect = weaponId === mystery.murderWeapon.id;
    const isRoomCorrect = roomId === mystery.murderRoom.id;
    
    // Motive is harder to check exactly if it's string-based, 
    // but in a simple version we just check if it matches the one we picked.
    const isMotiveCorrect = motive === mystery.motive;

    const isWin = isKillerCorrect && isWeaponCorrect && isRoomCorrect && isMotiveCorrect;

    this._state.update(s => ({
      ...s,
      isGameOver: true,
      gameResult: isWin ? 'win' : 'loss'
    }));
  }

  private shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }
}
