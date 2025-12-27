// Input Handling

// Key state
export const keys = {};

// Mouse state
export const mouse = { x: 0, y: 0, buttons: {} };

// Callbacks
let onWeaponSwitch = null;
let onUsePotion = null;

// Initialize input handlers
export function initInput(canvas, onPause, onOpenDoor, onWeaponSwitchCallback, onUsePotionCallback) {
    onWeaponSwitch = onWeaponSwitchCallback;
    onUsePotion = onUsePotionCallback;
    
    // Keyboard
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        if (e.key === 'Escape') {
            onPause();
        }
        
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            onOpenDoor();
        }
        
        // Weapon switching with number keys
        if (e.key === '1' && onWeaponSwitch) {
            onWeaponSwitch(0); // Pistol
        }
        if (e.key === '2' && onWeaponSwitch) {
            onWeaponSwitch(1); // Machine gun
        }
        
        // Use health potion with Q
        if (e.key === 'q' && onUsePotion) {
            onUsePotion();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse buttons
    canvas.addEventListener('mousedown', (e) => {
        mouse.buttons[e.button] = true;
    });
    
    canvas.addEventListener('mouseup', (e) => {
        mouse.buttons[e.button] = false;
    });
    
    // Mouse wheel for weapon switching
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (onWeaponSwitch) {
            if (e.deltaY < 0) {
                onWeaponSwitch(-1); // Previous weapon (scroll up)
            } else {
                onWeaponSwitch(-2); // Next weapon (scroll down)
            }
        }
    }, { passive: false });
}

// Setup mouse look (call when game starts)
export function setupMouseLook(canvas, onMouseMove) {
    canvas.addEventListener('mousemove', (e) => {
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        onMouseMove(movementX, movementY);
    });
    
    // Only request pointer lock when clicking on the canvas itself
    canvas.addEventListener('click', () => {
        canvas.requestPointerLock();
    });
}

// Request pointer lock
export function requestPointerLock(canvas) {
    canvas.requestPointerLock();
}

// Check if left mouse button is pressed
export function isLeftMousePressed() {
    return mouse.buttons[0] === true;
}

