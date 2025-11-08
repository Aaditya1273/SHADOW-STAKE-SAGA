// Narrative and lore integration system

export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  type: 'story' | 'enemy' | 'location' | 'item';
  unlockCondition: {
    type: 'level' | 'enemy_kill' | 'boss_defeat' | 'item_found';
    value: string | number;
  };
  discovered: boolean;
}

export const loreEntries: LoreEntry[] = [
  // Main Story Arc
  {
    id: 'prologue',
    title: 'The Fractured Veil',
    content:
      'Long ago, the realms existed in harmony, separated by the Veil—a mystical barrier between worlds. When the Necro-Overlord shattered it, darkness spilled into every corner of existence. You are a Shadow-Walker, one of the few who can traverse these corrupted realms and restore balance.',
    type: 'story',
    unlockCondition: { type: 'level', value: 1 },
    discovered: false,
  },
  {
    id: 'chapter1',
    title: 'The First Descent',
    content:
      'The dungeons you explore are fragments of shattered realms, each one a prison for lost souls and corrupted creatures. Every coin you collect is a fragment of pure essence—the only currency that matters in this broken world.',
    type: 'story',
    unlockCondition: { type: 'level', value: 3 },
    discovered: false,
  },
  {
    id: 'chapter2',
    title: 'Echoes of the Fallen',
    content:
      'The enemies you face were once heroes like you, corrupted by the Veil\'s darkness. Each kill is both a mercy and a tragedy. But their essence—the Dungeon Tokens—can be forged into power to prevent others from suffering their fate.',
    type: 'story',
    unlockCondition: { type: 'level', value: 5 },
    discovered: false,
  },
  {
    id: 'chapter3',
    title: 'The Eternal Loop',
    content:
      'Death is not the end here. Each time you fall, you awaken at the threshold, memories intact but body renewed. Some say this is a curse, others a gift. You suspect it\'s the Veil\'s way of ensuring someone keeps fighting.',
    type: 'story',
    unlockCondition: { type: 'level', value: 10 },
    discovered: false,
  },
  {
    id: 'finale',
    title: 'The Path to Restoration',
    content:
      'Legends speak of a way to repair the Veil, but it requires essence from every corrupted realm. Your journey has only begun. The deeper you go, the closer you get to the truth—and the Necro-Overlord who started it all.',
    type: 'story',
    unlockCondition: { type: 'level', value: 20 },
    discovered: false,
  },

  // Enemy Lore
  {
    id: 'skeleton-lore',
    title: 'The Hollow Soldiers',
    content:
      'Once proud warriors of the Realm Guard, these skeletons are all that remains after the Veil\'s corruption stripped away their flesh and memories. They attack on instinct, forever guarding dungeons that no longer exist.',
    type: 'enemy',
    unlockCondition: { type: 'enemy_kill', value: 'skeleton' },
    discovered: false,
  },
  {
    id: 'archer-lore',
    title: 'The Silent Marksmen',
    content:
      'Elite rangers who swore to protect the realm from afar. Their arrows never miss, even in death. Some say their spirits are trapped in their bows, forced to fire for eternity.',
    type: 'enemy',
    unlockCondition: { type: 'enemy_kill', value: 'archer' },
    discovered: false,
  },
  {
    id: 'shadow-beast-lore',
    title: 'Children of the Void',
    content:
      'These creatures didn\'t exist before the Veil shattered. Born from pure darkness, they phase through walls and strike from shadows. They are the Veil\'s immune system, hunting anything that doesn\'t belong.',
    type: 'enemy',
    unlockCondition: { type: 'enemy_kill', value: 'shadow-beast' },
    discovered: false,
  },
  {
    id: 'wraith-lore',
    title: 'The Elemental Damned',
    content:
      'Mages who tried to harness the Veil\'s power and failed. Their souls merged with elemental forces, creating beings of pure magical destruction. They attack with fire, ice, and lightning—remnants of spells they can no longer control.',
    type: 'enemy',
    unlockCondition: { type: 'enemy_kill', value: 'elemental-wraith' },
    discovered: false,
  },
  {
    id: 'necromancer-lore',
    title: 'The Fallen Summoners',
    content:
      'Disciples of the Necro-Overlord who willingly embraced corruption. They raise the dead to serve them, spreading the Veil\'s influence. Defeating them weakens the Overlord\'s grip on this realm.',
    type: 'enemy',
    unlockCondition: { type: 'enemy_kill', value: 'necromancer' },
    discovered: false,
  },

  // Boss Lore
  {
    id: 'skeleton-king-lore',
    title: 'The Forgotten Monarch',
    content:
      'Once a just king who ruled with wisdom and strength. When the Veil shattered, he tried to protect his kingdom but was consumed by darkness. Now he commands legions of undead, a twisted mockery of his former glory.',
    type: 'enemy',
    unlockCondition: { type: 'boss_defeat', value: 'skeleton-king' },
    discovered: false,
  },
  {
    id: 'shadow-lord-lore',
    title: 'The Veil\'s Champion',
    content:
      'A being of pure darkness, the Shadow Lord is the Veil\'s most powerful enforcer. It can teleport through shadows and strike from anywhere. Some believe it\'s the manifestation of the Veil\'s will itself.',
    type: 'enemy',
    unlockCondition: { type: 'boss_defeat', value: 'shadow-lord' },
    discovered: false,
  },
  {
    id: 'elemental-titan-lore',
    title: 'The Primordial Force',
    content:
      'Before the realms existed, there were the Titans—beings of pure elemental power. This one was imprisoned eons ago, but the Veil\'s shattering freed it. Now it rampages through the dungeons, destroying everything in its path.',
    type: 'enemy',
    unlockCondition: { type: 'boss_defeat', value: 'elemental-titan' },
    discovered: false,
  },
  {
    id: 'necro-overlord-lore',
    title: 'The Veil Breaker',
    content:
      'The architect of this catastrophe. Once a brilliant scholar who sought to transcend death, he shattered the Veil in his quest for immortality. Now he rules over the corrupted realms, growing stronger with each soul he claims.',
    type: 'enemy',
    unlockCondition: { type: 'boss_defeat', value: 'necro-overlord' },
    discovered: false,
  },

  // Location Lore
  {
    id: 'dungeon-origin',
    title: 'The Shattered Dungeons',
    content:
      'These aren\'t natural formations. Each dungeon is a pocket dimension—a fragment of a destroyed realm. They shift and change because they\'re unstable, constantly collapsing and reforming. The deeper you go, the more unstable they become.',
    type: 'location',
    unlockCondition: { type: 'level', value: 2 },
    discovered: false,
  },
  {
    id: 'coin-essence',
    title: 'Essence Crystals',
    content:
      'The coins you collect aren\'t mere treasure. They\'re crystallized essence—fragments of souls, magic, and reality itself. The Dungeon Tokens you mint from them are concentrated power, capable of reshaping the realms.',
    type: 'item',
    unlockCondition: { type: 'level', value: 4 },
    discovered: false,
  },
];

export class LoreManager {
  private entries: Map<string, LoreEntry>;
  private newDiscoveries: LoreEntry[];

  constructor() {
    this.entries = new Map();
    loreEntries.forEach((entry) => {
      this.entries.set(entry.id, { ...entry });
    });
    this.newDiscoveries = [];
  }

  checkUnlocks(condition: {
    type: 'level' | 'enemy_kill' | 'boss_defeat' | 'item_found';
    value: string | number;
  }): LoreEntry[] {
    const unlocked: LoreEntry[] = [];

    this.entries.forEach((entry) => {
      if (
        !entry.discovered &&
        entry.unlockCondition.type === condition.type &&
        entry.unlockCondition.value === condition.value
      ) {
        entry.discovered = true;
        unlocked.push(entry);
        this.newDiscoveries.push(entry);
      }
    });

    return unlocked;
  }

  getDiscoveredEntries(): LoreEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.discovered);
  }

  getNewDiscoveries(): LoreEntry[] {
    const discoveries = [...this.newDiscoveries];
    this.newDiscoveries = [];
    return discoveries;
  }

  getEntry(id: string): LoreEntry | undefined {
    return this.entries.get(id);
  }

  getCompletionPercentage(): number {
    const total = this.entries.size;
    const discovered = this.getDiscoveredEntries().length;
    return Math.floor((discovered / total) * 100);
  }

  // Get a random lore hint for loading screens
  getRandomHint(): string {
    const hints = [
      'Shadow Beasts can phase through walls. Listen for their whispers.',
      'Elemental Wraiths are weak after casting spells. Strike then!',
      'Boss fights have phases. Watch their health carefully.',
      'Rare loot glows brighter. Don\'t miss the diamonds!',
      'The deeper you go, the more essence you\'ll find.',
      'Death is not the end. Learn from each fall.',
      'Upgrade your skills wisely. Some paths are better than others.',
      'Environmental hazards can be avoided if you\'re careful.',
      'Some weapons have special abilities. Experiment!',
      'The Veil remembers everything. Your actions matter.',
    ];

    return hints[Math.floor(Math.random() * hints.length)]!;
  }
}
