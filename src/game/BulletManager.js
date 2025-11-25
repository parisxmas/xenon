import * as THREE from 'three';

export class BulletManager {
  constructor(scene, bounds) {
    this.scene = scene;
    this.bounds = bounds;
    
    this.playerBullets = [];
    this.enemyBullets = [];
    
    this.playerBulletSpeed = 50;
    this.enemyBulletSpeed = 20;
    
    // Create reusable geometries and materials
    this.playerBulletGeometry = this.createPlayerBulletGeometry();
    this.playerBulletMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    
    this.enemyBulletGeometry = this.createEnemyBulletGeometry();
    this.enemyBulletMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.9
    });
    
    // Glow textures
    this.playerGlowTexture = this.createGlowTexture(0x00ffff);
    this.enemyGlowTexture = this.createGlowTexture(0xff3366);
  }
  
  createPlayerBulletGeometry() {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0.8, 0,
      -0.15, -0.3, 0,
      0.15, -0.3, 0,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }
  
  createEnemyBulletGeometry() {
    return new THREE.SphereGeometry(0.25, 8, 8);
  }
  
  createGlowTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const c = new THREE.Color(color);
    const r = Math.floor(c.r * 255);
    const g = Math.floor(c.g * 255);
    const b = Math.floor(c.b * 255);
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createPlayerBullet(x, y, dirX = 0, damage = 1) {
    const group = new THREE.Group();
    
    // Bullet mesh
    const bullet = new THREE.Mesh(
      this.playerBulletGeometry,
      this.playerBulletMaterial.clone()
    );
    group.add(bullet);
    
    // Glow sprite
    const glowMaterial = new THREE.SpriteMaterial({
      map: this.playerGlowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(1.5, 2, 1);
    group.add(glow);
    
    group.position.set(x, y, 0);
    this.scene.add(group);
    
    this.playerBullets.push({
      mesh: group,
      velocity: new THREE.Vector2(dirX * this.playerBulletSpeed * 0.3, 1),
      damage: damage,
      radius: 0.3
    });
  }
  
  createEnemyBullet(x, y, dirX = 0, dirY = -1) {
    const group = new THREE.Group();
    
    // Bullet mesh
    const bullet = new THREE.Mesh(
      this.enemyBulletGeometry,
      this.enemyBulletMaterial.clone()
    );
    group.add(bullet);
    
    // Glow sprite
    const glowMaterial = new THREE.SpriteMaterial({
      map: this.enemyGlowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(1.2, 1.2, 1);
    group.add(glow);
    
    group.position.set(x, y, 0);
    this.scene.add(group);
    
    this.enemyBullets.push({
      mesh: group,
      velocity: new THREE.Vector2(dirX, dirY).normalize(),
      radius: 0.25
    });
  }
  
  update(delta) {
    // Update player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const bullet = this.playerBullets[i];
      bullet.mesh.position.x += bullet.velocity.x * this.playerBulletSpeed * delta;
      bullet.mesh.position.y += bullet.velocity.y * this.playerBulletSpeed * delta;
      
      // Remove if off screen
      if (bullet.mesh.position.y > this.bounds.top + 5 ||
          bullet.mesh.position.x < this.bounds.left - 5 ||
          bullet.mesh.position.x > this.bounds.right + 5) {
        this.removePlayerBullet(i);
      }
    }
    
    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.mesh.position.x += bullet.velocity.x * this.enemyBulletSpeed * delta;
      bullet.mesh.position.y += bullet.velocity.y * this.enemyBulletSpeed * delta;
      
      // Pulse effect
      const scale = 1 + Math.sin(Date.now() * 0.01 + i) * 0.1;
      bullet.mesh.scale.setScalar(scale);
      
      // Remove if off screen
      if (bullet.mesh.position.y < this.bounds.bottom - 5 ||
          bullet.mesh.position.x < this.bounds.left - 5 ||
          bullet.mesh.position.x > this.bounds.right + 5) {
        this.removeEnemyBullet(i);
      }
    }
  }
  
  getPlayerBullets() {
    return this.playerBullets;
  }
  
  getEnemyBullets() {
    return this.enemyBullets;
  }
  
  removePlayerBullet(index) {
    const bullet = this.playerBullets[index];
    if (bullet) {
      this.scene.remove(bullet.mesh);
      this.playerBullets.splice(index, 1);
    }
  }
  
  removeEnemyBullet(index) {
    const bullet = this.enemyBullets[index];
    if (bullet) {
      this.scene.remove(bullet.mesh);
      this.enemyBullets.splice(index, 1);
    }
  }
  
  reset() {
    // Remove all player bullets
    for (const bullet of this.playerBullets) {
      this.scene.remove(bullet.mesh);
    }
    this.playerBullets = [];
    
    // Remove all enemy bullets
    for (const bullet of this.enemyBullets) {
      this.scene.remove(bullet.mesh);
    }
    this.enemyBullets = [];
  }
}

