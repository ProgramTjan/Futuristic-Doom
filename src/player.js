// Player Logic and Movement
import { PLAYER_DEFAULTS, MOVEMENT_SMOOTHING } from './config.js';
import { isWall } from './doors.js';

// Player state
export const player = { ...PLAYER_DEFAULTS };

// Velocity for smooth movement
const velocity = { x: 0, y: 0, angle: 0, pitch: 0 };

// Reset player to defaults
export function resetPlayer() {
    Object.assign(player, PLAYER_DEFAULTS);
}

// Move player based on input keys with smooth interpolation
export function movePlayer(keys) {
    const sin = Math.sin(player.angle);
    const cos = Math.cos(player.angle);
    
    // Target velocity based on input
    let targetVelX = 0;
    let targetVelY = 0;

    if (keys['w']) {
        targetVelX += player.speed * cos;
        targetVelY += player.speed * sin;
    }
    if (keys['s']) {
        targetVelX -= player.speed * cos;
        targetVelY -= player.speed * sin;
    }
    if (keys['a']) {
        targetVelX += player.speed * sin;
        targetVelY -= player.speed * cos;
    }
    if (keys['d']) {
        targetVelX -= player.speed * sin;
        targetVelY += player.speed * cos;
    }

    // Smooth interpolation towards target velocity
    velocity.x += (targetVelX - velocity.x) * MOVEMENT_SMOOTHING;
    velocity.y += (targetVelY - velocity.y) * MOVEMENT_SMOOTHING;
    
    // Apply friction when no input
    if (targetVelX === 0 && targetVelY === 0) {
        velocity.x *= 0.85;
        velocity.y *= 0.85;
    }
    
    // Calculate new position
    const newX = player.x + velocity.x;
    const newY = player.y + velocity.y;

    // Collision detection with sliding
    if (!isWall(Math.floor(newX), Math.floor(player.y))) {
        player.x = newX;
    } else {
        velocity.x *= -0.2; // Bounce back slightly
    }
    if (!isWall(Math.floor(player.x), Math.floor(newY))) {
        player.y = newY;
    } else {
        velocity.y *= -0.2; // Bounce back slightly
    }
}

// Handle mouse look - direct and responsive
export function handleMouseLook(movementX, movementY) {
    // Direct mouse input for precise aiming
    player.angle += movementX * 0.002;
    player.pitch -= movementY * 0.002;
    player.pitch = Math.max(-player.maxPitch, Math.min(player.maxPitch, player.pitch));
}

// Reload weapon
export function reload(callback) {
    if (player.reloading || player.ammo >= 30) return;
    
    player.reloading = true;
    setTimeout(() => {
        const needed = 30 - player.ammo;
        const available = Math.min(needed, player.maxAmmo - player.ammo);
        player.ammo += available;
        player.maxAmmo -= available;
        player.reloading = false;
        if (callback) callback();
    }, 2000);
}

// Take damage
export function takeDamage(amount) {
    player.health -= amount;
    player.health = Math.max(0, player.health);
    return player.health <= 0;
}

