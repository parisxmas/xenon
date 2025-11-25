import * as THREE from 'three';

export class Background {
  constructor(scene) {
    this.scene = scene;
    
    this.starLayers = [];
    this.nebulae = [];
    this.gridLines = [];
    
    this.createStarfield();
    this.createNebula();
    this.createGrid();
  }
  
  createStarfield() {
    // Multiple star layers for parallax effect
    const layers = [
      { count: 400, size: 0.08, speed: 3, z: -5 },
      { count: 300, size: 0.12, speed: 6, z: -3 },
      { count: 150, size: 0.18, speed: 12, z: -1 },
    ];
    
    for (const layer of layers) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];
      
      for (let i = 0; i < layer.count; i++) {
        positions.push(
          (Math.random() - 0.5) * 80,
          (Math.random() - 0.5) * 120,
          layer.z
        );
        
        // Star colors - mostly white with some blue/yellow tints
        const colorChoice = Math.random();
        if (colorChoice < 0.6) {
          colors.push(1, 1, 1); // White
        } else if (colorChoice < 0.8) {
          colors.push(0.7, 0.85, 1); // Blue-white
        } else {
          colors.push(1, 0.9, 0.7); // Yellow-white
        }
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      
      const material = new THREE.PointsMaterial({
        size: layer.size,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: false // Important for orthographic camera
      });
      
      const stars = new THREE.Points(geometry, material);
      this.scene.add(stars);
      
      this.starLayers.push({
        mesh: stars,
        speed: layer.speed,
        positions: positions
      });
    }
  }
  
  createNebula() {
    // Create nebula effect using sprites
    const nebulaColors = [
      0x4400aa, // Purple
      0x0044aa, // Blue
      0x880044, // Magenta
      0x006666, // Teal
    ];
    
    for (let i = 0; i < 8; i++) {
      const texture = this.createNebulaTexture(nebulaColors[i % nebulaColors.length]);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const nebula = new THREE.Sprite(material);
      nebula.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 100,
        -8
      );
      nebula.scale.set(40 + Math.random() * 30, 40 + Math.random() * 30, 1);
      
      this.scene.add(nebula);
      this.nebulae.push({
        mesh: nebula,
        speed: 2 + Math.random() * 3,
        originalY: nebula.position.y
      });
    }
  }
  
  createNebulaTexture(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const c = new THREE.Color(color);
    const r = Math.floor(c.r * 255);
    const g = Math.floor(c.g * 255);
    const b = Math.floor(c.b * 255);
    
    // Create gradient with noise
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.6)`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.2)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add some noise
    const imageData = ctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 40;
      imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
      imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
      imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createGrid() {
    // Create retro grid lines (like 80s sci-fi) - perspective effect
    const gridGroup = new THREE.Group();
    gridGroup.position.z = -10;
    
    // Horizontal scrolling lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0066aa,
      transparent: true,
      opacity: 0.4
    });
    
    for (let i = 0; i < 30; i++) {
      const y = -75 + i * 5;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        -40, y, 0,
        40, y, 0
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const line = new THREE.Line(geometry, lineMaterial.clone());
      gridGroup.add(line);
      this.gridLines.push({
        mesh: line,
        originalY: y,
        speed: 20
      });
    }
    
    // Vertical lines (static)
    const verticalMaterial = new THREE.LineBasicMaterial({
      color: 0x0066aa,
      transparent: true,
      opacity: 0.2
    });
    
    for (let i = -8; i <= 8; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        i * 5, -80, 0,
        i * 5, 80, 0
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const line = new THREE.Line(geometry, verticalMaterial);
      gridGroup.add(line);
    }
    
    this.scene.add(gridGroup);
    
    // Add gradient overlay plane at bottom
    const gradientTexture = this.createGradientTexture();
    const gradientMaterial = new THREE.MeshBasicMaterial({
      map: gradientTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    
    const gradientPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 60),
      gradientMaterial
    );
    gradientPlane.position.set(0, 0, -9);
    this.scene.add(gradientPlane);
  }
  
  createGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, 'rgba(0, 5, 20, 0)');
    gradient.addColorStop(0.3, 'rgba(0, 10, 30, 0.3)');
    gradient.addColorStop(0.6, 'rgba(0, 15, 40, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 20, 50, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  update(delta) {
    // Animate stars
    for (const layer of this.starLayers) {
      const positions = layer.mesh.geometry.attributes.position.array;
      
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= layer.speed * delta;
        
        // Wrap around
        if (positions[i] < -60) {
          positions[i] = 60;
          positions[i - 1] = (Math.random() - 0.5) * 80;
        }
      }
      
      layer.mesh.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate nebulae
    for (const nebula of this.nebulae) {
      nebula.mesh.position.y -= nebula.speed * delta;
      
      // Wrap around
      if (nebula.mesh.position.y < -70) {
        nebula.mesh.position.y = 70;
        nebula.mesh.position.x = (Math.random() - 0.5) * 50;
      }
      
      // Slow rotation
      nebula.mesh.material.rotation += delta * 0.03;
    }
    
    // Animate grid lines (scrolling effect)
    for (const gridLine of this.gridLines) {
      gridLine.mesh.position.y -= gridLine.speed * delta;
      
      // Wrap around
      if (gridLine.mesh.position.y < -75) {
        gridLine.mesh.position.y += 150;
      }
    }
  }
}
