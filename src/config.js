// Game Configuration and Constants

// Raycasting settings
export const FOV = Math.PI / 3; // 60 degrees
export const MAX_DEPTH = 20;

// Door settings
export const DOOR_OPEN_SPEED = 0.03;
export const DOOR_INTERACT_RANGE = 2.5;

// Player defaults
export const PLAYER_DEFAULTS = {
    x: 15,
    y: 7,
    angle: 0,
    pitch: 0,
    speed: 0.12,
    rotationSpeed: 0.03,
    health: 100,
    ammo: 30,
    maxAmmo: 90,
    reloading: false,
    maxPitch: Math.PI / 3,
    healthPotions: 1 // Start with 1 health potion
};

// Health potion pickups in the level
export const HEALTH_POTION_SPAWNS = [
    { x: 5.5, y: 5.5 },   // Near start area
    { x: 20.5, y: 15.5 }, // Middle of map
    { x: 25.5, y: 25.5 }  // Far corner
];

// Enemy settings
export const ENEMY_DEFAULTS = {
    health: 100,
    speed: 0.08,
    attackRange: 1.5,
    attackDamage: 10,
    attackCooldownFrames: 60,
    spriteScale: 0.4 // Smaller enemies
};

// Boss settings
export const BOSS_DEFAULTS = {
    health: 500,
    speed: 0.05,
    attackRange: 2.5,
    attackDamage: 25,
    attackCooldownFrames: 90,
    spriteScale: 1.2 // Larger than normal enemies
};

// Movement smoothing
export const MOVEMENT_SMOOTHING = 0.15; // Lower = smoother but less responsive

// Weapons
export const WEAPONS = {
    pistol: {
        name: 'Pistool',
        damage: 25,
        fireRate: 150, // ms between shots
        ammoPerShot: 1,
        spread: 0.02, // Accuracy (lower = more accurate)
        color: '#0ff'
    },
    machinegun: {
        name: 'Machinegeweer',
        damage: 12,
        fireRate: 80, // Faster fire rate
        ammoPerShot: 1,
        spread: 0.05, // Less accurate
        color: '#f80'
    }
};

// Tile types
export const TILE = {
    EMPTY: 0,
    WALL: 1,
    DOOR: 2,
    CARPET: 3,
    SECRET_DOOR: 4
};

