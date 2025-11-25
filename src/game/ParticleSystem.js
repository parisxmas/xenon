import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.explosions = [];
    
    // Create reusable particle texture
    this.particleTexture = this.createParticleTexture();
  }
  
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createExplosion(x, y, color, count = 20) {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 5 + Math.random() * 15;
      const size = 0.2 + Math.random() * 0.4;
      
      const material = new THREE.SpriteMaterial({
        map: this.particleTexture,
        color: color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 1
      });
      
      const particle = new THREE.Sprite(material);
      particle.position.set(x, y, 0);
      particle.scale.set(size, size, 1);
      
      this.scene.add(particle);
      
      particles.push({
        mesh: particle,
        velocity: new THREE.Vector2(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        ),
        life: 1,
        decay: 1 + Math.random() * 1.5
      });
    }
    
    // Add core flash
    const flashMaterial = new THREE.SpriteMaterial({
      map: this.particleTexture,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 1
    });
    
    const flash = new THREE.Sprite(flashMaterial);
    flash.position.set(x, y, 0.1);
    flash.scale.set(3, 3, 1);
    this.scene.add(flash);
    
    particles.push({
      mesh: flash,
      velocity: new THREE.Vector2(0, 0),
      life: 1,
      decay: 5,
      isFlash: true
    });
    
    this.explosions.push({
      particles: particles,
      time: 0
    });
  }
  
  update(delta) {
    for (let e = this.explosions.length - 1; e >= 0; e--) {
      const explosion = this.explosions[e];
      explosion.time += delta;
      
      let allDead = true;
      
      for (let p = explosion.particles.length - 1; p >= 0; p--) {
        const particle = explosion.particles[p];
        
        // Update life
        particle.life -= particle.decay * delta;
        
        if (particle.life > 0) {
          allDead = false;
          
          // Update position
          particle.mesh.position.x += particle.velocity.x * delta;
          particle.mesh.position.y += particle.velocity.y * delta;
          
          // Slow down
          particle.velocity.x *= 0.97;
          particle.velocity.y *= 0.97;
          
          // Fade out
          particle.mesh.material.opacity = particle.life;
          
          // Scale down flash quickly
          if (particle.isFlash) {
            const scale = particle.life * 3;
            particle.mesh.scale.set(scale, scale, 1);
          } else {
            // Particles shrink slightly
            const scale = particle.mesh.scale.x * (0.98 + particle.life * 0.02);
            particle.mesh.scale.set(scale, scale, 1);
          }
        } else {
          // Remove dead particle
          this.scene.remove(particle.mesh);
          particle.mesh.material.dispose();
          explosion.particles.splice(p, 1);
        }
      }
      
      // Remove explosion if all particles are dead
      if (allDead || explosion.particles.length === 0) {
        this.explosions.splice(e, 1);
      }
    }
  }
  
  reset() {
    for (const explosion of this.explosions) {
      for (const particle of explosion.particles) {
        this.scene.remove(particle.mesh);
        particle.mesh.material.dispose();
      }
    }
    this.explosions = [];
  }
}

