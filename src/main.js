import * as THREE from 'three';
import { Game } from './game/Game.js';
import { audioManager } from './game/AudioManager.js';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  const muteBtn = document.getElementById('mute-btn');
  
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
  
  // Mute button handler
  muteBtn.addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', isMuted);
  });
});

