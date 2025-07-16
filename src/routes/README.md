# BingoBoard Versions

This folder contains versioned implementations of the BingoBoard application.

## Version 5 (V5) - Current
**Path:** `/src/routes/V5/`

### Features:
- **Enhanced Color System**: Dynamic B/I/N/G/O letter colors and board highlight colors
- **Special Numbers Grid**: Color-coded special number management with dynamic theming
- **Modal Board Preview**: Click-to-preview game boards with pattern rotation
- **Responsive Design**: Mobile-optimized layouts for all screen sizes
- **Real-time Updates**: Live color changes and settings synchronization
- **Double Bingo Support**: Optimized font sizing for different game types
- **Sidebar Navigation**: Unified menu system with page-specific actions

### Components:
- `about-page.tsx` - About page with app information
- `board-page.tsx` - Main game board with dynamic colors and modals
- `select-game-page.tsx` - Game selection with preview and pattern rotation
- `settings-page.tsx` - Settings with color pickers and special numbers grid
- `error-page.tsx` - Error handling page
- `root.jsx` - Root layout component

### CSS Files:
- `about-page.css`
- `board-page.css`
- `select-game-page.css`
- `settings-page.css`
- `select-game-page-clean.css`

## Version Structure
Each version maintains backward compatibility through export wrappers in the main routes folder.

## Adding New Versions
To add a new version:
1. Create a new folder `V{X}` in `/src/routes/`
2. Copy current implementation to the new folder
3. Update import paths for the new folder structure
4. Update main route exports to point to the new version
5. Document changes in this README
