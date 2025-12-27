// HUD Updates
import { TILE } from './config.js';
import { findNearestDoor } from './doors.js';
import { getAliveEnemyCount, getBoss } from './enemies.js';

// DOM elements (set by init)
let healthText, healthFill, ammoText, crosshair, doorHint, enemyCounter, bossHealthBar, weaponDisplay, potionDisplay;

// Initialize HUD elements
export function initHUD() {
    healthText = document.getElementById('healthText');
    healthFill = document.getElementById('healthFill');
    ammoText = document.getElementById('ammoText');
    crosshair = document.getElementById('crosshair');
    doorHint = document.getElementById('doorHint');
    
    // Create enemy counter
    enemyCounter = document.createElement('div');
    enemyCounter.id = 'enemyCounter';
    enemyCounter.style.cssText = 'position: absolute; top: 20px; right: 20px; color: #0ff; font-size: 18px; text-shadow: 0 0 10px #0ff; font-weight: bold;';
    document.getElementById('hud').appendChild(enemyCounter);
    
    // Create boss health bar (hidden by default)
    bossHealthBar = document.createElement('div');
    bossHealthBar.id = 'bossHealthBar';
    bossHealthBar.innerHTML = `
        <div class="boss-name">EINDBAAS</div>
        <div class="boss-bar-container">
            <div class="boss-bar-fill"></div>
        </div>
    `;
    bossHealthBar.style.cssText = `
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        display: none;
        z-index: 50;
    `;
    
    const bossStyle = document.createElement('style');
    bossStyle.textContent = `
        .boss-name {
            color: #ff0;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 0 10px #f00, 0 0 20px #f00;
            margin-bottom: 5px;
            letter-spacing: 3px;
        }
        .boss-bar-container {
            width: 400px;
            height: 25px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #f00;
            box-shadow: 0 0 15px #f00;
        }
        .boss-bar-fill {
            height: 100%;
            width: 100%;
            background: linear-gradient(90deg, #f00, #ff0);
            transition: width 0.2s ease-out;
            box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.3);
        }
    `;
    document.head.appendChild(bossStyle);
    document.getElementById('hud').appendChild(bossHealthBar);
    
    // Create weapon display
    weaponDisplay = document.createElement('div');
    weaponDisplay.id = 'weaponDisplay';
    weaponDisplay.innerHTML = `
        <div class="weapon-name">Pistool</div>
        <div class="weapon-keys">1: Pistool | 2: Machinegeweer</div>
    `;
    weaponDisplay.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        text-align: left;
        z-index: 50;
    `;
    
    const weaponStyle = document.createElement('style');
    weaponStyle.textContent = `
        .weapon-name {
            color: #0ff;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 0 10px #0ff;
            margin-bottom: 5px;
        }
        .weapon-keys {
            color: #888;
            font-size: 12px;
        }
    `;
    document.head.appendChild(weaponStyle);
    document.getElementById('hud').appendChild(weaponDisplay);
    
    // Create potion display
    potionDisplay = document.createElement('div');
    potionDisplay.id = 'potionDisplay';
    potionDisplay.innerHTML = `
        <div class="potion-icon">💚</div>
        <div class="potion-count">1</div>
        <div class="potion-key">[Q]</div>
    `;
    potionDisplay.style.cssText = `
        position: absolute;
        bottom: 80px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 50;
    `;
    
    const potionStyle = document.createElement('style');
    potionStyle.textContent = `
        .potion-icon {
            font-size: 28px;
            filter: drop-shadow(0 0 8px #0f0);
        }
        .potion-count {
            color: #0f0;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 0 10px #0f0;
        }
        .potion-key {
            color: #888;
            font-size: 12px;
        }
    `;
    document.head.appendChild(potionStyle);
    document.getElementById('hud').appendChild(potionDisplay);
}

// Update HUD display
export function updateHUD(player, canvasHeight) {
    // Health
    healthText.textContent = Math.max(0, Math.floor(player.health));
    healthFill.style.width = `${player.health}%`;
    
    // Ammo
    ammoText.textContent = `${player.ammo} / ${player.maxAmmo}`;
    
    // Crosshair position
    if (crosshair) {
        const pitchOffset = Math.tan(player.pitch) * (canvasHeight / 2);
        crosshair.style.transform = `translate(-50%, calc(-50% + ${pitchOffset}px))`;
    }
    
    // Door hint
    const nearestDoor = findNearestDoor(player.x, player.y, player.angle);
    if (doorHint) {
        if (nearestDoor) {
            doorHint.classList.remove('hidden');
            if (nearestDoor.type === TILE.SECRET_DOOR) {
                doorHint.textContent = '🔍 Druk op SPATIE om te onderzoeken...';
            } else {
                doorHint.textContent = '🚪 Druk op SPATIE om deur te openen';
            }
        } else {
            doorHint.classList.add('hidden');
        }
    }
    
    // Enemy counter
    const aliveEnemies = getAliveEnemyCount();
    if (enemyCounter) {
        enemyCounter.textContent = `Vijanden: ${aliveEnemies}`;
    }
    
    // Boss health bar
    const boss = getBoss();
    if (bossHealthBar) {
        if (boss && boss.alive) {
            bossHealthBar.style.display = 'block';
            const bossHealthPercent = (boss.health / boss.maxHealth) * 100;
            const fillBar = bossHealthBar.querySelector('.boss-bar-fill');
            if (fillBar) {
                fillBar.style.width = `${bossHealthPercent}%`;
            }
            // Change name when in phase 2
            const nameEl = bossHealthBar.querySelector('.boss-name');
            if (nameEl && boss.phase === 2) {
                nameEl.textContent = '⚡ EINDBAAS (WOEDE) ⚡';
                nameEl.style.color = '#f00';
            }
        } else {
            bossHealthBar.style.display = 'none';
        }
    }
    
    // Health bar color
    if (player.health > 60) {
        healthFill.style.background = 'linear-gradient(90deg, #0ff, #0af)';
    } else if (player.health > 30) {
        healthFill.style.background = 'linear-gradient(90deg, #ff0, #fa0)';
    } else {
        healthFill.style.background = 'linear-gradient(90deg, #f00, #a00)';
    }
    
    return aliveEnemies;
}

// Update weapon display
export function updateWeaponDisplay(weapon) {
    if (weaponDisplay) {
        const nameElement = weaponDisplay.querySelector('.weapon-name');
        if (nameElement) {
            nameElement.textContent = weapon.name;
            nameElement.style.color = weapon.color;
            nameElement.style.textShadow = `0 0 10px ${weapon.color}`;
        }
    }
}

// Update potion display
export function updatePotionDisplay(count) {
    if (potionDisplay) {
        const countElement = potionDisplay.querySelector('.potion-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }
}
