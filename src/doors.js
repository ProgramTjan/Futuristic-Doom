// Door System
import { TILE, DOOR_OPEN_SPEED } from './config.js';
import { getTileType, mapWidth, mapHeight, map } from './map.js';

// Door state storage
export const doors = new Map();

// Check if a tile is a wall (including closed doors)
export function isWall(x, y) {
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return true;
    const tile = map[y][x];
    
    // Regular wall
    if (tile === TILE.WALL) return true;
    
    // Door - check if it's open
    if (tile === TILE.DOOR || tile === TILE.SECRET_DOOR) {
        const doorKey = `${x},${y}`;
        const door = doors.get(doorKey);
        if (door && door.open) return false;
        return true;
    }
    
    return false;
}

// Get door state
export function getDoorState(x, y) {
    const doorKey = `${x},${y}`;
    return doors.get(doorKey) || { open: false, opening: 0 };
}

// Update door animations
export function updateDoors() {
    doors.forEach((door, key) => {
        if (!door.open && door.opening > 0 && door.opening < 1) {
            door.opening = Math.min(1, door.opening + DOOR_OPEN_SPEED);
            if (door.opening >= 1) {
                door.open = true;
            }
        }
    });
}

// Try to open a door (returns true if door found)
export function tryOpenDoor(playerX, playerY, playerAngle) {
    const cos = Math.cos(playerAngle);
    const sin = Math.sin(playerAngle);
    const lookDist = 3;
    
    // Check in a cone in front of player
    for (let offset = -0.3; offset <= 0.3; offset += 0.1) {
        const checkAngle = playerAngle + offset;
        const checkSin = Math.sin(checkAngle);
        const checkCos = Math.cos(checkAngle);
        
        for (let d = 0.5; d <= lookDist; d += 0.2) {
            const checkX = Math.floor(playerX + checkCos * d);
            const checkY = Math.floor(playerY + checkSin * d);
            
            const tileType = getTileType(checkX, checkY);
            
            if (tileType === TILE.DOOR || tileType === TILE.SECRET_DOOR) {
                const doorKey = `${checkX},${checkY}`;
                let door = doors.get(doorKey);
                
                if (!door) {
                    door = { open: false, opening: 0 };
                    doors.set(doorKey, door);
                }
                
                if (!door.open && door.opening === 0) {
                    door.opening = 0.01;
                    return true;
                }
            }
            
            if (tileType === TILE.WALL) break;
        }
    }
    
    // Check adjacent tiles
    const playerTileX = Math.floor(playerX);
    const playerTileY = Math.floor(playerY);
    
    const checkTiles = [
        { x: playerTileX + 1, y: playerTileY },
        { x: playerTileX - 1, y: playerTileY },
        { x: playerTileX, y: playerTileY + 1 },
        { x: playerTileX, y: playerTileY - 1 }
    ];
    
    for (const tile of checkTiles) {
        const tileType = getTileType(tile.x, tile.y);
        if (tileType === TILE.DOOR || tileType === TILE.SECRET_DOOR) {
            const doorKey = `${tile.x},${tile.y}`;
            let door = doors.get(doorKey);
            
            if (!door) {
                door = { open: false, opening: 0 };
                doors.set(doorKey, door);
            }
            
            if (!door.open && door.opening === 0) {
                door.opening = 0.01;
                return true;
            }
        }
    }
    
    return false;
}

// Find nearest door for HUD hint
export function findNearestDoor(playerX, playerY, playerAngle) {
    const lookDist = 3;
    const cos = Math.cos(playerAngle);
    const sin = Math.sin(playerAngle);
    
    for (let d = 0.5; d <= lookDist; d += 0.3) {
        const checkX = Math.floor(playerX + cos * d);
        const checkY = Math.floor(playerY + sin * d);
        
        const tileType = getTileType(checkX, checkY);
        
        if (tileType === TILE.DOOR || tileType === TILE.SECRET_DOOR) {
            const doorKey = `${checkX},${checkY}`;
            const door = doors.get(doorKey);
            if (!door || !door.open) {
                return { x: checkX, y: checkY, type: tileType };
            }
        }
        
        if (tileType === TILE.WALL) break;
    }
    
    // Check adjacent tiles
    const playerTileX = Math.floor(playerX);
    const playerTileY = Math.floor(playerY);
    const checkTiles = [
        { x: playerTileX + 1, y: playerTileY },
        { x: playerTileX - 1, y: playerTileY },
        { x: playerTileX, y: playerTileY + 1 },
        { x: playerTileX, y: playerTileY - 1 }
    ];
    
    for (const tile of checkTiles) {
        const tileType = getTileType(tile.x, tile.y);
        if (tileType === TILE.DOOR || tileType === TILE.SECRET_DOOR) {
            const doorKey = `${tile.x},${tile.y}`;
            const door = doors.get(doorKey);
            if (!door || !door.open) {
                return { x: tile.x, y: tile.y, type: tileType };
            }
        }
    }
    
    return null;
}

// Clear all doors (for game restart)
export function clearDoors() {
    doors.clear();
}

