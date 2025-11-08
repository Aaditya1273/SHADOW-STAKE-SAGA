import type { CoinType } from '~/lib/helpers/game';
import { SkillManager } from '~/lib/helpers/skills';
import { WeaponManager } from '~/lib/helpers/weapons';
import { HazardManager } from '~/lib/helpers/hazards';
import { LoreManager } from '~/lib/helpers/lore';
import { aiBehaviorManager } from '~/lib/helpers/ai-behavior';

import { makeAutoObservable } from 'mobx';

export class GameState {
  public level = 1;
  public score = 0;
  public playerHealth = 100;
  public maxPlayerHealth = 100;
  public playerMana = 100;
  public maxPlayerMana = 100;
  public isAttacking = false;
  public isHurting = false;
  public isDying = false;
  public totalLives = 3;
  public times: { round: number; start: number; end?: number }[] = [];
  public activeScene: 'home' | 'game' | 'game-over';
  
  // New gameplay systems
  public skillManager: SkillManager;
  public weaponManager: WeaponManager;
  public hazardManager: HazardManager;
  public loreManager: LoreManager;
  public sessionStartTime: number;
  public enemiesKilled: Map<string, number>; // Track kills per enemy type
  public bossesDefeated: Set<string>;

  constructor() {
    makeAutoObservable(this);
    this.activeScene = 'home';
    this.skillManager = new SkillManager();
    this.weaponManager = new WeaponManager();
    this.hazardManager = new HazardManager();
    this.loreManager = new LoreManager();
    this.sessionStartTime = Date.now();
    this.enemiesKilled = new Map();
    this.bossesDefeated = new Set();
  }

  public incrementLevel() {
    this.level++;
  }

  public decreaseLives() {
    this.totalLives--;
  }

  public increaseLives() {
    this.totalLives++;
  }

  public setAttacking(isAttacking: boolean) {
    this.isAttacking = isAttacking;
  }

  public setHurting(isHurting: boolean) {
    this.isHurting = isHurting;
  }

  public setDying(isDying: boolean) {
    this.isDying = isDying;
  }

  public getHealth() {
    return this.playerHealth;
  }

  decrementHealth(amount: number) {
    this.playerHealth = Math.max(this.playerHealth - amount, 0);
  }

  incrementHealth(amount: number) {
    this.playerHealth = Math.min(this.playerHealth + amount, 100);
  }

  public addCoin(type: CoinType) {
    this.score += type.points;
  }

  public incrementScore(points: number) {
    this.score += points;
    // Award skill points based on score milestones
    if (this.score % 1000 === 0) {
      this.skillManager.addPoints(100);
    }
  }

  public trackEnemyKill(enemyType: string) {
    const current = this.enemiesKilled.get(enemyType) || 0;
    this.enemiesKilled.set(enemyType, current + 1);
    
    // Check for lore unlocks
    this.loreManager.checkUnlocks({ type: 'enemy_kill', value: enemyType });
    
    // Update AI behavior
    aiBehaviorManager.recordPlayerAction('attack', { x: 0, y: 0 });
  }

  public trackBossDefeat(bossType: string) {
    this.bossesDefeated.add(bossType);
    this.loreManager.checkUnlocks({ type: 'boss_defeat', value: bossType });
    this.skillManager.addPoints(500); // Bonus skill points for boss kills
  }

  public updateSessionTime() {
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    aiBehaviorManager.updateSessionTime(elapsed);
  }

  public decrementMana(amount: number) {
    this.playerMana = Math.max(this.playerMana - amount, 0);
  }

  public incrementMana(amount: number) {
    this.playerMana = Math.min(this.playerMana + amount, this.maxPlayerMana);
  }

  public reset() {
    this.level = 1;
    this.score = 0;
    this.playerHealth = 100;
    this.maxPlayerHealth = 100;
    this.playerMana = 100;
    this.maxPlayerMana = 100;
    this.isAttacking = false;
    this.isHurting = false;
    this.isDying = false;
    this.totalLives = 3;
    this.times = [];
    this.activeScene = 'home';
    this.sessionStartTime = Date.now();
    this.enemiesKilled.clear();
    this.bossesDefeated.clear();
    this.skillManager.reset();
    this.hazardManager.clearHazards();
    aiBehaviorManager.reset();
  }
}

export const gameState = new GameState();
