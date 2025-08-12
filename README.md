# ❌ Cross Tetris

A unique twist on the classic Tetris game featuring **dynamic falling directions** and **cross-shaped gameplay area**. Experience Tetris like never before with pieces that fall in all four directions - North, East, South, and West!

## 🎮 Live Demo

**[Play Cross Tetris Now!](https://elecsonj.github.io/cross-tetris/)**

## 🌟 Unique Features

### 🔄 Dynamic Falling Directions
Unlike traditional Tetris where pieces only fall downward, Cross Tetris introduces **4-directional gravity**:
- ⬆️ **North**: Pieces fall upward (toward top)
- ➡️ **East**: Pieces fall rightward 
- ⬇️ **South**: Pieces fall downward (traditional)
- ⬅️ **West**: Pieces fall leftward

Each new piece spawns with a **randomly assigned falling direction**, creating unpredictable and challenging gameplay.

### ✨ Cross-Shaped Game Board
```
     |  North  |
-----|---------|-----
West | Center  | East  
-----|---------|-----
     |  South  |
```
- **Center Area**: 10×10 grid where pieces spawn and can move freely
- **Four Sectors**: 25×10 extensions in each direction for directional falling
- **Sector-Specific Movement**: Pieces are constrained to their falling direction's allowed areas

### 🧠 Intelligent Boundary Management
- **Push-Back System**: Pieces attempting to move outside allowed areas are automatically pushed back into valid regions
- **Wall Kick**: Advanced rotation system with multiple kick attempts for smooth gameplay
- **Ghost Preview**: Semi-transparent preview showing where pieces will land

### 🎯 Advanced Line Clearing
- **Multi-Directional Clearing**: Lines can be cleared in all four sectors
- **Outward Compression**: Cleared lines compress toward the edges (North→top, East→right, South→bottom, West→left)
- **Smart Detection**: Automatic detection of complete lines across different sectors

## 🎲 Gameplay Mechanics

### Controls
| Key | Action |
|-----|--------|
| ⬅️ **Arrow Left** | Move piece left (unless falling East) |
| ➡️ **Arrow Right** | Move piece right (unless falling West) |
| ⬆️ **Arrow Up** | Move piece up (unless falling South) |
| ⬇️ **Arrow Down** | Move piece down (unless falling North) |
| **Space** | Rotate piece clockwise |
| **Enter** | Hard drop (instant fall to landing position) |
| **P** | Pause/Resume |
| **R** | Restart game |

### Scoring System
- **Line Clear**: 100 points × lines cleared × current level
- **Level Progression**: Level increases every 10 lines cleared
- **Speed Increase**: Falling speed increases with level (800ms → 100ms minimum)

## 🛠️ Technical Implementation

### Core Architecture

#### 1. Dynamic Direction System
```javascript
// Falling directions
const NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3;
const DIRECTIONS = ["North", "East", "South", "West"];

// Random direction assignment on piece spawn
currentDirection = Math.floor(Math.random() * 4);
```

#### 2. Collision Detection with Push-Back
```javascript
function calculatePushBack(xPos, yPos, shape, direction) {
    // Calculates boundary violations and required corrections
    // Returns push distances to keep pieces within allowed areas
}
```

#### 3. Advanced Rotation (Wall Kick)
- Multiple kick attempts: (0,0), (-1,0), (1,0), (0,-1), (0,1), (-2,0), (2,0)
- Collision checking after each kick attempt
- Push-back integration for boundary management

#### 4. Multi-Directional Line Clearing
```javascript
function clearLines() {
    // Detects complete lines in all four sectors
    // Compresses remaining blocks toward sector edges
    // North: compress upward, East: compress right, etc.
}
```

### Game Board Structure
- **Total Grid**: 60×60 cells (GRID_WIDTH × GRID_HEIGHT)
- **Center**: Cells [25-34, 25-34] (CENTER_SIZE = 10)
- **Sectors**: 25-cell extensions in each direction
- **Rendering**: HTML5 Canvas with 15px cell size

### Performance Optimizations
- **Efficient Collision Detection**: Early termination on first collision
- **Smart Rendering**: Only redraw when game state changes
- **Memory Management**: Deep copying of piece shapes to prevent mutations
- **Optimized Push-Back**: Combined boundary checking with push calculation

## 🎨 Visual Design

### Color-Coded Sectors
- **North**: Dark Blue `rgb(20, 20, 40)`
- **East**: Dark Green `rgb(20, 40, 20)`
- **South**: Dark Red `rgb(40, 20, 20)`
- **West**: Dark Yellow `rgb(30, 30, 10)`
- **Center**: Gray `rgb(40, 40, 40)`

### Classic Tetromino Colors
- **I-piece**: Cyan
- **T-piece**: Purple  
- **L-piece**: Orange
- **J-piece**: Blue
- **O-piece**: Yellow
- **S-piece**: Green
- **Z-piece**: Red

### Visual Feedback
- **Ghost Pieces**: 30% opacity preview of landing position
- **Grid Lines**: Subtle guides for precise placement
- **Sector Highlighting**: Clear visual separation of game areas

## 🚀 Installation & Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/elecsonJ/cross-tetris.git
cd cross-tetris

# Open in browser (no build process required)
open index.html
# or serve locally
python -m http.server 8000
```

### File Structure
```
cross-tetris/
├── index.html      # Game HTML structure and UI
├── style.css       # Visual styling and responsive design
├── game.js         # Core game logic (1000+ lines)
└── README.md       # This file
```

### Development
No build process required! Pure vanilla JavaScript for maximum compatibility and performance.

**Technologies Used:**
- **HTML5 Canvas** for game rendering
- **Vanilla JavaScript** for game logic
- **CSS3** for UI styling and responsive design
- **RequestAnimationFrame** for smooth 60fps gameplay

## 🧪 Game Logic Highlights

### Piece Movement Constraints
```javascript
// Direction-based movement restrictions
switch (currentDirection) {
    case NORTH: // Can move left/right in center columns only
    case EAST:  // Can move up/down in center rows only  
    case SOUTH: // Can move left/right in center columns only
    case WEST:  // Can move up/down in center rows only
}
```

### Multi-Directional Auto-Fall
```javascript
function moveInFallingDirection() {
    let dx = 0, dy = 0;
    if      (currentDirection === NORTH) dy = -1; // Up
    else if (currentDirection === EAST)  dx = 1;  // Right
    else if (currentDirection === SOUTH) dy = 1;  // Down  
    else if (currentDirection === WEST)  dx = -1; // Left
    
    return moveTetromino(dx, dy);
}
```

## 🎯 Game Design Philosophy

Cross Tetris reimagines the classic puzzle game by:

1. **Breaking the Downward Convention**: Gravity works in all directions
2. **Spatial Awareness Challenge**: Players must think in 4 dimensions
3. **Dynamic Adaptation**: Each piece requires different spatial reasoning
4. **Familiar Yet Novel**: Classic Tetris mechanics with revolutionary twist

## 🏆 Achievements & Challenges

- ✅ **Complex Collision System**: Handles 4-directional physics
- ✅ **Advanced Wall Kick**: Multiple rotation fallback options  
- ✅ **Intelligent Boundaries**: Smart push-back prevents invalid states
- ✅ **Multi-Directional Lines**: Clearing system works in all directions
- ✅ **Smooth Performance**: 60fps gameplay with complex calculations
- ✅ **Pure Vanilla JS**: No framework dependencies, maximum compatibility

## 🎮 Game Strategy Tips

1. **Master Direction Reading**: Pay attention to each piece's falling direction
2. **Plan Sector Usage**: Different sectors require different strategies
3. **Use Ghost Preview**: The semi-transparent preview is crucial for placement
4. **Rotation Mastery**: Learn the wall kick system for tight spaces
5. **Multi-Directional Thinking**: Traditional Tetris strategies need adaptation

## 📱 Browser Compatibility

- ✅ **Chrome/Chromium**: Full support
- ✅ **Firefox**: Full support  
- ✅ **Safari**: Full support
- ✅ **Edge**: Full support
- 📱 **Mobile**: Touch controls not implemented (keyboard required)

## 🔮 Future Enhancements

- [ ] Touch controls for mobile devices
- [ ] Multiplayer support
- [ ] Custom difficulty levels
- [ ] Sound effects and background music
- [ ] High score persistence
- [ ] Piece preview (next piece display)
- [ ] Advanced scoring bonuses

## 🤝 Contributing

This is a personal project showcasing innovative game design and JavaScript programming skills. Feel free to:

- Report bugs or suggest improvements
- Fork and experiment with new mechanics
- Study the code for educational purposes

## 📜 License

This project is open source and available under the MIT License.

---

**Experience gravity in all directions. Master the cross. Conquer Cross Tetris!** 🎮✨