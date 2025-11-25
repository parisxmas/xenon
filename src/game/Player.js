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
    
    // Create textures first
    this.textures = this.createTextures();
    
    this.createMesh();
    this.createEngineGlow();
  }
  
  createTextures() {
    return {
      hull: this.createHullTexture(),
      hullNormal: this.createHullNormalMap(),
      cockpit: this.createCockpitTexture(),
      wing: this.createWingTexture(),
      engine: this.createEngineTexture(),
      emissive: this.createEmissiveTexture()
    };
  }
  
  createHullTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base metallic blue-gray gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#1a3a4a');
    gradient.addColorStop(0.3, '#2a5a6a');
    gradient.addColorStop(0.5, '#3a7a8a');
    gradient.addColorStop(0.7, '#2a5a6a');
    gradient.addColorStop(1, '#1a3a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add panel lines
    ctx.strokeStyle = '#0a2a3a';
    ctx.lineWidth = 2;
    
    // Horizontal lines
    for (let y = 0; y < 512; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let x = 0; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    
    // Add rivets/details
    ctx.fillStyle = '#4a8a9a';
    for (let x = 32; x < 512; x += 64) {
      for (let y = 32; y < 512; y += 64) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add some scratches/wear
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x1 = Math.random() * 512;
      const y1 = Math.random() * 512;
      const x2 = x1 + (Math.random() - 0.5) * 100;
      const y2 = y1 + (Math.random() - 0.5) * 100;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Add cyan accent stripes
    ctx.fillStyle = '#00ffff';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(240, 0, 32, 512);
    ctx.globalAlpha = 1;
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createHullNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base normal (pointing up)
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);
    
    // Panel indentations
    ctx.fillStyle = '#7070ff';
    for (let x = 0; x < 512; x += 64) {
      ctx.fillRect(x, 0, 4, 512);
    }
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(0, y, 512, 4);
    }
    
    // Rivet bumps
    ctx.fillStyle = '#9090ff';
    for (let x = 32; x < 512; x += 64) {
      for (let y = 32; y < 512; y += 64) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  
  createCockpitTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Dark reflective glass with gradient
    const gradient = ctx.createRadialGradient(128, 80, 0, 128, 128, 150);
    gradient.addColorStop(0, '#66ffff');
    gradient.addColorStop(0.3, '#00cccc');
    gradient.addColorStop(0.6, '#006666');
    gradient.addColorStop(1, '#003333');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add reflection highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(100, 60, 60, 30, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(150, 100, 40, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Add HUD elements inside cockpit
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(118, 128);
    ctx.lineTo(138, 128);
    ctx.moveTo(128, 118);
    ctx.lineTo(128, 138);
    ctx.stroke();
    
    // Side indicators
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(40, 180, 30, 4);
    ctx.fillRect(186, 180, 30, 4);
    
    ctx.globalAlpha = 1;
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createWingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Wing base color
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, '#1a2a3a');
    gradient.addColorStop(0.5, '#2a4a5a');
    gradient.addColorStop(1, '#1a2a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Wing stripes
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(0, 100, 256, 20);
    ctx.fillRect(0, 136, 256, 8);
    
    // Edge highlight
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(0, 0, 256, 3);
    ctx.fillRect(0, 253, 256, 3);
    
    // Panel details
    ctx.strokeStyle = '#0a1a2a';
    ctx.lineWidth = 2;
    for (let x = 0; x < 256; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createEngineTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Engine core gradient
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#00ffff');
    gradient.addColorStop(0.5, '#0088aa');
    gradient.addColorStop(0.8, '#004466');
    gradient.addColorStop(1, '#001122');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    // Add concentric rings
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    for (let r = 10; r < 60; r += 15) {
      ctx.beginPath();
      ctx.arc(64, 64, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createEmissiveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Mostly dark with glowing accents
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 512);
    
    // Glowing stripe
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(240, 0, 32, 512);
    
    // Edge lights
    ctx.fillStyle = '#ff3366';
    for (let y = 0; y < 512; y += 128) {
      ctx.fillRect(0, y, 16, 32);
      ctx.fillRect(496, y, 16, 32);
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createMesh() {
    const shipGroup = new THREE.Group();
    
    // ===== MAIN FUSELAGE =====
    const fuselageShape = new THREE.Shape();
    fuselageShape.moveTo(0, 3);
    fuselageShape.lineTo(-0.8, 1);
    fuselageShape.lineTo(-0.6, -2);
    fuselageShape.lineTo(0, -2.5);
    fuselageShape.lineTo(0.6, -2);
    fuselageShape.lineTo(0.8, 1);
    fuselageShape.closePath();
    
    const fuselageExtrudeSettings = {
      steps: 1,
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.15,
      bevelSegments: 3
    };
    
    const fuselageGeometry = new THREE.ExtrudeGeometry(fuselageShape, fuselageExtrudeSettings);
    fuselageGeometry.center();
    
    const fuselageMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      normalMap: this.textures.hullNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      emissiveMap: this.textures.emissive,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.3
    });
    
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.z = 0.2;
    shipGroup.add(fuselage);
    
    // ===== COCKPIT =====
    const cockpitGeometry = new THREE.SphereGeometry(0.6, 16, 12);
    cockpitGeometry.scale(0.8, 1.2, 0.5);
    
    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      map: this.textures.cockpit,
      color: 0x66ffff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.6,
      thickness: 0.5,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1
    });
    
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.8, 0.6);
    shipGroup.add(cockpit);
    
    // Cockpit frame
    const frameGeometry = new THREE.TorusGeometry(0.55, 0.05, 8, 16);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a5a6a,
      metalness: 0.9,
      roughness: 0.2
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 0.8, 0.65);
    frame.rotation.x = Math.PI / 2;
    frame.scale.set(0.8, 1.2, 1);
    shipGroup.add(frame);
    
    // ===== WINGS =====
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.5, -0.5);
    wingShape.lineTo(2.8, -0.8);
    wingShape.lineTo(2.5, -1);
    wingShape.lineTo(0.3, -0.8);
    wingShape.lineTo(0, -0.3);
    wingShape.closePath();
    
    const wingExtrudeSettings = {
      steps: 1,
      depth: 0.15,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    };
    
    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    
    const wingMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.wing,
      metalness: 0.7,
      roughness: 0.4,
      emissive: new THREE.Color(0xff3366),
      emissiveIntensity: 0.2
    });
    
    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.3, -0.3, 0.2);
    leftWing.rotation.y = Math.PI;
    leftWing.rotation.z = 0.1;
    shipGroup.add(leftWing);
    
    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.3, -0.3, 0.2);
    rightWing.rotation.z = -0.1;
    shipGroup.add(rightWing);
    
    // ===== WING TIPS (with lights) =====
    const wingTipGeometry = new THREE.ConeGeometry(0.15, 0.5, 6);
    const wingTipMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xff3366,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    });
    
    const leftWingTip = new THREE.Mesh(wingTipGeometry, wingTipMaterial);
    leftWingTip.position.set(-2.6, -0.7, 0.25);
    leftWingTip.rotation.z = Math.PI / 2;
    shipGroup.add(leftWingTip);
    
    const rightWingTip = new THREE.Mesh(wingTipGeometry, wingTipMaterial);
    rightWingTip.position.set(2.6, -0.7, 0.25);
    rightWingTip.rotation.z = -Math.PI / 2;
    shipGroup.add(rightWingTip);
    
    // ===== ENGINE NACELLES =====
    const nacelleGeometry = new THREE.CylinderGeometry(0.25, 0.35, 1.5, 12);
    const nacelleMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      metalness: 0.8,
      roughness: 0.3
    });
    
    // Left nacelle
    const leftNacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    leftNacelle.position.set(-1, -0.8, 0.2);
    leftNacelle.rotation.x = Math.PI / 2;
    shipGroup.add(leftNacelle);
    
    // Right nacelle
    const rightNacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    rightNacelle.position.set(1, -0.8, 0.2);
    rightNacelle.rotation.x = Math.PI / 2;
    shipGroup.add(rightNacelle);
    
    // ===== ENGINE EXHAUSTS =====
    const exhaustGeometry = new THREE.CylinderGeometry(0.3, 0.2, 0.3, 12);
    const exhaustMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.engine,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    
    // Left exhaust
    const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    leftExhaust.position.set(-1, -1.6, 0.2);
    leftExhaust.rotation.x = Math.PI / 2;
    shipGroup.add(leftExhaust);
    
    // Right exhaust
    const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    rightExhaust.position.set(1, -1.6, 0.2);
    rightExhaust.rotation.x = Math.PI / 2;
    shipGroup.add(rightExhaust);
    
    // Center exhaust
    const centerExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    centerExhaust.position.set(0, -2.3, 0.2);
    centerExhaust.rotation.x = Math.PI / 2;
    centerExhaust.scale.set(1.2, 1, 1.2);
    shipGroup.add(centerExhaust);
    
    // ===== FRONT NOSE DETAIL =====
    const noseGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 2.8, 0.3);
    nose.rotation.x = -Math.PI / 2;
    shipGroup.add(nose);
    
    // ===== WEAPON MOUNTS =====
    const weaponMountGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const weaponMountMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2
    });
    
    const leftWeapon = new THREE.Mesh(weaponMountGeometry, weaponMountMaterial);
    leftWeapon.position.set(-0.5, 1.5, 0.4);
    shipGroup.add(leftWeapon);
    
    const rightWeapon = new THREE.Mesh(weaponMountGeometry, weaponMountMaterial);
    rightWeapon.position.set(0.5, 1.5, 0.4);
    shipGroup.add(rightWeapon);
    
    // Weapon barrels
    const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 1,
      roughness: 0.1
    });
    
    const leftBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    leftBarrel.position.set(-0.5, 2, 0.4);
    leftBarrel.rotation.x = Math.PI / 2;
    shipGroup.add(leftBarrel);
    
    const rightBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    rightBarrel.position.set(0.5, 2, 0.4);
    rightBarrel.rotation.x = Math.PI / 2;
    shipGroup.add(rightBarrel);
    
    // ===== DECORATIVE DETAILS =====
    // Side vents
    const ventGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.05);
    const ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x001a2a,
      metalness: 0.5,
      roughness: 0.5
    });
    
    for (let i = 0; i < 3; i++) {
      const leftVent = new THREE.Mesh(ventGeometry, ventMaterial);
      leftVent.position.set(-0.75, -0.5 + i * 0.25, 0.5);
      shipGroup.add(leftVent);
      
      const rightVent = new THREE.Mesh(ventGeometry, ventMaterial);
      rightVent.position.set(0.75, -0.5 + i * 0.25, 0.5);
      shipGroup.add(rightVent);
    }
    
    // Store reference to exhaust meshes for animation
    this.exhausts = [leftExhaust, rightExhaust, centerExhaust];
    this.wingTips = [leftWingTip, rightWingTip];
    
    this.mesh = shipGroup;
    this.mesh.position.set(0, -18, 0);
    this.mesh.scale.set(1.2, 1.2, 1.2);
    this.scene.add(this.mesh);
  }
  
  createEngineGlow() {
    // Engine glow sprites
    const glowTexture = this.createGlowTexture();
    
    const positions = [
      { x: -1, y: -2, scale: 1.2 },
      { x: 1, y: -2, scale: 1.2 },
      { x: 0, y: -2.8, scale: 1.8 }
    ];
    
    this.engineGlows = [];
    
    for (const pos of positions) {
      const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0x00ffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(pos.scale, pos.scale * 2.5, 1);
      glow.position.set(pos.x, pos.y, 0.2);
      this.mesh.add(glow);
      this.engineGlows.push({ sprite: glow, baseScale: pos.scale });
    }
  }
  
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(100, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(0, 200, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(0, 100, 200, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 50, 100, 0)');
    
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
    
    // Slight tilt when moving (bank)
    const targetRotZ = -moveX * 0.4;
    this.mesh.rotation.z += (targetRotZ - this.mesh.rotation.z) * 0.1;
    
    // Slight pitch based on movement
    const targetRotX = moveX * 0.1;
    this.mesh.rotation.x += (targetRotX - this.mesh.rotation.x) * 0.1;
    
    // Shooting
    this.fireTimer -= delta;
    if (keys['Space'] && this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = this.fireRate;
    }
    
    // Engine glow animation
    const time = Date.now() * 0.003;
    this.engineGlows.forEach((glowData, index) => {
      const pulse = 1 + Math.sin(time + index) * 0.2;
      glowData.sprite.scale.y = glowData.baseScale * 2.5 * pulse;
      glowData.sprite.material.opacity = 0.7 + Math.sin(time * 2 + index) * 0.3;
    });
    
    // Wing tip lights pulse
    if (this.wingTips) {
      const lightPulse = 0.5 + Math.sin(time * 3) * 0.5;
      this.wingTips.forEach(tip => {
        tip.material.emissiveIntensity = 0.4 + lightPulse * 0.6;
      });
    }
    
    // Exhaust glow
    if (this.exhausts) {
      const exhaustPulse = 0.3 + Math.sin(time * 4) * 0.2;
      this.exhausts.forEach(exhaust => {
        exhaust.material.emissiveIntensity = exhaustPulse;
      });
    }
    
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
    this.mesh.rotation.set(0, 0, 0);
    this.powerLevel = 1;
    this.fireRate = 0.12;
    this.isInvincible = false;
    this.mesh.visible = true;
  }
}
