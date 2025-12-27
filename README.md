# Futuristic Doom

A Doom-style first-person shooter with a futuristic neon aesthetic, built entirely with vanilla JavaScript and HTML5 Canvas.

![Futuristic Doom](https://img.shields.io/badge/JavaScript-ES6%2B-yellow) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange) ![Status](https://img.shields.io/badge/Status-Playable-green)

## Features

### 🎮 Core Gameplay
- **Raycasting Engine**: Classic Doom-style pseudo-3D rendering
- **Smooth Movement**: WASD controls with responsive mouse look
- **Dual Weapons**: Switch between Pistol and Machine Gun
- **Enemy AI**: Robots that hunt and attack the player
- **Boss Fight**: Defeat all enemies to face the final boss

### 🎨 Visuals
- **Futuristic Neon Aesthetic**: Cyan/magenta color scheme with glow effects
- **Animated Enemies**: Humanoid robot designs with walking animations
- **Dynamic Lighting**: Brightness based on distance
- **Textured Walls**: Multiple wall types with lighting effects
- **Visual Effects**: Muzzle flash, vignette, ceiling lights

### 🗺️ Level Design
- **Large Map**: 30x30 tile maze with multiple rooms and corridors
- **Interactive Doors**: Press spacebar to open doors
- **Secret Doors**: Hidden passages behind carpets
- **Health Pickups**: Collect glowing green potions throughout the level

### 💊 Items & Inventory
- **Health Potions**: Restore 50% health (press Q to use)
- **Ammo System**: Manage your ammunition, reload when empty
- **Pickup System**: Walk over items to collect them

## Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Mouse** | Look around |
| **Left Click** | Shoot |
| **1** | Select Pistol |
| **2** | Select Machine Gun |
| **Mouse Wheel** | Switch weapons |
| **Q** | Use health potion |
| **Space** | Open doors |
| **R** | Reload |
| **ESC** | Pause menu |

## Weapons

| Weapon | Damage | Fire Rate | Accuracy |
|--------|--------|-----------|----------|
| **Pistol** | 25 | Normal | High |
| **Machine Gun** | 12 | Fast | Medium |

## Project Structure

```
├── index.html          # Main HTML file
├── style.css           # Styling and UI
├── src/
│   ├── game.js         # Main game loop and orchestration
│   ├── config.js       # Game constants and configuration
│   ├── player.js       # Player state and movement
│   ├── enemies.js      # Enemy AI, spawning, and boss logic
│   ├── doors.js        # Door system and collision
│   ├── map.js          # Level layout (30x30 grid)
│   ├── renderer.js     # Raycasting and rendering
│   ├── input.js        # Keyboard and mouse handling
│   └── hud.js          # Health, ammo, and UI elements
└── README.md
```

## How to Play

1. Clone the repository:
   ```bash
   git clone https://github.com/ProgramTjan/Futuristic-Doom.git
   ```

2. Start a local server (required for ES6 modules):
   ```bash
   cd Futuristic-Doom
   npx serve .
   ```

3. Open `http://localhost:3000` in your browser

4. Click **START GAME** and survive!

## Tips

- 🎯 The Machine Gun is great for close combat but less accurate
- 💚 Collect health potions before engaging the boss
- 🚪 Look for secret doors behind carpeted areas
- 🔫 Keep an eye on your ammo - reload during safe moments
- 👾 Defeat all regular enemies to trigger the boss fight

## Technical Details

- **No Dependencies**: Pure vanilla JavaScript
- **ES6 Modules**: Clean, modular code structure
- **Raycasting**: Digital Differential Analyzer (DDA) algorithm
- **60 FPS Target**: Smooth gameplay with requestAnimationFrame

## License

MIT License - Feel free to use, modify, and distribute!

---

*Built with ❤️ using HTML5 Canvas and JavaScript*
