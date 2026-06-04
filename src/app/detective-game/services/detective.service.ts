import { Injectable, signal, computed } from '@angular/core';
import { Character, Room, Item, Clue, Alibi, Mystery, GameState, Personality, RelationshipType, SuspicionLevel } from '../models/detective.model';
import { NOIR_CHARACTERS, NOIR_ROOMS, NOIR_ITEMS, NOIR_MOTIVES, HENDERSON, PERSONALITIES, DIALOGUE_TEMPLATES } from '../data/noir-data';

@Injectable({
  providedIn: 'root'
})
export class DetectiveService {
  private _state = signal<GameState>({
    mystery: null,
    discoveredClues: [],
    interrogationHistory: {},
    playerDeductions: { killerId: '', weaponId: '', roomId: '', motive: '' },
    currentRoomId: null,
    isGameOver: false,
    gameResult: null
  });

  interrogatingCharacterId = signal<string | null>(null);

  // Internal state to track assigned description levels per game
  private assignedSuspicionLevels = {
    rooms: {} as Record<string, SuspicionLevel>,
    items: {} as Record<string, SuspicionLevel>
  };

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
    
    const suspects = state.mystery.suspects.filter(s => {
      const alibi = state.mystery?.alibis.find(a => a.characterId === s.id);
      return alibi?.locationId === state.currentRoomId;
    });

    if (state.currentRoomId === 'bar') {
        return [...suspects, HENDERSON];
    }
    return suspects;
  });

  itemsInCurrentRoom = computed(() => {
    const state = this._state();
    if (!state.mystery || !state.currentRoomId) return [];
    
    const items = state.mystery.items.filter(i => {
        const itemLocation = (state.mystery as any).itemsLocations?.[i.id];
        return itemLocation === state.currentRoomId;
    });
    return items;
  });

  constructor() {}

  generateNewGame() {
    const baseCharacters = this.shuffle([...NOIR_CHARACTERS]);
    const numSuspects = Math.floor(Math.random() * 3) + 4;
    const selectedCharacters = baseCharacters.slice(0, numSuspects + 1);

    const victim = selectedCharacters[0];
    const killer = selectedCharacters[1];
    const suspects = selectedCharacters.slice(1);
    
    suspects.forEach(s => s.personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]);
    victim.personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

    suspects.forEach(s => s.relationships = []);
    const relTypes: RelationshipType[] = ['friend', 'enemy', 'lover', 'colleague', 'rival', 'debtor'];

    for (let i = 0; i < suspects.length; i++) {
      const s1 = suspects[i];
      const vRel = relTypes[Math.floor(Math.random() * relTypes.length)];
      s1.relationships!.push({ targetId: victim.id, type: vRel, description: '' });

      for (let j = i + 1; j < suspects.length; j++) {
        const s2 = suspects[j];
        if (Math.random() > 0.4) {
          const type = relTypes[Math.floor(Math.random() * relTypes.length)];
          s1.relationships!.push({ targetId: s2.id, type: type, description: '' });
          if (!s2.relationships) s2.relationships = [];
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

    const itemsLocations: Record<string, string> = {};
    items.forEach(item => {
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        itemsLocations[item.id] = randomRoom.id;
    });

    const alibis: Alibi[] = [];
    suspects.forEach((suspect) => {
      const isKiller = suspect.id === killer.id;
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      alibis.push({ characterId: suspect.id, locationId: room.id, isFake: isKiller, timeSlot: '21:00' });
    });

    // Assign suspicion levels
    this.assignedSuspicionLevels.rooms = {};
    rooms.forEach(r => {
      if (r.id === murderRoom.id) {
        this.assignedSuspicionLevels.rooms[r.id] = 'suspect';
      } else {
        this.assignedSuspicionLevels.rooms[r.id] = Math.random() > 0.6 ? 'strange' : 'normal';
      }
    });

    this.assignedSuspicionLevels.items = {};
    items.forEach(i => {
      if (i.id === murderWeapon.id) {
        this.assignedSuspicionLevels.items[i.id] = 'suspect';
      } else {
        this.assignedSuspicionLevels.items[i.id] = Math.random() > 0.6 ? 'strange' : 'normal';
      }
    });

    const mystery: Mystery & { itemsLocations: Record<string, string> } = {
      victim, killer, murderWeapon, murderRoom, motive, suspects, rooms, items, clues: [], alibis, itemsLocations
    };

    this._state.set({
      mystery,
      discoveredClues: [],
      interrogationHistory: {},
      playerDeductions: { killerId: '', weaponId: '', roomId: '', motive: '' },
      currentRoomId: rooms[0].id,
      isGameOver: false,
      gameResult: null
    });
  }

  setCurrentRoom(roomId: string) {
    this._state.update(s => ({ ...s, currentRoomId: roomId }));
  }

  examineCurrentRoom() {
    const state = this._state();
    const mystery = state.mystery;
    const room = this.currentRoom();
    if (!mystery || !room) return;

    const level = this.assignedSuspicionLevels.rooms[room.id] || 'normal';
    const descOptions = room.descriptions[level];
    const desc = descOptions[Math.floor(Math.random() * descOptions.length)];
    
    this.discoverClue({
        id: `examine_${room.id}`,
        name: `Observation : ${room.name}`,
        description: desc,
        type: 'physical'
    });
  }

  updatePlayerDeduction(field: keyof GameState['playerDeductions'], value: string) {
    this._state.update(s => ({
        ...s,
        playerDeductions: { ...s.playerDeductions, [field]: value }
    }));
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
      if (!history[characterId]) history[characterId] = [];
      if (!history[characterId].includes(topic)) history[characterId] = [...history[characterId], topic];
      return { ...s, interrogationHistory: history };
    });
  }

  askAboutAlibi(characterId: string): string {
    if (characterId === HENDERSON.id) return "Moi ? J'étais au poste, à remplir de la paperasse. Comme d'habitude.";
    const mystery = this.mystery();
    const char = mystery?.suspects.find(s => s.id === characterId);
    const alibi = mystery?.alibis.find(a => a.characterId === characterId);
    const room = mystery?.rooms.find(r => r.id === alibi?.locationId);
    if (!char || !alibi || !room) return "Je ne sais plus.";

    this.updateInterrogationHistory(characterId, 'alibi');
    const templates = DIALOGUE_TEMPLATES['alibi'][char.personality || 'friendly'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    let text = template.replace(/{room}/g, room.shortName || room.name);
    text = text.replace(/{room_at}/g, room.preposition);
    text = text.replace(/{room_at_cap}/g, room.preposition.charAt(0).toUpperCase() + room.preposition.slice(1));
    let dePrep = room.preposition === 'au' || room.preposition === 'dans le' ? 'du' : room.preposition === 'dans les' ? 'des' : 'de la';
    text = text.replace(/{room_at_de}/g, dePrep);
    return text;
  }

  askAboutPerson(subjectId: string, targetId: string): string {
    if (subjectId === HENDERSON.id) return targetId === HENDERSON.id ? "C'est moi, petit malin." : "Un sacré dossier sur cette personne. Soyez prudent.";
    const mystery = this.mystery();
    const subject = mystery?.suspects.find(s => s.id === subjectId);
    if (!mystery || !subject) return "...";
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
    return type === 'family' ? "Ma femme ? Toujours en train de se plaindre de mes heures sup', mais elle m'attend avec un bon ragoût. Merci de demander, gamin." : "Un verre ? Après avoir bouclé cette affaire, c'est moi qui régale au bar d'en face !";
  }

  accuse(killerId: string, weaponId: string, roomId: string, motive: string) {
    const mystery = this.mystery();
    if (!mystery) return;
    const isWin = killerId === mystery.killer.id && weaponId === mystery.murderWeapon.id && roomId === mystery.murderRoom.id && motive === mystery.motive;
    this._state.update(s => ({ ...s, isGameOver: true, gameResult: isWin ? 'win' : 'loss' }));
  }

  getItemDescription(itemId: string): string {
    const item = this.mystery()?.items.find(i => i.id === itemId);
    if (!item) return '';
    const level = this.assignedSuspicionLevels.items[itemId] || 'normal';
    const options = item.descriptions[level];
    return options[Math.floor(Math.random() * options.length)];
  }

  private shuffle<T>(array: T[]): T[] { return array.sort(() => Math.random() - 0.5); }
}
