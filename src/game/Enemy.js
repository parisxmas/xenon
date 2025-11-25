import * as THREE from 'three';
import { audioManager } from './AudioManager.js';

export class Enemy {
  constructor(scene, x, y, config) {
    this.scene = scene;
    this.type = config.type;
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.points = config.points;
    this.color = config.color;
    this.shootRate = config.shootRate;
    this.shootTimer = Math.random() * this.shootRate;
    
    this.radius = 1.5;
    this.time = Math.random() * Math.PI * 2;
    this.startX = x;
    
    this.createMesh(x, y);
  }
  
  createMesh(x, y) {
    const group = new THREE.Group();
    
    switch (this.type) {
      case 'basic':
        this.createBasicEnemy(group);
        break;
      case 'fast':
        this.createFastEnemy(group);
        break;
      case 'tank':
        this.createTankEnemy(group);
        break;
      case 'zigzag':
        this.createZigzagEnemy(group);
        break;
      case 'bomber':
        this.createBomberEnemy(group);
        break;
      default:
        this.createBasicEnemy(group);
    }
    
    this.mesh = group;
    this.mesh.position.set(x, y, 0);
    this.mesh.rotation.z = Math.PI; // Face downward
    this.scene.add(this.mesh);
  }
  
  createBasicEnemy(group) {
    // Diamond-shaped basic enemy
    const bodyGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 1.5, 0,
      -1.2, 0, 0,
      0, -1, 0,
      1.2, 0, 0,
    ]);
    const indices = [0, 1, 2, 0, 2, 3];
    
    bodyGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    bodyGeometry.setIndex(indices);
    bodyGeometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);
    
    // Core glow
    const coreGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
  }
  
  createFastEnemy(group) {
    // Sleek arrow shape
    const bodyGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 2, 0,
      -0.8, -1, 0,
      0, 0, 0,
      0.8, -1, 0,
    ]);
    const indices = [0, 1, 2, 0, 2, 3];
    
    bodyGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    bodyGeometry.setIndex(indices);
    bodyGeometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);
    
    // Trail effect
    const trailGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.1);
    const trailMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.5
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.position.y = -1.5;
    group.add(trail);
    
    this.radius = 1;
  }
  
  createTankEnemy(group) {
    // Large hexagonal tank
    const bodyGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.8, 6);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.2,
      metalness: 0.8,
      roughness: 0.4,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, material);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Cannon
    const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
    const cannon = new THREE.Mesh(cannonGeometry, material);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.y = 1;
    group.add(cannon);
    
    // Armor plates
    const plateGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const plate = new THREE.Mesh(plateGeometry, material);
      plate.position.x = Math.cos(angle) * 1.5;
      plate.position.y = Math.sin(angle) * 1.5;
      plate.rotation.z = angle;
      group.add(plate);
    }
    
    this.radius = 2;
  }
  
  createZigzagEnemy(group) {
    // Crescent shape
    const bodyGeometry = new THREE.TorusGeometry(1, 0.4, 8, 8, Math.PI);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.4,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, material);
    body.rotation.x = Math.PI / 2;
    body.rotation.z = Math.PI / 2;
    group.add(body);
    
    // Center orb
    const orbGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const orbMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    group.add(orb);
  }
  
  createBomberEnemy(group) {
    // Wide bomber shape
    const bodyGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 1, 0,
      -2.5, 0, 0,
      -1.5, -1, 0,
      0, -0.5, 0,
      1.5, -1, 0,
      2.5, 0, 0,
    ]);
    const indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
    
    bodyGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    bodyGeometry.setIndex(indices);
    bodyGeometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3,
      flatShading: true
    });
    
    const body = new THREE.Mesh(bodyGeometry, material);
    group.add(body);
    
    // Bomb bays
    const bayGeometry = new THREE.SphereGeometry(0.3, 6, 6);
    const bayMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    
    const bay1 = new THREE.Mesh(bayGeometry, bayMaterial);
    bay1.position.set(-1, -0.5, 0);
    group.add(bay1);
    
    const bay2 = new THREE.Mesh(bayGeometry, bayMaterial);
    bay2.position.set(1, -0.5, 0);
    group.add(bay2);
    
    this.radius = 2;
  }
  
  update(delta, bulletManager) {
    this.time += delta;
    
    // Movement patterns
    switch (this.type) {
      case 'basic':
        this.mesh.position.y -= this.speed * delta;
        break;
      case 'fast':
        this.mesh.position.y -= this.speed * delta;
        break;
      case 'tank':
        this.mesh.position.y -= this.speed * delta;
        break;
      case 'zigzag':
        this.mesh.position.y -= this.speed * delta;
        this.mesh.position.x = this.startX + Math.sin(this.time * 3) * 5;
        break;
      case 'bomber':
        this.mesh.position.y -= this.speed * delta;
        this.mesh.position.x = this.startX + Math.sin(this.time * 2) * 3;
        break;
    }
    
    // Shooting
    if (this.shootRate > 0) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0 && this.mesh.position.y < 20) {
        this.shoot(bulletManager);
        this.shootTimer = this.shootRate;
      }
    }
    
    // Rotation animation
    this.mesh.rotation.z = Math.PI + Math.sin(this.time * 2) * 0.1;
  }
  
  shoot(bulletManager) {
    const x = this.mesh.position.x;
    const y = this.mesh.position.y - 1.5;
    
    // Play enemy shoot sound
    audioManager.playEnemyShoot();
    
    switch (this.type) {
      case 'basic':
        bulletManager.createEnemyBullet(x, y, 0, -1);
        break;
      case 'tank':
        bulletManager.createEnemyBullet(x, y, -0.1, -1);
        bulletManager.createEnemyBullet(x, y, 0.1, -1);
        break;
      case 'zigzag':
        bulletManager.createEnemyBullet(x, y, 0, -1);
        break;
      case 'bomber':
        bulletManager.createEnemyBullet(x - 1, y, 0, -1);
        bulletManager.createEnemyBullet(x + 1, y, 0, -1);
        bulletManager.createEnemyBullet(x, y, 0, -1);
        break;
    }
  }
  
  takeDamage(damage) {
    this.health -= damage;
    
    // Flash effect
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material.emissive) {
        child.material.emissiveIntensity = 1;
        setTimeout(() => {
          if (child.material) {
            child.material.emissiveIntensity = 0.3;
          }
        }, 50);
      }
    });
    
    return this.health <= 0;
  }
  
  destroy() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

