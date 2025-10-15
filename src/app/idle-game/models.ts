export type LocationKey = 'guild'| 'forest';

export interface Stats {
    strength: number; // Affects damage dealt
    resilience: number; // Affects damage taken
    vitality: number; // Affects max health
    aura: number; // Affects automated damage dealt
    mental: number; // Affects automated attack speed
}

export interface Player {
    gold: number;
    stats: Stats;
    currentHealth: number;
    level: number;
    experience: number;
    unspentStatPoints: number;
}

export interface EnemyTemplate {
    id: string; // Unique identifier for the enemy type
    name: string; // Name of the enemy
    baseHealth: number; // Base health of the enemy
    baseDamage: number; // Damage per attack
    attackSpeed: number; // Attacks per second
    baseGoldReward: number; // Base gold reward for defeating this enemy
}

export interface EnemyInstance extends EnemyTemplate {
    currentHealth: number; // Current health of the enemy instance
}

export interface Guild {
    level: number;
}

export type QuestKind = "HuntCountByType"; // First idea for a quest system

export interface QuestTemplate {    // 1st try
    kind: QuestKind;
    ennemyType: string; // Ennemy name
    count: number;  // Number of kills to get
    goldReward: number;
}

export interface QuestInstance extends QuestTemplate {
    id: string;
    acceptedAt?: number; // Timestamp
    progress: number;   // current number of kills
    completed: boolean;
}

export interface Recruit {
    id: string;
    name: string;
    level: number;
    stats: Stats;
}