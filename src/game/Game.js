import * as THREE from 'three';
import { Player } from './Player.js';
import { EnemyManager } from './EnemyManager.js';
import { BulletManager } from './BulletManager.js';
import { PowerUpManager } from './PowerUpManager.js';
import { Background } from './Background.js';
import { ParticleSystem } from './ParticleSystem.js';

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Game state
    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.powerLevel = 1;
    
    // Game bounds (play area)
    this.bounds = {
      left: -15,
      right: 15,
      top: 25,
      bottom: -25
    };
    
    this.init();
    this.setupEventListeners();
  }
  
  init() {
    // Scene
    this.scene = new THREE.Scene();
    // No fog for orthographic camera - it doesn't work well
    
    // Camera - orthographic for 2D-style gameplay
    const aspect = this.width / this.height;
    const frustumSize = 50;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      -100,
      100
    );
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000511);
    this.container.appendChild(this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334466, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x00ffcc, 1);
    directionalLight.position.set(0, 10, 20);
    this.scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xff3366, 0.5, 50);
    pointLight.position.set(10, 0, 10);
    this.scene.add(pointLight);
    
    // Game components
    this.background = new Background(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.bulletManager = new BulletManager(this.scene, this.bounds);
    this.player = new Player(this.scene, this.bounds, this.bulletManager);
    this.enemyManager = new EnemyManager(this.scene, this.bounds, this.bulletManager);
    this.powerUpManager = new PowerUpManager(this.scene, this.bounds);
    
    // Input state
    this.keys = {};
    
    // Clock for delta time
    this.clock = new THREE.Clock();
    
    // Initial render
    this.renderer.render(this.scene, this.camera);
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }
  
  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    const aspect = this.width / this.height;
    const frustumSize = 50;
    
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(this.width, this.height);
  }
  
  onKeyDown(e) {
    this.keys[e.code] = true;
    
    // Prevent default for game keys
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
      e.preventDefault();
    }
  }
  
  onKeyUp(e) {
    this.keys[e.code] = false;
  }
  
  start() {
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }
  
  restart() {
    // Reset game state
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.powerLevel = 1;
    
    // Reset components
    this.player.reset();
    this.enemyManager.reset();
    this.bulletManager.reset();
    this.powerUpManager.reset();
    this.particleSystem.reset();
    
    // Update UI
    this.updateUI();
    this.updateLivesUI();
    
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }
  
  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
  }
  
  update(delta) {
    // Update background
    this.background.update(delta);
    
    // Update player
    this.player.update(delta, this.keys);
    
    // Update enemies
    this.enemyManager.update(delta, this.wave);
    
    // Update bullets
    this.bulletManager.update(delta);
    
    // Update power-ups
    this.powerUpManager.update(delta);
    
    // Update particles
    this.particleSystem.update(delta);
    
    // Check collisions
    this.checkCollisions();
    
    // Check wave progression
    this.checkWaveProgression();
  }
  
  checkCollisions() {
    // Player bullets vs enemies
    const playerBullets = this.bulletManager.getPlayerBullets();
    const enemies = this.enemyManager.getEnemies();
    
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const bullet = playerBullets[i];
      
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        
        if (this.checkCollision(bullet, enemy)) {
          // Damage enemy
          const destroyed = enemy.takeDamage(bullet.damage);
          
          // Create hit particles
          this.particleSystem.createExplosion(
            bullet.mesh.position.x,
            bullet.mesh.position.y,
            enemy.color,
            10
          );
          
          // Remove bullet
          this.bulletManager.removePlayerBullet(i);
          
          if (destroyed) {
            // Add score
            this.addScore(enemy.points);
            
            // Create explosion
            this.particleSystem.createExplosion(
              enemy.mesh.position.x,
              enemy.mesh.position.y,
              enemy.color,
              30
            );
            
            // Chance to spawn power-up
            if (Math.random() < 0.15) {
              this.powerUpManager.spawn(
                enemy.mesh.position.x,
                enemy.mesh.position.y
              );
            }
            
            // Remove enemy
            this.enemyManager.removeEnemy(j);
          }
          
          break;
        }
      }
    }
    
    // Enemy bullets vs player
    if (!this.player.isInvincible) {
      const enemyBullets = this.bulletManager.getEnemyBullets();
      
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        
        if (this.checkCollision(bullet, this.player)) {
          this.bulletManager.removeEnemyBullet(i);
          this.playerHit();
          break;
        }
      }
    }
    
    // Enemies vs player
    if (!this.player.isInvincible) {
      for (const enemy of enemies) {
        if (this.checkCollision(this.player, enemy)) {
          // Destroy enemy
          this.particleSystem.createExplosion(
            enemy.mesh.position.x,
            enemy.mesh.position.y,
            enemy.color,
            30
          );
          this.enemyManager.removeEnemy(enemies.indexOf(enemy));
          this.playerHit();
          break;
        }
      }
    }
    
    // Power-ups vs player
    const powerUps = this.powerUpManager.getPowerUps();
    
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i];
      
      if (this.checkCollision(this.player, powerUp)) {
        this.collectPowerUp(powerUp);
        this.powerUpManager.remove(i);
      }
    }
  }
  
  checkCollision(a, b) {
    const aPos = a.mesh ? a.mesh.position : a.position;
    const bPos = b.mesh ? b.mesh.position : b.position;
    const aRadius = a.radius || 1;
    const bRadius = b.radius || 1;
    
    const dx = aPos.x - bPos.x;
    const dy = aPos.y - bPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (aRadius + bRadius);
  }
  
  playerHit() {
    this.lives--;
    this.updateLivesUI();
    
    // Create explosion at player
    this.particleSystem.createExplosion(
      this.player.mesh.position.x,
      this.player.mesh.position.y,
      0xff3366,
      40
    );
    
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.player.makeInvincible();
      // Reduce power level on death
      this.powerLevel = Math.max(1, this.powerLevel - 1);
      this.player.setPowerLevel(this.powerLevel);
      this.updatePowerUI();
    }
  }
  
  collectPowerUp(powerUp) {
    switch (powerUp.type) {
      case 'power':
        this.powerLevel = Math.min(5, this.powerLevel + 1);
        this.player.setPowerLevel(this.powerLevel);
        this.updatePowerUI();
        break;
      case 'life':
        this.lives = Math.min(5, this.lives + 1);
        this.updateLivesUI();
        break;
      case 'score':
        this.addScore(500);
        break;
    }
    
    // Visual feedback
    this.particleSystem.createExplosion(
      powerUp.mesh.position.x,
      powerUp.mesh.position.y,
      powerUp.color,
      15
    );
  }
  
  addScore(points) {
    this.score += points;
    this.updateUI();
  }
  
  checkWaveProgression() {
    // Increase wave based on score
    const newWave = Math.floor(this.score / 2000) + 1;
    if (newWave > this.wave) {
      this.wave = newWave;
      this.updateWaveUI();
    }
  }
  
  updateUI() {
    document.getElementById('score-value').textContent = this.score.toLocaleString();
  }
  
  updateLivesUI() {
    const livesPanel = document.getElementById('lives-panel');
    livesPanel.innerHTML = '';
    for (let i = 0; i < this.lives; i++) {
      const lifeIcon = document.createElement('div');
      lifeIcon.className = 'life-icon';
      livesPanel.appendChild(lifeIcon);
    }
  }
  
  updatePowerUI() {
    const powerFill = document.getElementById('power-fill');
    powerFill.style.width = `${(this.powerLevel / 5) * 100}%`;
  }
  
  updateWaveUI() {
    document.getElementById('wave-value').textContent = this.wave;
  }
  
  gameOver() {
    this.isRunning = false;
    document.getElementById('final-score').textContent = this.score.toLocaleString();
    document.getElementById('game-over-screen').style.display = 'flex';
  }
}

