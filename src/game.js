// Main Game File
import { PLAYER_DEFAULTS, WEAPONS, HEALTH_POTION_SPAWNS } from './config.js';
import { player, resetPlayer, movePlayer, handleMouseLook } from './player.js';
import { tryOpenDoor, updateDoors, clearDoors } from './doors.js';
import { enemies, spawnEnemies, updateEnemies, checkEnemyHit, getAliveEnemyCount, spawnBoss, isBossSpawned, isBossAlive, resetBoss } from './enemies.js';
import { initRenderer, updateRenderingParams, render, drawMuzzleFlash, setHealthPotions } from './renderer.js';
import { keys, initInput, setupMouseLook, requestPointerLock, isLeftMousePressed } from './input.js';
import { initHUD, updateHUD, updateWeaponDisplay, updatePotionDisplay } from './hud.js';

// Health potions in the level
let healthPotions = [];

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const menu = document.getElementById('menu');
const startButton = document.getElementById('startButton');

// Game State
const gameState = {
    running: false,
    paused: false,
    bossSpawned: false,
    bossDefeated: false
};

// Weapon system
const weaponState = {
    currentWeapon: 'pistol',
    canShoot: true,
    weapons: ['pistol', 'machinegun']
};

// Get current weapon config
function getCurrentWeapon() {
    return WEAPONS[weaponState.currentWeapon];
}

// Initialize health potions in the level
function initHealthPotions() {
    healthPotions = HEALTH_POTION_SPAWNS.map(spawn => ({
        x: spawn.x,
        y: spawn.y,
        collected: false
    }));
    setHealthPotions(healthPotions);
}

// Check if player picks up a health potion
function checkPotionPickup() {
    const pickupRadius = 0.8;
    
    healthPotions.forEach(potion => {
        if (potion.collected) return;
        
        const dx = player.x - potion.x;
        const dy = player.y - potion.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < pickupRadius) {
            potion.collected = true;
            player.healthPotions++;
            updatePotionDisplay(player.healthPotions);
            // Visual/audio feedback could be added here
        }
    });
}

// Use a health potion
function useHealthPotion() {
    if (player.healthPotions > 0 && player.health < 100) {
        player.healthPotions--;
        player.health = Math.min(100, player.health + 50);
        updatePotionDisplay(player.healthPotions);
    }
}

// Switch weapon
function switchWeapon(index) {
    const currentIndex = weaponState.weapons.indexOf(weaponState.currentWeapon);
    let newIndex = index;
    
    // Handle scroll wheel (-1 = previous, -2 = next)
    if (index === -1) {
        newIndex = (currentIndex - 1 + weaponState.weapons.length) % weaponState.weapons.length;
    } else if (index === -2) {
        newIndex = (currentIndex + 1) % weaponState.weapons.length;
    }
    
    if (newIndex >= 0 && newIndex < weaponState.weapons.length) {
        weaponState.currentWeapon = weaponState.weapons[newIndex];
        updateWeaponDisplay(getCurrentWeapon());
    }
}

// Initialize canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateRenderingParams();
}

// Handle enemy attack on player
function onEnemyAttack(damage) {
    player.health -= damage;
    player.health = Math.max(0, player.health);
    
    if (player.health <= 0) {
        gameState.running = false;
        menu.classList.remove('hidden');
        setTimeout(() => alert('Game Over! Je bent verslagen door de vijanden.'), 100);
    }
}

// Shoot
function shoot() {
    const weapon = getCurrentWeapon();
    
    if (player.reloading || player.ammo <= 0 || !weaponState.canShoot) {
        if (player.ammo <= 0) {
            reload();
        }
        return;
    }
    
    player.ammo -= weapon.ammoPerShot;
    weaponState.canShoot = false;
    setTimeout(() => weaponState.canShoot = true, weapon.fireRate);
    
    drawMuzzleFlash(weapon.color);
    
    // Apply weapon spread for accuracy
    const spread = (Math.random() - 0.5) * weapon.spread;
    const shootAngle = player.angle + spread;
    
    // Check for enemy hit with weapon damage
    const hitEnemy = checkEnemyHit(player.x, player.y, shootAngle);
    if (hitEnemy) {
        hitEnemy.takeDamage(weapon.damage);
    }
}

// Reload
function reload() {
    if (player.reloading || player.ammo >= 30) return;
    
    player.reloading = true;
    setTimeout(() => {
        const needed = 30 - player.ammo;
        const available = Math.min(needed, player.maxAmmo - player.ammo);
        player.ammo += available;
        player.maxAmmo -= available;
        player.reloading = false;
    }, 2000);
}

// Toggle pause
function togglePause() {
    if (!gameState.running) return;
    gameState.paused = !gameState.paused;
    menu.classList.toggle('hidden', !gameState.paused);
    
    if (!gameState.paused) {
        requestPointerLock(canvas);
        gameLoop();
    }
}

// Handle door opening
function handleOpenDoor() {
    if (gameState.running && !gameState.paused) {
        tryOpenDoor(player.x, player.y, player.angle);
    }
}

// Handle mouse movement
function handleMouse(movementX, movementY) {
    if (!gameState.running || gameState.paused) return;
    handleMouseLook(movementX, movementY);
}

// Show boss warning
function showBossWarning() {
    const warning = document.createElement('div');
    warning.id = 'bossWarning';
    warning.innerHTML = '⚠️ EINDBAAS VERSCHIJNT ⚠️';
    warning.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        color: #ff0;
        text-shadow: 0 0 20px #f00, 0 0 40px #f00;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        z-index: 1000;
        animation: bossWarn 0.5s ease-in-out 5;
        pointer-events: none;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bossWarn {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(warning);
    
    setTimeout(() => {
        warning.remove();
        style.remove();
    }, 2500);
}

// Start game
function startGame() {
    console.log('startGame called');
    try {
        menu.classList.add('hidden');
        gameState.running = true;
        gameState.paused = false;
        gameState.bossSpawned = false;
        gameState.bossDefeated = false;
        
        console.log('Resetting player...');
        resetPlayer();
        console.log('Player:', player);
        
        console.log('Clearing doors and spawning enemies...');
        clearDoors();
        resetBoss();
        initHealthPotions();
        spawnEnemies(player);
        console.log('Enemies spawned:', enemies.length);
        
        // Update potion display
        updatePotionDisplay(player.healthPotions);
        
        requestPointerLock(canvas);
        console.log('Starting game loop...');
        gameLoop();
    } catch (error) {
        console.error('Error in startGame:', error);
    }
}

// Game loop
function gameLoop() {
    if (!gameState.running || gameState.paused) return;
    
    // Handle shooting
    if (isLeftMousePressed()) {
        shoot();
    }
    
    // Update
    movePlayer(keys);
    updateEnemies(player, onEnemyAttack);
    updateDoors();
    checkPotionPickup();
    
    // Render
    render(player);
    
    // Update HUD
    const aliveEnemies = updateHUD(player, canvas.height);
    
    // Check if all normal enemies are defeated - spawn boss
    if (aliveEnemies === 0 && !gameState.bossSpawned && enemies.length === 0) {
        console.log('All enemies defeated! Spawning boss...');
        gameState.bossSpawned = true;
        spawnBoss(player.x, player.y);
        // Show boss warning
        showBossWarning();
    }
    
    // Check win condition - boss defeated
    if (gameState.bossSpawned && !isBossAlive() && !gameState.bossDefeated) {
        gameState.bossDefeated = true;
        gameState.running = false;
        menu.classList.remove('hidden');
        setTimeout(() => alert('🏆 GEWONNEN! De eindbaas is verslagen!'), 100);
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize
function init() {
    console.log('Init starting...');
    console.log('Canvas:', canvas);
    console.log('Start button:', startButton);
    
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    if (!startButton) {
        console.error('Start button not found!');
        return;
    }
    
    // Initialize renderer FIRST (before resizeCanvas calls updateRenderingParams)
    initRenderer(canvas);
    
    // Now resize canvas (which calls updateRenderingParams)
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    initHUD();
    initInput(canvas, togglePause, handleOpenDoor, switchWeapon, useHealthPotion);
    setupMouseLook(canvas, handleMouse);
    
    startButton.addEventListener('click', () => {
        console.log('Start button clicked!');
        startGame();
    });
    
    // Initial HUD update
    updateHUD(player, canvas.height);
    
    console.log('Init complete!');
}

// Start when DOM is ready
init();

