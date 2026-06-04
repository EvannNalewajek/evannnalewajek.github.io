export type Personality = 'cold' | 'nervous' | 'arrogant' | 'friendly' | 'mysterious' | 'aggressive' | 'timid';

export type RelationshipType = 'friend' | 'enemy' | 'lover' | 'colleague' | 'stranger' | 'rival' | 'debtor';

export interface Relationship {
  targetId: string;
  type: RelationshipType;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  profession: string;
  description: string;
  portrait: string;
  personality?: Personality;
  relationships?: Relationship[];
  secret?: string; // Information hidden by the character (red herring)
}

export type SuspicionLevel = 'normal' | 'strange' | 'suspect';

export interface Room {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  preposition: string;
  svgPath?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Tiered descriptions
  descriptions: Record<SuspicionLevel, string[]>;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  isWeapon: boolean;
  canBeMurderWeapon: boolean;
  // Tiered descriptions
  descriptions: Record<SuspicionLevel, string[]>;
}

export interface Clue {
  id: string;
  name: string;
  description: string;
  type: 'physical' | 'testimony' | 'contradiction';
  revealsSecretOf?: string; // ID of character
}

export interface Alibi {
  characterId: string;
  locationId: string;
  witnessId?: string; // Who can confirm they were there
  timeSlot: string; // e.g., "20:00 - 21:00"
  isFake: boolean;
}

export interface Mystery {
  victim: Character;
  killer: Character;
  murderWeapon: Item;
  murderRoom: Room;
  motive: string;
  suspects: Character[];
  rooms: Room[];
  items: Item[];
  clues: Clue[];
  alibis: Alibi[];
}

export interface GameState {
  mystery: Mystery | null;
  discoveredClues: Clue[];
  interrogationHistory: { [characterId: string]: string[] }; // characterId -> topics asked
  
  // Player's manual notes/deductions
  playerDeductions: {
    killerId: string;
    weaponId: string;
    roomId: string;
    motive: string;
  };

  currentRoomId: string | null;
  isGameOver: boolean;
  gameResult: 'win' | 'loss' | null;
}
