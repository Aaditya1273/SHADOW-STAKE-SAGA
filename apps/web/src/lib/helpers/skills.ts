// Skill tree and upgrade system for player progression

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in score points
  maxLevel: number;
  currentLevel: number;
  effect: SkillEffect;
  prerequisite?: string; // ID of required skill
  icon: string;
}

export interface SkillEffect {
  type: 'damage' | 'health' | 'speed' | 'cooldown' | 'special';
  value: number; // Multiplier or flat bonus
}

export const skillTree: Skill[] = [
  // Combat Skills
  {
    id: 'power-strike',
    name: 'Power Strike',
    description: 'Increase attack damage by 10% per level',
    cost: 500,
    maxLevel: 5,
    currentLevel: 0,
    effect: { type: 'damage', value: 1.1 },
    icon: '⚔️',
  },
  {
    id: 'rapid-assault',
    name: 'Rapid Assault',
    description: 'Reduce attack cooldown by 15% per level',
    cost: 600,
    maxLevel: 3,
    currentLevel: 0,
    effect: { type: 'cooldown', value: 0.85 },
    prerequisite: 'power-strike',
    icon: '⚡',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind Strike',
    description: 'Unlock AOE attack that hits all nearby enemies',
    cost: 1500,
    maxLevel: 1,
    currentLevel: 0,
    effect: { type: 'special', value: 1 },
    prerequisite: 'rapid-assault',
    icon: '🌪️',
  },

  // Survival Skills
  {
    id: 'vitality',
    name: 'Vitality',
    description: 'Increase max health by 20 per level',
    cost: 400,
    maxLevel: 5,
    currentLevel: 0,
    effect: { type: 'health', value: 20 },
    icon: '❤️',
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Heal 1 HP per second',
    cost: 800,
    maxLevel: 3,
    currentLevel: 0,
    effect: { type: 'health', value: 1 },
    prerequisite: 'vitality',
    icon: '💚',
  },
  {
    id: 'second-wind',
    name: 'Second Wind',
    description: 'Survive a lethal hit once per life',
    cost: 2000,
    maxLevel: 1,
    currentLevel: 0,
    effect: { type: 'special', value: 1 },
    prerequisite: 'regeneration',
    icon: '🛡️',
  },

  // Mobility Skills
  {
    id: 'swift-feet',
    name: 'Swift Feet',
    description: 'Increase movement speed by 10% per level',
    cost: 450,
    maxLevel: 4,
    currentLevel: 0,
    effect: { type: 'speed', value: 1.1 },
    icon: '👟',
  },
  {
    id: 'dash',
    name: 'Dash',
    description: 'Unlock dash ability (double-tap direction)',
    cost: 1000,
    maxLevel: 1,
    currentLevel: 0,
    effect: { type: 'special', value: 1 },
    prerequisite: 'swift-feet',
    icon: '💨',
  },
  {
    id: 'phase-shift',
    name: 'Phase Shift',
    description: 'Dash through walls and enemies',
    cost: 2500,
    maxLevel: 1,
    currentLevel: 0,
    effect: { type: 'special', value: 1 },
    prerequisite: 'dash',
    icon: '👻',
  },

  // Utility Skills
  {
    id: 'treasure-hunter',
    name: 'Treasure Hunter',
    description: 'Increase rare loot drop chance by 15% per level',
    cost: 350,
    maxLevel: 3,
    currentLevel: 0,
    effect: { type: 'special', value: 1.15 },
    icon: '💎',
  },
  {
    id: 'coin-magnet',
    name: 'Coin Magnet',
    description: 'Increase coin pickup radius by 50%',
    cost: 700,
    maxLevel: 2,
    currentLevel: 0,
    effect: { type: 'special', value: 1.5 },
    prerequisite: 'treasure-hunter',
    icon: '🧲',
  },
];

export class SkillManager {
  private skills: Map<string, Skill>;
  private availablePoints: number;

  constructor() {
    this.skills = new Map();
    skillTree.forEach((skill) => {
      this.skills.set(skill.id, { ...skill });
    });
    this.availablePoints = 0;
  }

  addPoints(points: number) {
    this.availablePoints += points;
  }

  canUpgrade(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Check if max level reached
    if (skill.currentLevel >= skill.maxLevel) return false;

    // Check if enough points
    if (this.availablePoints < skill.cost) return false;

    // Check prerequisite
    if (skill.prerequisite) {
      const prereq = this.skills.get(skill.prerequisite);
      if (!prereq || prereq.currentLevel === 0) return false;
    }

    return true;
  }

  upgradeSkill(skillId: string): boolean {
    if (!this.canUpgrade(skillId)) return false;

    const skill = this.skills.get(skillId);
    if (!skill) return false;

    skill.currentLevel++;
    this.availablePoints -= skill.cost;
    return true;
  }

  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getAvailablePoints(): number {
    return this.availablePoints;
  }

  // Calculate total effect for a skill type
  getTotalEffect(effectType: SkillEffect['type']): number {
    let total = 0;
    this.skills.forEach((skill) => {
      if (skill.effect.type === effectType && skill.currentLevel > 0) {
        if (effectType === 'health') {
          total += skill.effect.value * skill.currentLevel;
        } else {
          total *= Math.pow(skill.effect.value, skill.currentLevel);
        }
      }
    });
    return total;
  }

  hasSkill(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    return skill ? skill.currentLevel > 0 : false;
  }

  reset() {
    this.skills.forEach((skill) => {
      skill.currentLevel = 0;
    });
    this.availablePoints = 0;
  }
}
