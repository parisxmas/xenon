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
    
    // Create textures
    this.textures = this.createTextures();
    
    this.createMesh(x, y);
  }
  
  createTextures() {
    return {
      hull: this.createHullTexture(),
      glow: this.createGlowTexture(),
      panel: this.createPanelTexture(),
      engine: this.createEngineTexture()
    };
  }
  
  createHullTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const color = new THREE.Color(this.color);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);
    
    // Base gradient
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, `rgb(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.3)}, ${Math.floor(b * 0.3)})`);
    gradient.addColorStop(0.5, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);
    gradient.addColorStop(1, `rgb(${Math.floor(r * 0.4)}, ${Math.floor(g * 0.4)}, ${Math.floor(b * 0.4)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Panel lines
    ctx.strokeStyle = `rgba(0, 0, 0, 0.4)`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    
    // Highlight edges
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 248);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const color = new THREE.Color(this.color);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.3)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createPanelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, 128, 128);
    
    // Tech pattern
    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 128; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
    }
    
    // Glowing elements
    const color = new THREE.Color(this.color);
    ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
    ctx.fillRect(56, 20, 16, 4);
    ctx.fillRect(56, 104, 16, 4);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createEngineTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ff6600');
    gradient.addColorStop(0.6, '#ff3300');
    gradient.addColorStop(1, '#330000');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
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
    // Diamond-shaped fighter with details
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      color: this.color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: 0.2
    });
    
    // Main body - extruded diamond
    const diamondShape = new THREE.Shape();
    diamondShape.moveTo(0, 1.5);
    diamondShape.lineTo(-1.2, 0);
    diamondShape.lineTo(0, -1);
    diamondShape.lineTo(1.2, 0);
    diamondShape.closePath();
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };
    
    const bodyGeometry = new THREE.ExtrudeGeometry(diamondShape, extrudeSettings);
    bodyGeometry.center();
    const body = new THREE.Mesh(bodyGeometry, mainMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Cockpit dome
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 12, 8);
    cockpitGeometry.scale(1, 0.8, 0.5);
    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.5,
      emissive: this.color,
      emissiveIntensity: 0.3
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.3, 0.4);
    group.add(cockpit);
    
    // Engine pods
    const podGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
    const podMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const leftPod = new THREE.Mesh(podGeometry, podMaterial);
    leftPod.position.set(-0.6, -0.6, 0.3);
    leftPod.rotation.x = Math.PI / 2;
    group.add(leftPod);
    
    const rightPod = new THREE.Mesh(podGeometry, podMaterial);
    rightPod.position.set(0.6, -0.6, 0.3);
    rightPod.rotation.x = Math.PI / 2;
    group.add(rightPod);
    
    // Engine glow
    this.addEngineGlow(group, [
      { x: -0.6, y: -0.9, scale: 0.6 },
      { x: 0.6, y: -0.9, scale: 0.6 }
    ]);
    
    // Weapon mount
    const weaponGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.1
    });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0, -1.3, 0.3);
    weapon.rotation.x = Math.PI / 2;
    group.add(weapon);
    
    this.radius = 1.2;
  }
  
  createFastEnemy(group) {
    // Sleek dart/arrow shape
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      color: this.color,
      metalness: 0.9,
      roughness: 0.1,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: 0.4
    });
    
    // Streamlined body
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0, 2);
    bodyShape.lineTo(-0.4, 0.5);
    bodyShape.lineTo(-0.6, -0.5);
    bodyShape.lineTo(-0.3, -1);
    bodyShape.lineTo(0, -0.8);
    bodyShape.lineTo(0.3, -1);
    bodyShape.lineTo(0.6, -0.5);
    bodyShape.lineTo(0.4, 0.5);
    bodyShape.closePath();
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2
    };
    
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
    bodyGeometry.center();
    const body = new THREE.Mesh(bodyGeometry, mainMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Sharp nose cone
    const noseGeometry = new THREE.ConeGeometry(0.2, 0.8, 6);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: this.color,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 1.6, 0.15);
    nose.rotation.x = -Math.PI / 2;
    group.add(nose);
    
    // Speed fins
    const finGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.3);
    const finMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const leftFin = new THREE.Mesh(finGeometry, finMaterial);
    leftFin.position.set(-0.5, 0, 0.25);
    leftFin.rotation.z = -0.3;
    group.add(leftFin);
    
    const rightFin = new THREE.Mesh(finGeometry, finMaterial);
    rightFin.position.set(0.5, 0, 0.25);
    rightFin.rotation.z = 0.3;
    group.add(rightFin);
    
    // Trail effect engine
    this.addEngineGlow(group, [
      { x: 0, y: -1.2, scale: 0.8 }
    ]);
    
    // Speed lines (decorative)
    const lineGeometry = new THREE.BoxGeometry(0.02, 1.5, 0.02);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.5
    });
    
    for (let i = -1; i <= 1; i++) {
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(i * 0.15, -0.5, 0.35);
      group.add(line);
    }
    
    this.radius = 1;
  }
  
  createTankEnemy(group) {
    // Heavy armored hexagonal ship
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      color: this.color,
      metalness: 0.8,
      roughness: 0.4,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: 0.15
    });
    
    // Main hexagonal body
    const hexRadius = 1.8;
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const x = Math.cos(angle) * hexRadius;
      const y = Math.sin(angle) * hexRadius;
      if (i === 0) hexShape.moveTo(x, y);
      else hexShape.lineTo(x, y);
    }
    hexShape.closePath();
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.1,
      bevelSegments: 2
    };
    
    const bodyGeometry = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);
    bodyGeometry.center();
    const body = new THREE.Mesh(bodyGeometry, mainMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Central turret
    const turretBaseGeometry = new THREE.CylinderGeometry(0.6, 0.7, 0.4, 8);
    const turretMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.2
    });
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.set(0, 0, 0.6);
    group.add(turretBase);
    
    // Main cannon
    const cannonGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
    const cannonMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 1,
      roughness: 0.1
    });
    const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.position.set(0, -1, 0.6);
    cannon.rotation.x = Math.PI / 2;
    group.add(cannon);
    
    // Armor plates on each corner
    const plateGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      metalness: 0.7,
      roughness: 0.5
    });
    
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.set(
        Math.cos(angle) * 1.4,
        Math.sin(angle) * 1.4,
        0.5
      );
      plate.rotation.z = angle;
      group.add(plate);
    }
    
    // Side weapons
    const sideWeaponGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6);
    
    const leftWeapon = new THREE.Mesh(sideWeaponGeometry, cannonMaterial);
    leftWeapon.position.set(-1.2, -0.8, 0.5);
    leftWeapon.rotation.x = Math.PI / 2;
    group.add(leftWeapon);
    
    const rightWeapon = new THREE.Mesh(sideWeaponGeometry, cannonMaterial);
    rightWeapon.position.set(1.2, -0.8, 0.5);
    rightWeapon.rotation.x = Math.PI / 2;
    group.add(rightWeapon);
    
    // Engine array
    this.addEngineGlow(group, [
      { x: -1, y: 1.2, scale: 0.7 },
      { x: 0, y: 1.5, scale: 0.9 },
      { x: 1, y: 1.2, scale: 0.7 }
    ]);
    
    // Shield generator dome
    const shieldGeometry = new THREE.SphereGeometry(0.3, 12, 8);
    const shieldMaterial = new THREE.MeshPhysicalMaterial({
      color: this.color,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.3,
      emissive: this.color,
      emissiveIntensity: 0.4
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.set(0, 0.5, 0.9);
    group.add(shield);
    
    this.radius = 2;
  }
  
  createZigzagEnemy(group) {
    // Crescent/curved agile ship
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      color: this.color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: 0.3
    });
    
    // Crescent body using torus segment
    const crescentGeometry = new THREE.TorusGeometry(1.2, 0.35, 8, 16, Math.PI);
    const crescent = new THREE.Mesh(crescentGeometry, mainMaterial);
    crescent.rotation.x = Math.PI / 2;
    crescent.rotation.z = Math.PI / 2;
    group.add(crescent);
    
    // Wing extensions
    const wingGeometry = new THREE.ConeGeometry(0.25, 0.8, 6);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.2,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.4, 0, 0);
    leftWing.rotation.z = Math.PI / 2;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.4, 0, 0);
    rightWing.rotation.z = -Math.PI / 2;
    group.add(rightWing);
    
    // Central orb (power core)
    const orbGeometry = new THREE.SphereGeometry(0.45, 16, 12);
    const orbMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: this.color,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.4
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0, 0, 0.2);
    group.add(orb);
    
    // Orb ring
    const ringGeometry = new THREE.TorusGeometry(0.55, 0.05, 8, 24);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0, 0.2);
    group.add(ring);
    this.orbRing = ring;
    
    // Small thrusters at wing tips
    this.addEngineGlow(group, [
      { x: -1.2, y: 0.3, scale: 0.5 },
      { x: 1.2, y: 0.3, scale: 0.5 }
    ]);
    
    // Front sensor
    const sensorGeometry = new THREE.ConeGeometry(0.15, 0.4, 6);
    const sensorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });
    const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    sensor.position.set(0, -0.8, 0.2);
    sensor.rotation.x = Math.PI / 2;
    group.add(sensor);
    
    this.radius = 1.5;
  }
  
  createBomberEnemy(group) {
    // Wide heavy bomber
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: this.textures.hull,
      color: this.color,
      metalness: 0.7,
      roughness: 0.3,
      emissive: new THREE.Color(this.color),
      emissiveIntensity: 0.2
    });
    
    // Main fuselage
    const fuselageShape = new THREE.Shape();
    fuselageShape.moveTo(0, 1);
    fuselageShape.lineTo(-0.8, 0.3);
    fuselageShape.lineTo(-0.6, -1);
    fuselageShape.lineTo(0, -0.7);
    fuselageShape.lineTo(0.6, -1);
    fuselageShape.lineTo(0.8, 0.3);
    fuselageShape.closePath();
    
    const fuselageSettings = {
      steps: 1,
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2
    };
    
    const fuselageGeometry = new THREE.ExtrudeGeometry(fuselageShape, fuselageSettings);
    fuselageGeometry.center();
    const fuselage = new THREE.Mesh(fuselageGeometry, mainMaterial);
    fuselage.rotation.x = Math.PI / 2;
    group.add(fuselage);
    
    // Wide wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2, -0.3);
    wingShape.lineTo(2.5, -0.5);
    wingShape.lineTo(2.3, -0.8);
    wingShape.lineTo(0.5, -0.5);
    wingShape.lineTo(0, -0.3);
    wingShape.closePath();
    
    const wingSettings = {
      steps: 1,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 1
    };
    
    const wingGeometry = new THREE.ExtrudeGeometry(wingShape, wingSettings);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      metalness: 0.6,
      roughness: 0.4,
      emissive: this.color,
      emissiveIntensity: 0.15
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0, 0.2);
    leftWing.rotation.x = Math.PI / 2;
    leftWing.rotation.y = Math.PI;
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0, 0.2);
    rightWing.rotation.x = Math.PI / 2;
    group.add(rightWing);
    
    // Bomb bays
    const bayGeometry = new THREE.SphereGeometry(0.35, 10, 8);
    const bayMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.4
    });
    
    const leftBay = new THREE.Mesh(bayGeometry, bayMaterial);
    leftBay.position.set(-1, -0.3, 0.15);
    leftBay.scale.y = 0.7;
    group.add(leftBay);
    this.leftBay = leftBay;
    
    const centerBay = new THREE.Mesh(bayGeometry, bayMaterial);
    centerBay.position.set(0, -0.5, 0.15);
    centerBay.scale.y = 0.7;
    group.add(centerBay);
    this.centerBay = centerBay;
    
    const rightBay = new THREE.Mesh(bayGeometry, bayMaterial);
    rightBay.position.set(1, -0.3, 0.15);
    rightBay.scale.y = 0.7;
    group.add(rightBay);
    this.rightBay = rightBay;
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.3, 10, 8);
    cockpitGeometry.scale(1, 0.8, 0.5);
    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      emissive: this.color,
      emissiveIntensity: 0.2,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.4
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.5, 0.45);
    group.add(cockpit);
    
    // Engine nacelles
    const nacelleGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8);
    const nacelleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    
    const leftNacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    leftNacelle.position.set(-1.8, -0.2, 0.2);
    leftNacelle.rotation.x = Math.PI / 2;
    group.add(leftNacelle);
    
    const rightNacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    rightNacelle.position.set(1.8, -0.2, 0.2);
    rightNacelle.rotation.x = Math.PI / 2;
    group.add(rightNacelle);
    
    // Engines
    this.addEngineGlow(group, [
      { x: -1.8, y: 0.3, scale: 0.7 },
      { x: 0, y: 0.6, scale: 0.5 },
      { x: 1.8, y: 0.3, scale: 0.7 }
    ]);
    
    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4);
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9
    });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 0.3, 0.7);
    group.add(antenna);
    
    this.radius = 2.2;
  }
  
  addEngineGlow(group, positions) {
    this.engineGlows = [];
    
    for (const pos of positions) {
      const glowMaterial = new THREE.SpriteMaterial({
        map: this.textures.glow,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(pos.scale, pos.scale * 2, 1);
      glow.position.set(pos.x, pos.y, 0.2);
      group.add(glow);
      
      this.engineGlows.push({ sprite: glow, baseScale: pos.scale });
    }
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
        // Slight weave
        this.mesh.position.x = this.startX + Math.sin(this.time * 4) * 0.5;
        break;
      case 'tank':
        this.mesh.position.y -= this.speed * delta;
        break;
      case 'zigzag':
        this.mesh.position.y -= this.speed * delta;
        this.mesh.position.x = this.startX + Math.sin(this.time * 3) * 5;
        // Rotate orb ring
        if (this.orbRing) {
          this.orbRing.rotation.z += delta * 3;
          this.orbRing.rotation.x = Math.sin(this.time * 2) * 0.3;
        }
        break;
      case 'bomber':
        this.mesh.position.y -= this.speed * delta;
        this.mesh.position.x = this.startX + Math.sin(this.time * 2) * 3;
        // Pulse bomb bays
        if (this.leftBay) {
          const pulse = 0.5 + Math.sin(this.time * 5) * 0.3;
          this.leftBay.material.emissiveIntensity = pulse;
          this.centerBay.material.emissiveIntensity = pulse;
          this.rightBay.material.emissiveIntensity = pulse;
        }
        break;
    }
    
    // Engine glow animation
    if (this.engineGlows) {
      this.engineGlows.forEach((glowData, index) => {
        const pulse = 1 + Math.sin(this.time * 5 + index) * 0.3;
        glowData.sprite.scale.y = glowData.baseScale * 2 * pulse;
        glowData.sprite.material.opacity = 0.6 + Math.sin(this.time * 6 + index) * 0.3;
      });
    }
    
    // Shooting
    if (this.shootRate > 0) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0 && this.mesh.position.y < 20) {
        this.shoot(bulletManager);
        this.shootTimer = this.shootRate;
      }
    }
    
    // Subtle rotation animation
    this.mesh.rotation.z = Math.PI + Math.sin(this.time * 2) * 0.05;
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
        bulletManager.createEnemyBullet(x - 0.3, y, -0.1, -1);
        bulletManager.createEnemyBullet(x + 0.3, y, 0.1, -1);
        break;
      case 'zigzag':
        bulletManager.createEnemyBullet(x, y, 0, -1);
        break;
      case 'bomber':
        bulletManager.createEnemyBullet(x - 1, y, -0.05, -1);
        bulletManager.createEnemyBullet(x, y - 0.2, 0, -1);
        bulletManager.createEnemyBullet(x + 1, y, 0.05, -1);
        break;
    }
  }
  
  takeDamage(damage) {
    this.health -= damage;
    
    // Flash effect
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material.emissive) {
        const originalIntensity = child.material.emissiveIntensity;
        child.material.emissiveIntensity = 1;
        setTimeout(() => {
          if (child.material) {
            child.material.emissiveIntensity = originalIntensity;
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
    
    // Dispose textures
    Object.values(this.textures).forEach(texture => {
      if (texture && texture.dispose) {
        texture.dispose();
      }
    });
  }
}
