// Enemy System and AI
import { ENEMY_DEFAULTS, BOSS_DEFAULTS } from './config.js';
import { enemySpawnPoints } from './map.js';
import { isWall } from './doors.js';

// Enemy list
export const enemies = [];

// Boss reference
export let boss = null;

// Enemy class
export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = ENEMY_DEFAULTS.health;
        this.maxHealth = ENEMY_DEFAULTS.health;
        this.speed = ENEMY_DEFAULTS.speed;
        this.size = 0.3;
        this.attackRange = ENEMY_DEFAULTS.attackRange;
        this.attackCooldown = 0;
        this.attackDamage = ENEMY_DEFAULTS.attackDamage;
        this.alive = true;
        this.animationFrame = 0;
        this.stuckCounter = 0;
        this.lastX = x;
        this.lastY = y;
        this.spriteScale = ENEMY_DEFAULTS.spriteScale;
        this.isBoss = false;
    }
    
    update(player, onAttack) {
        if (!this.alive) return;
        
        // Calculate distance to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards player if not too close
        if (distance > 0.5) {
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * this.speed;
            const moveY = Math.sin(angle) * this.speed;
            
            // Store position before movement
            const oldX = this.x;
            const oldY = this.y;
            
            // Try to move
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            const tileX = Math.floor(newX);
            const tileY = Math.floor(newY);
            
            if (!isWall(tileX, tileY)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Try moving only horizontally or vertically
                const tileXOnly = Math.floor(this.x + moveX);
                const tileYOnly = Math.floor(this.y);
                if (!isWall(tileXOnly, tileYOnly)) {
                    this.x += moveX;
                } else {
                    const tileXOnly2 = Math.floor(this.x);
                    const tileYOnly2 = Math.floor(this.y + moveY);
                    if (!isWall(tileXOnly2, tileYOnly2)) {
                        this.y += moveY;
                    } else {
                        // Try perpendicular directions
                        const perpAngle1 = angle + Math.PI / 2;
                        const perpAngle2 = angle - Math.PI / 2;
                        
                        const perpX1 = this.x + Math.cos(perpAngle1) * this.speed;
                        const perpY1 = this.y + Math.sin(perpAngle1) * this.speed;
                        const perpX2 = this.x + Math.cos(perpAngle2) * this.speed;
                        const perpY2 = this.y + Math.sin(perpAngle2) * this.speed;
                        
                        if (!isWall(Math.floor(perpX1), Math.floor(perpY1))) {
                            this.x = perpX1;
                            this.y = perpY1;
                        } else if (!isWall(Math.floor(perpX2), Math.floor(perpY2))) {
                            this.x = perpX2;
                            this.y = perpY2;
                        }
                    }
                }
            }
            
            // Check if moved
            const moved = Math.abs(this.x - oldX) > 0.001 || Math.abs(this.y - oldY) > 0.001;
            if (!moved) {
                this.stuckCounter++;
            } else {
                this.stuckCounter = 0;
            }
            
            this.lastX = this.x;
            this.lastY = this.y;
        }
        
        // Attack player if in range
        if (distance < this.attackRange) {
            this.attackCooldown -= 1;
            if (this.attackCooldown <= 0) {
                if (onAttack) onAttack(this.attackDamage);
                this.attackCooldown = ENEMY_DEFAULTS.attackCooldownFrames;
            }
        } else {
            this.attackCooldown = 0;
        }
        
        this.animationFrame += 0.1;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
        }
    }
}

// Spawn enemies at spawn points
export function spawnEnemies(player) {
    enemies.length = 0;
    enemySpawnPoints.forEach(point => {
        if (!isWall(point.x, point.y)) {
            const distToPlayer = Math.sqrt(
                Math.pow(point.x - player.x, 2) + 
                Math.pow(point.y - player.y, 2)
            );
            if (distToPlayer > 2) {
                enemies.push(new Enemy(point.x, point.y));
            } else {
                // Find nearby valid spawn
                let found = false;
                for (let offsetX = -2; offsetX <= 2 && !found; offsetX++) {
                    for (let offsetY = -2; offsetY <= 2 && !found; offsetY++) {
                        const newX = point.x + offsetX;
                        const newY = point.y + offsetY;
                        if (!isWall(newX, newY)) {
                            const newDist = Math.sqrt(
                                Math.pow(newX - player.x, 2) + 
                                Math.pow(newY - player.y, 2)
                            );
                            if (newDist > 2) {
                                enemies.push(new Enemy(newX, newY));
                                found = true;
                            }
                        }
                    }
                }
            }
        }
    });
    
    // Ensure at least one enemy
    if (enemies.length === 0) {
        enemies.push(new Enemy(8, 8));
    }
}

// Update all enemies
export function updateEnemies(player, onAttack) {
    enemies.forEach(enemy => enemy.update(player, onAttack));
}

// Get alive enemy count
export function getAliveEnemyCount() {
    return enemies.filter(e => e.alive).length;
}

// Check if player shot hits an enemy
export function checkEnemyHit(playerX, playerY, playerAngle, maxDistance = 15) {
    let closestEnemy = null;
    let closestDistance = maxDistance;
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const dx = enemy.x - playerX;
        const dy = enemy.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) return;
        
        const enemyAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(enemyAngle - playerAngle);
        const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
        
        // Generous hitbox - scales with distance (closer = easier, farther = need precision)
        // About 15 degrees at close range, 8 degrees at max range
        const hitboxAngle = 0.15 + (0.15 * (1 - distance / maxDistance));
        
        if (normalizedAngleDiff < hitboxAngle && distance < closestDistance) {
            closestEnemy = enemy;
            closestDistance = distance;
        }
    });
    
    return closestEnemy;
}

// Remove dead enemies
export function removeDeadEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].alive) {
            enemies.splice(i, 1);
        }
    }
}

// Boss class - larger, stronger enemy
export class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = BOSS_DEFAULTS.health;
        this.maxHealth = BOSS_DEFAULTS.health;
        this.speed = BOSS_DEFAULTS.speed;
        this.size = 0.5;
        this.attackRange = BOSS_DEFAULTS.attackRange;
        this.attackCooldown = 0;
        this.attackDamage = BOSS_DEFAULTS.attackDamage;
        this.alive = true;
        this.animationFrame = 0;
        this.stuckCounter = 0;
        this.lastX = x;
        this.lastY = y;
        this.spriteScale = BOSS_DEFAULTS.spriteScale;
        this.isBoss = true;
        this.phase = 1; // Boss phases for different behavior
        this.chargeTimer = 0;
        this.isCharging = false;
    }
    
    update(player, onAttack) {
        if (!this.alive) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Phase 2 at 50% health - faster and more aggressive
        if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed = BOSS_DEFAULTS.speed * 1.5;
            this.attackDamage = BOSS_DEFAULTS.attackDamage * 1.5;
        }
        
        // Charge attack in phase 2
        if (this.phase === 2 && !this.isCharging && Math.random() < 0.005) {
            this.isCharging = true;
            this.chargeTimer = 60;
        }
        
        let currentSpeed = this.speed;
        if (this.isCharging) {
            currentSpeed = this.speed * 3;
            this.chargeTimer--;
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
            }
        }
        
        // Move towards player
        if (distance > 0.8) {
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * currentSpeed;
            const moveY = Math.sin(angle) * currentSpeed;
            
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            const tileX = Math.floor(newX);
            const tileY = Math.floor(newY);
            
            if (!isWall(tileX, tileY)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Try moving only horizontally or vertically
                if (!isWall(Math.floor(this.x + moveX), Math.floor(this.y))) {
                    this.x += moveX;
                } else if (!isWall(Math.floor(this.x), Math.floor(this.y + moveY))) {
                    this.y += moveY;
                }
            }
        }
        
        // Attack player if in range
        if (distance < this.attackRange) {
            this.attackCooldown -= 1;
            if (this.attackCooldown <= 0) {
                if (onAttack) onAttack(this.attackDamage);
                this.attackCooldown = BOSS_DEFAULTS.attackCooldownFrames;
            }
        } else {
            this.attackCooldown = Math.max(0, this.attackCooldown - 1);
        }
        
        this.animationFrame += this.isCharging ? 0.3 : 0.1;
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
        }
    }
}

// Spawn boss
export function spawnBoss(playerX, playerY) {
    // Find a spawn point far from player
    const spawnPoints = [
        { x: 15, y: 15 },
        { x: 3, y: 3 },
        { x: 27, y: 27 },
        { x: 3, y: 27 },
        { x: 27, y: 3 }
    ];
    
    let bestPoint = spawnPoints[0];
    let maxDist = 0;
    
    for (const point of spawnPoints) {
        if (!isWall(point.x, point.y)) {
            const dist = Math.sqrt(
                Math.pow(point.x - playerX, 2) + 
                Math.pow(point.y - playerY, 2)
            );
            if (dist > maxDist) {
                maxDist = dist;
                bestPoint = point;
            }
        }
    }
    
    boss = new Boss(bestPoint.x, bestPoint.y);
    enemies.push(boss);
    return boss;
}

// Check if boss is alive
export function isBossAlive() {
    return boss && boss.alive;
}

// Check if boss has been spawned
export function isBossSpawned() {
    return boss !== null;
}

// Reset boss
export function resetBoss() {
    boss = null;
}

// Get boss reference
export function getBoss() {
    return boss;
}

