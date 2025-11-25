import * as THREE from 'three';

export class PowerUpManager {
  constructor(scene, bounds) {
    this.scene = scene;
    this.bounds = bounds;
    this.powerUps = [];
    
    this.types = [
      { type: 'power', color: 0x00ffff, weight: 50 },
      { type: 'life', color: 0xff3366, weight: 20 },
      { type: 'score', color: 0xffcc00, weight: 30 }
    ];
  }
  
  spawn(x, y) {
    const typeConfig = this.getRandomType();
    const powerUp = this.createPowerUp(x, y, typeConfig);
    this.powerUps.push(powerUp);
  }
  
  getRandomType() {
    const totalWeight = this.types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const type of this.types) {
      random -= type.weight;
      if (random <= 0) return type;
    }
    
    return this.types[0];
  }
  
  createPowerUp(x, y, config) {
    const group = new THREE.Group();
    
    // Outer ring
    const ringGeometry = new THREE.TorusGeometry(0.8, 0.1, 8, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    
    // Inner shape based on type
    let innerMesh;
    
    switch (config.type) {
      case 'power':
        // Lightning bolt shape (simplified as arrow up)
        const powerGeometry = new THREE.BufferGeometry();
        const powerVertices = new Float32Array([
          0, 0.5, 0,
          -0.3, 0, 0,
          0, 0.1, 0,
          0, -0.5, 0,
          0.3, 0, 0,
          0, -0.1, 0,
        ]);
        const powerIndices = [0, 1, 2, 3, 4, 5];
        powerGeometry.setAttribute('position', new THREE.BufferAttribute(powerVertices, 3));
        powerGeometry.setIndex(powerIndices);
        
        innerMesh = new THREE.Mesh(powerGeometry, new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide
        }));
        break;
        
      case 'life':
        // Heart shape (simplified as diamond)
        const lifeGeometry = new THREE.BufferGeometry();
        const lifeVertices = new Float32Array([
          0, 0.4, 0,
          -0.4, 0, 0,
          0, -0.4, 0,
          0.4, 0, 0,
        ]);
        lifeGeometry.setAttribute('position', new THREE.BufferAttribute(lifeVertices, 3));
        lifeGeometry.setIndex([0, 1, 2, 0, 2, 3]);
        
        innerMesh = new THREE.Mesh(lifeGeometry, new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide
        }));
        break;
        
      case 'score':
        // Star shape
        const starGeometry = this.createStarGeometry(0.4, 0.2, 5);
        innerMesh = new THREE.Mesh(starGeometry, new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide
        }));
        break;
    }
    
    if (innerMesh) {
      group.add(innerMesh);
    }
    
    // Glow
    const glowTexture = this.createGlowTexture(config.color);
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(3, 3, 1);
    group.add(glow);
    
    group.position.set(x, y, 0);
    this.scene.add(group);
    
    return {
      mesh: group,
      ring: ring,
      type: config.type,
      color: config.color,
      radius: 1,
      time: 0
    };
  }
  
  createStarGeometry(outerRadius, innerRadius, points) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // Center point
    vertices.push(0, 0, 0);
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }
    
    for (let i = 1; i <= points * 2; i++) {
      indices.push(0, i, i === points * 2 ? 1 : i + 1);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    
    return geometry;
  }
  
  createGlowTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const c = new THREE.Color(color);
    const r = Math.floor(c.r * 255);
    const g = Math.floor(c.g * 255);
    const b = Math.floor(c.b * 255);
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  update(delta) {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.time += delta;
      
      // Float down slowly
      powerUp.mesh.position.y -= 3 * delta;
      
      // Rotate
      powerUp.ring.rotation.z += delta * 2;
      powerUp.mesh.rotation.y += delta;
      
      // Pulse effect
      const scale = 1 + Math.sin(powerUp.time * 4) * 0.1;
      powerUp.mesh.scale.setScalar(scale);
      
      // Remove if off screen
      if (powerUp.mesh.position.y < this.bounds.bottom - 2) {
        this.remove(i);
      }
    }
  }
  
  getPowerUps() {
    return this.powerUps;
  }
  
  remove(index) {
    const powerUp = this.powerUps[index];
    if (powerUp) {
      this.scene.remove(powerUp.mesh);
      this.powerUps.splice(index, 1);
    }
  }
  
  reset() {
    for (const powerUp of this.powerUps) {
      this.scene.remove(powerUp.mesh);
    }
    this.powerUps = [];
  }
}

