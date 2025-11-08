// Weapon and ability variety system

export interface Weapon {
  id: string;
  name: string;
  type: 'sword' | 'axe' | 'spear' | 'bow' | 'staff';
  damage: number;
  attackSpeed: number; // Cooldown in ms
  range: number;
  special?: WeaponSpecial;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

export interface WeaponSpecial {
  name: string;
  effect: 'cleave' | 'pierce' | 'burn' | 'freeze' | 'lifesteal';
  value: number;
  cooldown: number;
}

export const weapons: Weapon[] = [
  // Starter weapon
  {
    id: 'rusty-sword',
    name: 'Rusty Sword',
    type: 'sword',
    damage: 30,
    attackSpeed: 2000,
    range: 50,
    rarity: 'common',
    icon: '🗡️',
  },

  // Swords
  {
    id: 'knights-blade',
    name: "Knight's Blade",
    type: 'sword',
    damage: 45,
    attackSpeed: 1800,
    range: 55,
    rarity: 'rare',
    icon: '⚔️',
  },
  {
    id: 'flame-sword',
    name: 'Flame Sword',
    type: 'sword',
    damage: 60,
    attackSpeed: 2000,
    range: 55,
    special: {
      name: 'Burning Strike',
      effect: 'burn',
      value: 5,
      cooldown: 5000,
    },
    rarity: 'epic',
    icon: '🔥',
  },
  {
    id: 'soul-reaver',
    name: 'Soul Reaver',
    type: 'sword',
    damage: 80,
    attackSpeed: 1600,
    range: 60,
    special: {
      name: 'Life Drain',
      effect: 'lifesteal',
      value: 0.3,
      cooldown: 3000,
    },
    rarity: 'legendary',
    icon: '💀',
  },

  // Axes
  {
    id: 'battle-axe',
    name: 'Battle Axe',
    type: 'axe',
    damage: 70,
    attackSpeed: 2500,
    range: 50,
    special: {
      name: 'Cleave',
      effect: 'cleave',
      value: 0.5,
      cooldown: 4000,
    },
    rarity: 'rare',
    icon: '🪓',
  },
  {
    id: 'frost-axe',
    name: 'Frost Axe',
    type: 'axe',
    damage: 85,
    attackSpeed: 2400,
    range: 55,
    special: {
      name: 'Freeze Strike',
      effect: 'freeze',
      value: 2000,
      cooldown: 6000,
    },
    rarity: 'epic',
    icon: '❄️',
  },

  // Spears
  {
    id: 'iron-spear',
    name: 'Iron Spear',
    type: 'spear',
    damage: 50,
    attackSpeed: 1500,
    range: 80,
    special: {
      name: 'Pierce',
      effect: 'pierce',
      value: 1,
      cooldown: 3000,
    },
    rarity: 'rare',
    icon: '🔱',
  },
  {
    id: 'lightning-lance',
    name: 'Lightning Lance',
    type: 'spear',
    damage: 75,
    attackSpeed: 1400,
    range: 90,
    special: {
      name: 'Chain Lightning',
      effect: 'pierce',
      value: 3,
      cooldown: 5000,
    },
    rarity: 'legendary',
    icon: '⚡',
  },

  // Bows
  {
    id: 'hunters-bow',
    name: "Hunter's Bow",
    type: 'bow',
    damage: 40,
    attackSpeed: 1200,
    range: 150,
    rarity: 'common',
    icon: '🏹',
  },
  {
    id: 'shadow-bow',
    name: 'Shadow Bow',
    type: 'bow',
    damage: 65,
    attackSpeed: 1000,
    range: 180,
    special: {
      name: 'Multi-Shot',
      effect: 'pierce',
      value: 2,
      cooldown: 4000,
    },
    rarity: 'epic',
    icon: '🌑',
  },

  // Staves
  {
    id: 'apprentice-staff',
    name: 'Apprentice Staff',
    type: 'staff',
    damage: 35,
    attackSpeed: 2200,
    range: 120,
    rarity: 'common',
    icon: '🪄',
  },
  {
    id: 'arcane-staff',
    name: 'Arcane Staff',
    type: 'staff',
    damage: 55,
    attackSpeed: 2000,
    range: 140,
    special: {
      name: 'Mana Burst',
      effect: 'burn',
      value: 10,
      cooldown: 5000,
    },
    rarity: 'epic',
    icon: '✨',
  },
  {
    id: 'staff-of-eternity',
    name: 'Staff of Eternity',
    type: 'staff',
    damage: 90,
    attackSpeed: 1800,
    range: 160,
    special: {
      name: 'Time Freeze',
      effect: 'freeze',
      value: 3000,
      cooldown: 8000,
    },
    rarity: 'legendary',
    icon: '🌟',
  },
];

export interface Ability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  manaCost: number;
  effect: AbilityEffect;
  icon: string;
}

export interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'teleport';
  value: number;
  radius?: number;
  duration?: number;
}

export const abilities: Ability[] = [
  {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launch a fireball that explodes on impact',
    cooldown: 5000,
    manaCost: 30,
    effect: {
      type: 'damage',
      value: 50,
      radius: 80,
    },
    icon: '🔥',
  },
  {
    id: 'healing-wave',
    name: 'Healing Wave',
    description: 'Restore health instantly',
    cooldown: 10000,
    manaCost: 40,
    effect: {
      type: 'heal',
      value: 50,
    },
    icon: '💚',
  },
  {
    id: 'shadow-step',
    name: 'Shadow Step',
    description: 'Teleport to cursor location',
    cooldown: 8000,
    manaCost: 25,
    effect: {
      type: 'teleport',
      value: 200,
    },
    icon: '👻',
  },
  {
    id: 'battle-cry',
    name: 'Battle Cry',
    description: 'Increase damage by 50% for 10 seconds',
    cooldown: 15000,
    manaCost: 35,
    effect: {
      type: 'buff',
      value: 1.5,
      duration: 10000,
    },
    icon: '📢',
  },
  {
    id: 'ice-nova',
    name: 'Ice Nova',
    description: 'Freeze all nearby enemies',
    cooldown: 12000,
    manaCost: 50,
    effect: {
      type: 'debuff',
      value: 3000,
      radius: 150,
    },
    icon: '❄️',
  },
];

export class WeaponManager {
  private currentWeapon: Weapon;
  private unlockedWeapons: Set<string>;
  private equippedAbilities: Ability[];

  constructor() {
    this.currentWeapon = weapons[0]!; // Start with rusty sword
    this.unlockedWeapons = new Set(['rusty-sword']);
    this.equippedAbilities = [];
  }

  equipWeapon(weaponId: string): boolean {
    if (!this.unlockedWeapons.has(weaponId)) return false;

    const weapon = weapons.find((w) => w.id === weaponId);
    if (weapon) {
      this.currentWeapon = weapon;
      return true;
    }
    return false;
  }

  unlockWeapon(weaponId: string) {
    this.unlockedWeapons.add(weaponId);
  }

  getCurrentWeapon(): Weapon {
    return this.currentWeapon;
  }

  getUnlockedWeapons(): Weapon[] {
    return weapons.filter((w) => this.unlockedWeapons.has(w.id));
  }

  equipAbility(ability: Ability): boolean {
    if (this.equippedAbilities.length >= 4) return false;
    this.equippedAbilities.push(ability);
    return true;
  }

  getEquippedAbilities(): Ability[] {
    return this.equippedAbilities;
  }

  // Drop weapon based on rarity
  static getRandomWeaponDrop(level: number): Weapon | null {
    const dropChance = Math.random();
    
    // Higher levels = better drops
    const rarityThreshold = {
      legendary: 0.02 + level * 0.005,
      epic: 0.08 + level * 0.01,
      rare: 0.25 + level * 0.02,
      common: 0.5,
    };

    let rarity: Weapon['rarity'];
    if (dropChance < rarityThreshold.legendary) {
      rarity = 'legendary';
    } else if (dropChance < rarityThreshold.epic) {
      rarity = 'epic';
    } else if (dropChance < rarityThreshold.rare) {
      rarity = 'rare';
    } else if (dropChance < rarityThreshold.common) {
      rarity = 'common';
    } else {
      return null; // No drop
    }

    const availableWeapons = weapons.filter((w) => w.rarity === rarity);
    return availableWeapons[Math.floor(Math.random() * availableWeapons.length)] || null;
  }
}
