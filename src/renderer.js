// Rendering Functions
import { FOV, MAX_DEPTH, TILE } from './config.js';
import { getTileType, mapWidth, mapHeight } from './map.js';
import { isWall, doors } from './doors.js';
import { enemies } from './enemies.js';

// Rendering context (set by init)
let canvas, ctx;
let dist, projCoeff, numRays, deltaAngle;

// Health potions reference
let healthPotions = [];

export function setHealthPotions(potions) {
    healthPotions = potions;
}

// Initialize renderer
export function initRenderer(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    updateRenderingParams();
}

// Update rendering parameters (call on resize)
export function updateRenderingParams() {
    if (!canvas) return;
    numRays = canvas.width;
    deltaAngle = FOV / numRays;
    dist = canvas.width / (2 * Math.tan(FOV / 2));
    projCoeff = dist;
}

// Cast a single ray
function castRay(player, angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    
    let x = player.x;
    let y = player.y;
    
    const dx = cos / 100;
    const dy = sin / 100;
    
    let depth = 0;
    let hitDoor = false;
    let hitTileType = 0;
    let hitX = 0;
    let hitY = 0;
    let hitSide = 0;
    let doorOpenAmount = 0;
    
    while (depth < MAX_DEPTH) {
        x += dx;
        y += dy;
        depth += 0.01;
        
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        const tileType = getTileType(tileX, tileY);
        
        const fracX = x - tileX;
        const fracY = y - tileY;
        
        if (isWall(tileX, tileY)) {
            hitX = x;
            hitY = y;
            hitTileType = tileType;
            
            if (Math.abs(fracX - 0.5) > Math.abs(fracY - 0.5)) {
                hitSide = 1;
            } else {
                hitSide = 0;
            }
            
            if (tileType === TILE.DOOR || tileType === TILE.SECRET_DOOR) {
                const doorKey = `${tileX},${tileY}`;
                const door = doors.get(doorKey);
                if (door) {
                    doorOpenAmount = door.opening;
                }
                hitDoor = true;
            }
            break;
        }
    }
    
    return { depth, hitDoor, tileType: hitTileType, hitX, hitY, hitSide, doorOpenAmount };
}

// Main render function
export function render(player) {
    const pitchOffset = Math.tan(player.pitch) * dist;
    const horizon = canvas.height / 2 + pitchOffset;
    
    // === CEILING ===
    const ceilingGradient = ctx.createLinearGradient(0, 0, 0, horizon);
    ceilingGradient.addColorStop(0, '#000008');
    ceilingGradient.addColorStop(1, '#001020');
    ctx.fillStyle = ceilingGradient;
    ctx.fillRect(0, 0, canvas.width, horizon);
    
    // Ceiling lights
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    for (let i = 0; i < 30; i++) {
        const starX = (i * 137 + Math.floor(player.angle * 100)) % canvas.width;
        const starY = (i * 89) % Math.max(1, horizon - 50);
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(starX, starY, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // === FLOOR ===
    const floorGradient = ctx.createLinearGradient(0, horizon, 0, canvas.height);
    floorGradient.addColorStop(0, '#002233');
    floorGradient.addColorStop(1, '#000811');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);
    
    // Perspective grid
    ctx.strokeStyle = '#004466';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= 15; i++) {
        const t = i / 15;
        const y = horizon + Math.pow(t, 1.5) * (canvas.height - horizon);
        ctx.globalAlpha = 0.3 + (1 - t) * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    const vanishX = canvas.width / 2;
    for (let i = -8; i <= 8; i++) {
        const baseX = vanishX + i * (canvas.width / 8);
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(vanishX, horizon);
        ctx.lineTo(baseX, canvas.height);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // === RAYCASTING ===
    let rayAngle = player.angle - FOV / 2;
    
    for (let i = 0; i < numRays; i++) {
        const rayResult = castRay(player, rayAngle);
        const depth = rayResult.depth;
        
        const depthFix = depth * Math.cos(rayAngle - player.angle);
        const projHeight = projCoeff / depthFix;
        
        let brightness = Math.max(0.1, 1 - depth / MAX_DEPTH);
        if (rayResult.hitSide === 1) brightness *= 0.7;
        
        const texX = rayResult.hitSide === 0 
            ? rayResult.hitX - Math.floor(rayResult.hitX)
            : rayResult.hitY - Math.floor(rayResult.hitY);
        
        const wallTop = horizon - projHeight / 2;
        const wallHeight = projHeight;
        
        if (rayResult.hitDoor) {
            renderDoorSlice(i, wallTop, wallHeight, brightness, texX, rayResult);
        } else {
            renderWallSlice(i, wallTop, wallHeight, brightness, texX);
        }
        
        rayAngle += deltaAngle;
    }
    
    ctx.shadowBlur = 0;
    
    // Render carpet
    renderCarpet(player, horizon);
    
    // Render enemies
    renderEnemies(player, horizon);
    renderHealthPotions(player, horizon);
    
    // Vignette
    const vignetteGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height / 3,
        canvas.width / 2, canvas.height / 2, canvas.height
    );
    vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignetteGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Render a wall slice
function renderWallSlice(i, wallTop, wallHeight, brightness, texX) {
    const baseR = 20, baseG = 180, baseB = 200;
    const r = Math.floor(baseR * brightness);
    const g = Math.floor(baseG * brightness);
    const b = Math.floor(baseB * brightness);
    
    const panelEdge = (texX < 0.05 || texX > 0.95);
    
    if (panelEdge) {
        ctx.fillStyle = `rgb(${Math.min(255, r + 80)}, ${Math.min(255, g + 80)}, ${Math.min(255, b + 80)})`;
    } else {
        const wallGradient = ctx.createLinearGradient(i, wallTop, i, wallTop + wallHeight);
        wallGradient.addColorStop(0, `rgb(${Math.floor(r * 0.8)}, ${Math.floor(g * 0.8)}, ${Math.floor(b * 0.8)})`);
        wallGradient.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
        wallGradient.addColorStop(0.7, `rgb(${r}, ${g}, ${b})`);
        wallGradient.addColorStop(1, `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)})`);
        ctx.fillStyle = wallGradient;
    }
    
    ctx.fillRect(i, wallTop, 1, wallHeight);
    
    ctx.fillStyle = `rgba(0, 255, 255, ${brightness * 0.8})`;
    ctx.fillRect(i, wallTop, 1, 2);
    
    if (i % 3 === 0) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgb(0, ${g}, ${b})`;
    }
}

// Render a door slice
function renderDoorSlice(i, wallTop, wallHeight, brightness, texX, rayResult) {
    const isSecret = rayResult.tileType === TILE.SECRET_DOOR;
    const openAmount = rayResult.doorOpenAmount;
    
    const doorVisibleHeight = wallHeight * (1 - openAmount);
    const doorTop = wallTop + (wallHeight - doorVisibleHeight);
    
    if (doorVisibleHeight > 1) {
        const dr = isSecret ? Math.floor(60 * brightness) : Math.floor(120 * brightness);
        const dg = isSecret ? Math.floor(60 * brightness) : Math.floor(80 * brightness);
        const db = isSecret ? Math.floor(80 * brightness) : Math.floor(60 * brightness);
        
        const doorGradient = ctx.createLinearGradient(i, doorTop, i, doorTop + doorVisibleHeight);
        doorGradient.addColorStop(0, `rgb(${dr + 30}, ${dg + 20}, ${db + 10})`);
        doorGradient.addColorStop(0.5, `rgb(${dr}, ${dg}, ${db})`);
        doorGradient.addColorStop(1, `rgb(${Math.floor(dr * 0.7)}, ${Math.floor(dg * 0.7)}, ${Math.floor(db * 0.7)})`);
        
        ctx.fillStyle = doorGradient;
        ctx.fillRect(i, doorTop, 1, doorVisibleHeight);
        
        if (i % 8 === 0 && doorVisibleHeight > 20) {
            ctx.strokeStyle = `rgba(${dr + 60}, ${dg + 40}, ${db + 20}, 0.5)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(i, doorTop + 5);
            ctx.lineTo(i, doorTop + doorVisibleHeight - 5);
            ctx.stroke();
        }
        
        const doorCenterCheck = Math.abs((texX - 0.5) * 10);
        if (doorCenterCheck < 1 && !isSecret) {
            ctx.fillStyle = `rgba(255, 200, 100, ${brightness * 0.8})`;
            ctx.fillRect(i, doorTop + doorVisibleHeight * 0.45, 2, doorVisibleHeight * 0.1);
        }
        
        if (isSecret && texX > 0.45 && texX < 0.55) {
            ctx.fillStyle = `rgba(255, 50, 50, ${brightness * 0.6 * (0.5 + 0.5 * Math.sin(Date.now() / 200))})`;
            ctx.fillRect(i, doorTop + doorVisibleHeight * 0.1, 2, doorVisibleHeight * 0.05);
        }
    }
}

// Render carpet tiles
function renderCarpet(player, horizon) {
    for (let mapY = 0; mapY < mapHeight; mapY++) {
        for (let mapX = 0; mapX < mapWidth; mapX++) {
            const tileType = getTileType(mapX, mapY);
            if (tileType !== TILE.CARPET) continue;
            
            const tileCenterX = mapX + 0.5 - player.x;
            const tileCenterY = mapY + 0.5 - player.y;
            const distance = Math.sqrt(tileCenterX * tileCenterX + tileCenterY * tileCenterY);
            
            if (distance > 10) continue;
            
            const angleToTile = Math.atan2(tileCenterY, tileCenterX);
            let relativeAngle = angleToTile - player.angle;
            while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
            while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
            
            if (Math.abs(relativeAngle) > FOV / 2 + 0.2) continue;
            
            const screenX = canvas.width / 2 + Math.tan(relativeAngle) * dist;
            const projSize = (projCoeff / distance) * 0.5;
            const floorY = horizon + (canvas.height - horizon) * (1 / (distance * 0.5 + 0.5));
            
            const brightness = Math.max(0.3, 1 - distance / 10);
            const r = Math.floor(150 * brightness);
            const g = Math.floor(50 * brightness);
            const b = Math.floor(50 * brightness);
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
            ctx.fillRect(screenX - projSize / 2, floorY - projSize / 4, projSize, projSize / 2);
            
            ctx.strokeStyle = `rgba(${r + 40}, ${g + 20}, ${b + 20}, 0.4)`;
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - projSize / 2 + 2, floorY - projSize / 4 + 2, projSize - 4, projSize / 2 - 4);
        }
    }
}

// Render all enemies
function renderEnemies(player, horizon) {
    const sortedEnemies = enemies
        .filter(e => e.alive)
        .map(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx) - player.angle;
            while (angle > Math.PI) angle -= 2 * Math.PI;
            while (angle < -Math.PI) angle += 2 * Math.PI;
            return { enemy, distance, angle };
        })
        .filter(e => Math.abs(e.angle) < FOV / 2 + 0.5)
        .sort((a, b) => b.distance - a.distance);
    
    sortedEnemies.forEach(({ enemy, distance, angle }) => {
        renderEnemy(enemy, distance, angle, player, horizon);
    });
}

// Render single enemy
function renderEnemy(enemy, distance, angle, player, horizon) {
    const screenX = canvas.width / 2 + Math.tan(angle) * dist;
    const scale = enemy.spriteScale || 0.4;
    const spriteHeight = (projCoeff / distance) * scale;
    const spriteWidth = spriteHeight * 0.6;
    const spriteTop = horizon - spriteHeight / 2;
    
    const brightness = Math.max(0.3, 1 - distance / MAX_DEPTH);
    const isBoss = enemy.isBoss || false;
    const isCharging = enemy.isCharging || false;
    const animSpeed = isCharging ? 0.3 : 0.1;
    const animOffset = Math.sin(enemy.animationFrame) * spriteHeight * 0.02;
    const legOffset = Math.sin(enemy.animationFrame * 2) * spriteWidth * 0.1;
    
    // Different colors for boss vs normal enemies
    let bodyR, bodyG, bodyB, accentR, accentG, accentB, glowR, glowG, glowB;
    
    if (isBoss) {
        // Boss: Dark purple/black with golden accents
        bodyR = Math.floor(60 * brightness);
        bodyG = Math.floor(40 * brightness);
        bodyB = Math.floor(80 * brightness);
        // Golden accents for boss
        accentR = Math.floor(255 * brightness);
        accentG = Math.floor(200 * brightness);
        accentB = Math.floor(50 * brightness);
        // Purple glow, red when charging
        if (isCharging) {
            glowR = Math.floor(255 * brightness);
            glowG = Math.floor(50 * brightness);
            glowB = Math.floor(50 * brightness);
        } else {
            glowR = Math.floor(200 * brightness);
            glowG = Math.floor(100 * brightness);
            glowB = Math.floor(255 * brightness);
        }
    } else {
        // Normal enemies: Dark metal with red accents
        bodyR = Math.floor(80 * brightness);
        bodyG = Math.floor(80 * brightness);
        bodyB = Math.floor(100 * brightness);
        accentR = Math.floor(255 * brightness);
        accentG = Math.floor(50 * brightness);
        accentB = Math.floor(50 * brightness);
        glowR = Math.floor(255 * brightness);
        glowG = Math.floor(100 * brightness);
        glowB = Math.floor(100 * brightness);
    }
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgb(${glowR}, ${glowG}, ${glowB})`;
    
    // Legs
    const legWidth = spriteWidth * 0.2;
    const legHeight = spriteHeight * 0.35;
    const legTop = spriteTop + spriteHeight * 0.65 + animOffset;
    
    ctx.fillStyle = `rgb(${bodyR}, ${bodyG}, ${bodyB})`;
    ctx.fillRect(screenX - spriteWidth * 0.25 + legOffset, legTop, legWidth, legHeight);
    ctx.fillRect(screenX + spriteWidth * 0.05 - legOffset, legTop, legWidth, legHeight);
    
    ctx.fillStyle = `rgb(${accentR}, ${accentG}, ${accentB})`;
    ctx.fillRect(screenX - spriteWidth * 0.25 + legOffset, legTop + legHeight * 0.7, legWidth, legHeight * 0.15);
    ctx.fillRect(screenX + spriteWidth * 0.05 - legOffset, legTop + legHeight * 0.7, legWidth, legHeight * 0.15);
    
    // Torso
    const torsoWidth = spriteWidth * 0.6;
    const torsoHeight = spriteHeight * 0.35;
    const torsoTop = spriteTop + spriteHeight * 0.3 + animOffset;
    
    ctx.fillStyle = `rgb(${bodyR}, ${bodyG}, ${bodyB})`;
    ctx.beginPath();
    ctx.moveTo(screenX - torsoWidth / 2, torsoTop + torsoHeight);
    ctx.lineTo(screenX - torsoWidth / 2.5, torsoTop);
    ctx.lineTo(screenX + torsoWidth / 2.5, torsoTop);
    ctx.lineTo(screenX + torsoWidth / 2, torsoTop + torsoHeight);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = `rgb(${accentR}, ${accentG}, ${accentB})`;
    ctx.beginPath();
    ctx.arc(screenX, torsoTop + torsoHeight * 0.4, torsoWidth * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Arms
    const armWidth = spriteWidth * 0.15;
    const armHeight = spriteHeight * 0.3;
    const armTop = torsoTop + torsoHeight * 0.1;
    
    ctx.fillStyle = `rgb(${bodyR}, ${bodyG}, ${bodyB})`;
    ctx.fillRect(screenX - torsoWidth / 2 - armWidth - legOffset * 0.5, armTop, armWidth, armHeight);
    ctx.fillRect(screenX + torsoWidth / 2 + legOffset * 0.5, armTop, armWidth, armHeight);
    
    ctx.fillStyle = `rgb(${accentR}, ${accentG}, ${accentB})`;
    ctx.beginPath();
    ctx.arc(screenX - torsoWidth / 2 - armWidth / 2 - legOffset * 0.5, armTop, armWidth * 0.6, 0, Math.PI * 2);
    ctx.arc(screenX + torsoWidth / 2 + armWidth / 2 + legOffset * 0.5, armTop, armWidth * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Head
    const headWidth = spriteWidth * 0.35;
    const headHeight = spriteHeight * 0.25;
    const headTop = spriteTop + spriteHeight * 0.05 + animOffset;
    
    ctx.fillStyle = `rgb(${bodyR + 20}, ${bodyG + 20}, ${bodyB + 20})`;
    ctx.beginPath();
    ctx.roundRect(screenX - headWidth / 2, headTop, headWidth, headHeight, headWidth * 0.2);
    ctx.fill();
    
    // Visor
    const visorWidth = headWidth * 0.8;
    const visorHeight = headHeight * 0.3;
    const visorTop = headTop + headHeight * 0.3;
    
    ctx.fillStyle = `rgb(${glowR}, ${glowG}, ${glowB})`;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.roundRect(screenX - visorWidth / 2, visorTop, visorWidth, visorHeight, visorHeight * 0.3);
    ctx.fill();
    
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.beginPath();
    ctx.arc(screenX - visorWidth * 0.25, visorTop + visorHeight / 2, visorHeight * 0.2, 0, Math.PI * 2);
    ctx.arc(screenX + visorWidth * 0.25, visorTop + visorHeight / 2, visorHeight * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Neck
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgb(${bodyR - 10}, ${bodyG - 10}, ${bodyB - 10})`;
    ctx.fillRect(screenX - headWidth * 0.2, headTop + headHeight, headWidth * 0.4, spriteHeight * 0.05);
    
    // Outline
    ctx.strokeStyle = `rgba(${glowR}, ${glowG}, ${glowB}, 0.5)`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgb(${glowR}, ${glowG}, ${glowB})`;
    ctx.beginPath();
    ctx.roundRect(screenX - spriteWidth / 2 - 2, spriteTop + animOffset, spriteWidth + 4, spriteHeight, 5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Health bar
    if (enemy.health < enemy.maxHealth) {
        const barWidth = spriteWidth * 1.2;
        const barHeight = spriteHeight * 0.08;
        const barX = screenX - barWidth / 2;
        const barY = spriteTop - barHeight - 10 + animOffset;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        const healthPercent = enemy.health / enemy.maxHealth;
        const hpR = Math.floor(255 * (1 - healthPercent));
        const hpG = Math.floor(255 * healthPercent);
        ctx.fillStyle = `rgb(${hpR}, ${hpG}, 0)`;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

// Draw muzzle flash
export function drawMuzzleFlash(color = '#ffff00') {
    ctx.fillStyle = color;
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
    ctx.fillRect(canvas.width / 2 - 20, canvas.height / 2 - 20, 40, 40);
    ctx.shadowBlur = 0;
}

// Render health potions in the level
function renderHealthPotions(player, horizon) {
    healthPotions.forEach(potion => {
        if (potion.collected) return;
        
        const dx = potion.x - player.x;
        const dy = potion.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.3 || distance > MAX_DEPTH) return;
        
        const potionAngle = Math.atan2(dy, dx);
        let angleDiff = potionAngle - player.angle;
        
        // Normalize angle
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Check if in view
        if (Math.abs(angleDiff) > FOV / 2 + 0.2) return;
        
        const screenX = canvas.width / 2 + Math.tan(angleDiff) * dist;
        const scale = 0.25;
        const spriteHeight = (projCoeff / distance) * scale;
        const spriteWidth = spriteHeight;
        const spriteTop = horizon - spriteHeight / 2 + spriteHeight * 0.3;
        
        const brightness = Math.max(0.4, 1 - distance / MAX_DEPTH);
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        
        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(0, 255, 100, ${pulse * brightness})`;
        
        // Bottle shape
        const bottleWidth = spriteWidth * 0.6;
        const bottleHeight = spriteHeight * 0.7;
        const bottleTop = spriteTop + spriteHeight * 0.1;
        
        // Bottle body (green potion)
        ctx.fillStyle = `rgba(0, ${Math.floor(200 * brightness * pulse)}, ${Math.floor(100 * brightness)}, 0.9)`;
        ctx.beginPath();
        ctx.roundRect(screenX - bottleWidth / 2, bottleTop + bottleHeight * 0.2, bottleWidth, bottleHeight * 0.8, bottleWidth * 0.2);
        ctx.fill();
        
        // Bottle neck
        const neckWidth = bottleWidth * 0.4;
        ctx.fillStyle = `rgba(100, 100, 100, ${brightness})`;
        ctx.fillRect(screenX - neckWidth / 2, bottleTop, neckWidth, bottleHeight * 0.25);
        
        // Cork
        ctx.fillStyle = `rgba(139, 90, 43, ${brightness})`;
        ctx.fillRect(screenX - neckWidth / 2.5, bottleTop - bottleHeight * 0.1, neckWidth * 0.8, bottleHeight * 0.12);
        
        // Liquid shine
        ctx.fillStyle = `rgba(150, 255, 200, ${0.4 * brightness * pulse})`;
        ctx.beginPath();
        ctx.ellipse(screenX - bottleWidth * 0.15, bottleTop + bottleHeight * 0.5, bottleWidth * 0.1, bottleHeight * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Plus symbol on bottle
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * brightness})`;
        const plusSize = bottleWidth * 0.25;
        ctx.fillRect(screenX - plusSize / 6, bottleTop + bottleHeight * 0.4, plusSize / 3, plusSize);
        ctx.fillRect(screenX - plusSize / 2, bottleTop + bottleHeight * 0.5, plusSize, plusSize / 3);
        
        ctx.shadowBlur = 0;
    });
}
