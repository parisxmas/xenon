import * as THREE from 'three';
import { audioManager } from './AudioManager.js';

export class Player {
  constructor(scene, bounds, bulletManager) {
    this.scene = scene;
    this.bounds = bounds;
    this.bulletManager = bulletManager;
    
    this.speed = 25;
    this.radius = 1.2;
    this.powerLevel = 1;
    this.fireRate = 0.12;
    this.fireTimer = 0;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 2;
    
    this.createMesh();
    this.createEngineGlow();
  }
  
  createMesh() {
    // Main ship body
    const shipGroup = new THREE.Group();
    
    // Central body - sleek design
    const bodyGeometry = new THREE.BufferGeometry();
    const bodyVertices = new Float32Array([
      // Top point
      0, 2.5, 0,
      // Left wing
      -2.2, -1.5, 0,
      // Left inner
      -0.4, -0.8, 0,
      // Bottom center
      0, -1.8, 0,
      // Right inner
      0.4, -0.8, 0,
      // Right wing
      2.2, -1.5, 0,
    ]);
    
    const bodyIndices = [
      0, 2, 1,
      0, 3, 2,
      0, 4, 3,
      0, 5, 4,
    ];
    
    bodyGeometry.setAttribute('position', new THREE.BufferAttribute(bodyVertices, 3));
    bodyGeometry.setIndex(bodyIndices);
    bodyGeometry.computeVertexNormals();
    
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ddff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x003344,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.z = 0.5;
    shipGroup.add(body);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.5, 8, 6);
    cockpitGeometry.scale(0.6, 0.8, 0.3);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x66ffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.3, 0.8);
    shipGroup.add(cockpit);
    
    // Wing details
    const wingDetailGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.15);
    const wingDetailMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xff3366,
      emissiveIntensity: 0.3
    });
    
    const leftWingDetail = new THREE.Mesh(wingDetailGeometry, wingDetailMaterial);
    leftWingDetail.position.set(-1.2, -0.5, 0.5);
    leftWingDetail.rotation.z = 0.3;
    shipGroup.add(leftWingDetail);
    
    const rightWingDetail = new THREE.Mesh(wingDetailGeometry, wingDetailMaterial);
    rightWingDetail.position.set(1.2, -0.5, 0.5);
    rightWingDetail.rotation.z = -0.3;
    shipGroup.add(rightWingDetail);
    
    this.mesh = shipGroup;
    this.mesh.position.set(0, -18, 0);
    this.scene.add(this.mesh);
  }
  
  createEngineGlow() {
    // Engine glow sprites
    const glowTexture = this.createGlowTexture();
    
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x00ffff,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    
    this.engineGlow = new THREE.Sprite(glowMaterial);
    this.engineGlow.scale.set(1.5, 3, 1);
    this.engineGlow.position.set(0, -2.2, 0);
    this.mesh.add(this.engineGlow);
    
    // Secondary engine glows
    const smallGlow1 = new THREE.Sprite(glowMaterial.clone());
    smallGlow1.scale.set(0.8, 1.5, 1);
    smallGlow1.position.set(-0.8, -1.5, 0);
    this.mesh.add(smallGlow1);
    
    const smallGlow2 = new THREE.Sprite(glowMaterial.clone());
    smallGlow2.scale.set(0.8, 1.5, 1);
    smallGlow2.position.set(0.8, -1.5, 0);
    this.mesh.add(smallGlow2);
    
    this.engineGlows = [this.engineGlow, smallGlow1, smallGlow2];
  }
  
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(100, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(0, 200, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 100, 200, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  update(delta, keys) {
    // Movement
    let moveX = 0;
    
    if (keys['ArrowLeft'] || keys['KeyA']) moveX = -1;
    if (keys['ArrowRight'] || keys['KeyD']) moveX = 1;
    
    this.mesh.position.x += moveX * this.speed * delta;
    
    // Clamp to bounds
    this.mesh.position.x = Math.max(this.bounds.left + 2, Math.min(this.bounds.right - 2, this.mesh.position.x));
    
    // Slight tilt when moving
    this.mesh.rotation.z = -moveX * 0.3;
    
    // Shooting
    this.fireTimer -= delta;
    if (keys['Space'] && this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = this.fireRate;
    }
    
    // Engine glow animation
    const glowScale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    this.engineGlows.forEach(glow => {
      glow.scale.y = glow.scale.y * 0.5 + glowScale * (glow === this.engineGlow ? 3 : 1.5) * 0.5;
    });
    
    // Invincibility
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      // Blink effect
      this.mesh.visible = Math.floor(this.invincibleTimer * 10) % 2 === 0;
      
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.mesh.visible = true;
      }
    }
  }
  
  shoot() {
    const x = this.mesh.position.x;
    const y = this.mesh.position.y + 2;
    
    // Play shoot sound
    audioManager.playShoot();
    
    switch (this.powerLevel) {
      case 1:
        // Single shot
        this.bulletManager.createPlayerBullet(x, y, 0, 1);
        break;
      case 2:
        // Double shot
        this.bulletManager.createPlayerBullet(x - 0.5, y, 0, 1);
        this.bulletManager.createPlayerBullet(x + 0.5, y, 0, 1);
        break;
      case 3:
        // Triple shot
        this.bulletManager.createPlayerBullet(x, y, 0, 1);
        this.bulletManager.createPlayerBullet(x - 0.8, y - 0.5, -0.15, 1);
        this.bulletManager.createPlayerBullet(x + 0.8, y - 0.5, 0.15, 1);
        break;
      case 4:
        // Quad spread
        this.bulletManager.createPlayerBullet(x - 0.4, y, 0, 1);
        this.bulletManager.createPlayerBullet(x + 0.4, y, 0, 1);
        this.bulletManager.createPlayerBullet(x - 1, y - 0.3, -0.2, 1);
        this.bulletManager.createPlayerBullet(x + 1, y - 0.3, 0.2, 1);
        break;
      case 5:
        // Maximum power
        this.bulletManager.createPlayerBullet(x, y + 0.3, 0, 1.5);
        this.bulletManager.createPlayerBullet(x - 0.5, y, 0, 1);
        this.bulletManager.createPlayerBullet(x + 0.5, y, 0, 1);
        this.bulletManager.createPlayerBullet(x - 1.2, y - 0.5, -0.25, 1);
        this.bulletManager.createPlayerBullet(x + 1.2, y - 0.5, 0.25, 1);
        break;
    }
  }
  
  setPowerLevel(level) {
    this.powerLevel = level;
    // Faster fire rate with more power
    this.fireRate = 0.12 - (level - 1) * 0.015;
  }
  
  makeInvincible() {
    this.isInvincible = true;
    this.invincibleTimer = this.invincibleDuration;
  }
  
  reset() {
    this.mesh.position.set(0, -18, 0);
    this.mesh.rotation.z = 0;
    this.powerLevel = 1;
    this.fireRate = 0.12;
    this.isInvincible = false;
    this.mesh.visible = true;
  }
}

