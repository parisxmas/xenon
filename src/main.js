import * as THREE from 'three';
import { Game } from './game/Game.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  
  // Start button handler
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    game.start();
  });
  
  // Restart button handler
  document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').style.display = 'none';
    game.restart();
  });
});

