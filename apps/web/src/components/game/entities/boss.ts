import type { BossType } from '~/lib/helpers/boss';
import type { Room } from '@mikewesthad/dungeon';
import Phaser from 'phaser';

import type { DungeonGameScene } from '../scenes';
import { gameState } from '../state';
import { HealthBar } from './healthbar';

type SoundTypes = 'dead' | 'attack' | 'special';

export class Boss {
  public sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  public health: number;
  public maxHealth: number;
  public lastAttackTime: number;
  public lastSpecialTime: number;
  private healthBar: HealthBar;
  public bossType: BossType;
  public room: Room;
  public isHidden: boolean;
  public sounds: Record<SoundTypes, Phaser.Sound.BaseSound>;
  public currentPhase: number;
  public isEnraged: boolean;
  public shieldActive: boolean;

  constructor(
    scene: DungeonGameScene,
    x: number,
    y: number,
    type: BossType,
    room: Room
  ) {
    this.isHidden = true;
    this.room = room;
    this.health = type.maxHealth;
    this.maxHealth = type.maxHealth;
    this.lastAttackTime = 0;
    this.lastSpecialTime = 0;
    this.bossType = type;
    this.currentPhase = 0;
    this.isEnraged = false;
    this.shieldActive = false;

    this.sprite = scene.physics.add.sprite(x, y, this.bossType.key, 0);
    this.sprite.setScale(5); // Bosses are bigger
    this.sprite.setTint(0xff0000); // Red tint for bosses

    this.healthBar = new HealthBar(scene, this.sprite, 150);
    this.healthBar.updateHealthBar();

    this.sprite.setVisible(false);
    this.healthBar.setVisible(false);

    const deadSound = scene.sound.add('enemyDeadSound');
    const attackSound = scene.sound.add('enemyAttackSound');
    const specialSound = scene.sound.add('playerAttackSound'); // Reuse for now

    this.sounds = {
      dead: deadSound,
      attack: attackSound,
      special: specialSound,
    };
  }

  freeze() {
    if (!this.sprite) return;
    this.sprite.body.moves = false;
  }

  public moveTowardPlayer(scene: DungeonGameScene): void {
    if (!this.sprite) return;

    const distance = Phaser.Math.Distance.Between(
      scene.player.sprite.x,
      scene.player.sprite.y,
      this.sprite.x,
      this.sprite.y
    );

    // Boss movement logic with special abilities
    if (this.bossType.specialAbility === 'teleport' && this.shouldTeleport(scene)) {
      this.teleportNearPlayer(scene);
      return;
    }

    if (
      distance < this.bossType.maxDistance &&
      distance > this.bossType.minDistance
    ) {
      const speed = this.isEnraged
        ? this.bossType.movementSpeed * 1.5
        : this.bossType.movementSpeed;
      scene.physics.moveToObject(this.sprite, scene.player.sprite, speed);
    } else {
      this.sprite.setVelocity(0, 0);
    }
  }

  private shouldTeleport(scene: DungeonGameScene): boolean {
    const timeSinceLastSpecial = scene.time.now - this.lastSpecialTime;
    return timeSinceLastSpecial > 5000 && Math.random() < 0.3;
  }

  private teleportNearPlayer(scene: DungeonGameScene): void {
    if (!this.sprite) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 50;
    const newX = scene.player.sprite.x + Math.cos(angle) * distance;
    const newY = scene.player.sprite.y + Math.sin(angle) * distance;

    this.sprite.setPosition(newX, newY);
    this.lastSpecialTime = scene.time.now;
    this.sounds.special.play();
  }

  public attack(scene: DungeonGameScene): void {
    if (!this.sprite) return;
    const player = scene.player;

    const attackCooldown = this.isEnraged
      ? this.bossType.attackCooldown * 0.7
      : this.bossType.attackCooldown;

    if (scene.time.now - this.lastAttackTime > attackCooldown) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        player.sprite.x,
        player.sprite.y
      );

      if (distance < this.bossType.minDistance) {
        if (this.hasLineOfSightToPlayer(player.sprite, scene.groundLayer)) {
          this.sounds.attack.play();
          const damage = this.isEnraged
            ? this.bossType.dps * 1.5
            : this.bossType.dps;
          player.onHitByEnemy(scene, damage);
          this.lastAttackTime = scene.time.now;

          // Special ability: summon minions
          if (this.bossType.specialAbility === 'summon') {
            this.summonMinions(scene);
          }
        }
      }
    }
  }

  private summonMinions(scene: DungeonGameScene): void {
    if (!this.sprite) return;
    const timeSinceLastSpecial = scene.time.now - this.lastSpecialTime;
    if (timeSinceLastSpecial < 10000) return; // Cooldown

    // Summon 2-3 skeleton minions
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = 80;
      const x = this.sprite.x + Math.cos(angle) * distance;
      const y = this.sprite.y + Math.sin(angle) * distance;

      // Add minion to scene (simplified - would need proper Enemy creation)
      // scene.spawnEnemy(x, y, 'skeleton');
    }

    this.lastSpecialTime = scene.time.now;
    this.sounds.special.play();
  }

  public onHitByPlayer(scene: Phaser.Scene): void {
    if (this.shieldActive) {
      // Shield absorbs damage
      this.shieldActive = false;
      return;
    }

    const damage = 30;
    this.health -= damage;
    this.lastAttackTime = scene.time.now;
    this.healthBar.takeDamage(damage);

    // Check for phase transitions
    this.checkPhaseTransition(scene);

    if (this.health <= 0) {
      this.sounds.dead.play();
      this.destroy();
    }
  }

  private checkPhaseTransition(scene: Phaser.Scene): void {
    const healthPercent = (this.health / this.maxHealth) * 100;

    for (let i = 0; i < this.bossType.phaseThresholds.length; i++) {
      const threshold = this.bossType.phaseThresholds[i]!;
      if (healthPercent <= threshold && this.currentPhase === i) {
        this.currentPhase = i + 1;
        this.triggerPhaseChange(scene);
        break;
      }
    }
  }

  private triggerPhaseChange(scene: Phaser.Scene): void {
    this.sounds.special.play();

    switch (this.bossType.specialAbility) {
      case 'rage':
        this.isEnraged = true;
        if (this.sprite) this.sprite.setTint(0xff4400); // Orange tint
        break;
      case 'shield':
        this.shieldActive = true;
        if (this.sprite) this.sprite.setTint(0x4444ff); // Blue tint
        break;
      case 'summon':
        // Summon more minions on phase change
        break;
      case 'teleport':
        // Increase teleport frequency
        break;
    }
  }

  hasLineOfSightToPlayer(
    player: Phaser.Physics.Arcade.Sprite,
    tilemapLayer: Phaser.Tilemaps.TilemapLayer
  ): boolean {
    if (!this.sprite) return false;
    const bossX = this.sprite.x;
    const bossY = this.sprite.y;
    const playerX = player.x;
    const playerY = player.y;

    const line = new Phaser.Geom.Line(bossX, bossY, playerX, playerY);
    const tiles = tilemapLayer.getTilesWithinShape(line, { isColliding: true });

    return tiles.length === 0;
  }

  update(scene: DungeonGameScene, activeRoom: Room) {
    if (!this.sprite) return;

    const bossTileX = scene.groundLayer.worldToTileX(this.sprite.x);
    const bossTileY = scene.groundLayer.worldToTileY(this.sprite.y);
    const bossRoom = scene.dungeon.getRoomAt(bossTileX, bossTileY);

    if (bossRoom && bossRoom !== this.room) {
      this.room = bossRoom;
    }

    if (this.isHidden && bossRoom) {
      if (activeRoom === bossRoom) {
        this.sprite.setVisible(true);
        this.healthBar.setVisible(true);
        this.isHidden = false;
      }
    }

    this.moveTowardPlayer(scene);
    this.attack(scene);
    this.healthBar.updateHealthBarPosition();

    // Animation logic (simplified)
    const velocityX = this.sprite.body.velocity.x;
    const velocityY = this.sprite.body.velocity.y;

    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      this.sprite.setFlipX(velocityX < 0);
    }
  }

  destroy() {
    if (this.sprite) {
      gameState.incrementScore(this.bossType.pointsOnKill);
      gameState.trackBossDefeat(this.bossType.key);
      this.sprite.destroy();
      this.sprite = undefined;
    }
    this.healthBar.destroy();
  }
}
