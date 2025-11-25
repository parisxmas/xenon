import * as THREE from 'three';
import { Enemy } from './Enemy.js';

export class EnemyManager {
  constructor(scene, bounds, bulletManager) {
    this.scene = scene;
    this.bounds = bounds;
    this.bulletManager = bulletManager;
    
    this.enemies = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.5;
    this.enemiesSpawned = 0;
    
    // Enemy types configuration
    this.enemyTypes = [
      {
        type: 'basic',
        health: 1,
        speed: 8,
        points: 100,
        color: 0xff6600,
        shootRate: 2,
        weight: 40
      },
      {
        type: 'fast',
        health: 1,
        speed: 15,
        points: 150,
        color: 0xffff00,
        shootRate: 0,
        weight: 25
      },
      {
        type: 'tank',
        health: 5,
        speed: 4,
        points: 300,
        color: 0xff0066,
        shootRate: 1.5,
        weight: 15
      },
      {
        type: 'zigzag',
        health: 2,
        speed: 10,
        points: 200,
        color: 0x00ff66,
        shootRate: 2.5,
        weight: 15
      },
      {
        type: 'bomber',
        health: 3,
        speed: 6,
        points: 250,
        color: 0x9966ff,
        shootRate: 0.8,
        weight: 5
      }
    ];
  }
  
  update(delta, wave) {
    // Spawn enemies
    this.spawnTimer += delta;
    
    // Adjust spawn rate based on wave
    const adjustedInterval = Math.max(0.3, this.spawnInterval - wave * 0.1);
    
    if (this.spawnTimer >= adjustedInterval) {
      this.spawnEnemy(wave);
      this.spawnTimer = 0;
    }
    
    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(delta, this.bulletManager);
      
      // Remove if off screen
      if (enemy.mesh.position.y < this.bounds.bottom - 5) {
        this.removeEnemy(i);
      }
    }
  }
  
  spawnEnemy(wave) {
    const config = this.getRandomEnemyType(wave);
    const x = (Math.random() - 0.5) * (this.bounds.right - this.bounds.left - 4);
    const y = this.bounds.top + 5;
    
    // Scale difficulty with wave
    const healthMultiplier = 1 + (wave - 1) * 0.2;
    const speedMultiplier = 1 + (wave - 1) * 0.1;
    
    const enemy = new Enemy(
      this.scene,
      x,
      y,
      {
        ...config,
        health: Math.ceil(config.health * healthMultiplier),
        speed: config.speed * speedMultiplier
      }
    );
    
    this.enemies.push(enemy);
    this.enemiesSpawned++;
  }
  
  getRandomEnemyType(wave) {
    // Filter types available for this wave
    let available = this.enemyTypes.filter((type, index) => {
      if (index === 0) return true; // Basic always available
      if (index === 1) return wave >= 2; // Fast from wave 2
      if (index === 2) return wave >= 3; // Tank from wave 3
      if (index === 3) return wave >= 2; // Zigzag from wave 2
      if (index === 4) return wave >= 4; // Bomber from wave 4
      return true;
    });
    
    // Weighted random selection
    const totalWeight = available.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const type of available) {
      random -= type.weight;
      if (random <= 0) return type;
    }
    
    return available[0];
  }
  
  getEnemies() {
    return this.enemies;
  }
  
  removeEnemy(index) {
    const enemy = this.enemies[index];
    if (enemy) {
      enemy.destroy();
      this.enemies.splice(index, 1);
    }
  }
  
  reset() {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.spawnTimer = 0;
    this.enemiesSpawned = 0;
  }
}

