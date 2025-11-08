// Boss enemy types for procedural boss fights every 5 levels
export interface BossType {
  key: string;
  maxHealth: number;
  dps: number;
  movementSpeed: number;
  attackCooldown: number;
  pointsOnKill: number;
  maxDistance: number;
  minDistance: number;
  specialAbility: 'summon' | 'rage' | 'teleport' | 'shield';
  phaseThresholds: number[]; // Health % thresholds for phase changes
}

export const bosses: BossType[] = [
  {
    key: 'skeleton-king',
    maxHealth: 500,
    dps: 15,
    movementSpeed: 80,
    attackCooldown: 3000,
    pointsOnKill: 1000,
    maxDistance: 300,
    minDistance: 60,
    specialAbility: 'summon',
    phaseThresholds: [75, 50, 25], // Summons minions at these health %
  },
  {
    key: 'shadow-lord',
    maxHealth: 800,
    dps: 20,
    movementSpeed: 120,
    attackCooldown: 2500,
    pointsOnKill: 1500,
    maxDistance: 350,
    minDistance: 50,
    specialAbility: 'teleport',
    phaseThresholds: [66, 33], // Teleports more frequently
  },
  {
    key: 'elemental-titan',
    maxHealth: 1000,
    dps: 25,
    movementSpeed: 60,
    attackCooldown: 4000,
    pointsOnKill: 2000,
    maxDistance: 400,
    minDistance: 200,
    specialAbility: 'shield',
    phaseThresholds: [80, 60, 40, 20], // Gains shield at these points
  },
  {
    key: 'necro-overlord',
    maxHealth: 1200,
    dps: 18,
    movementSpeed: 50,
    attackCooldown: 3500,
    pointsOnKill: 2500,
    maxDistance: 350,
    minDistance: 150,
    specialAbility: 'rage',
    phaseThresholds: [50], // Enrages at 50% health
  },
];

export const getBossForLevel = (level: number): BossType => {
  // Cycle through bosses based on level
  const bossIndex = Math.floor((level - 5) / 5) % bosses.length;
  return bosses[bossIndex]!;
};

export const isBossLevel = (level: number): boolean => {
  return level % 5 === 0 && level > 0;
};
