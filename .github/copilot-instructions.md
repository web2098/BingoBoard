# AI Coding Agent Instructions for BingoBoard

## Project Overview

This is a **React 18 + TypeScript** Single Page Application (SPA) for a multiplayer bingo game system with dual architecture support:

- **V4 (Legacy)**: Plain HTML/CSS/JavaScript in `/public/v4/` and `/build/v4/`
- **V5 (Modern)**: React + TypeScript SPA in `/src/`

The application features intelligent routing, comprehensive telemetry, real-time multiplayer functionality, and complex game pattern generation.

## Core Architecture Patterns

### 1. Versioned Architecture

The application supports two versions simultaneously:

```typescript
// src/config/versions.ts - Version routing logic
export const getVersionFromPath = (pathname: string): string => {
  if (pathname.includes('/v4/')) return 'v4';
  return 'v5'; // Default to V5
};
```

**Key Files:**
- `src/config/versions.ts` - Version detection and routing
- `public/v4/` - Legacy HTML/CSS/JS implementation
- `src/routes/V5/` - Modern React implementation

**Rules:**
- Always check version context when making changes
- V4 uses vanilla JavaScript, V5 uses React + TypeScript
- Cross-version compatibility is handled through URL routing

### 2. Telemetry System

Comprehensive session tracking and analytics system:

```typescript
// src/utils/telemetry.ts - Core telemetry interfaces
interface GameSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalNumbers: number;
  gameType: string;
  // ... additional properties
}
```

**Key Functions:**
- `startGameSession()` - Initialize new game session
- `recordNumberCall()` - Track number activations with timestamps
- `endCurrentSession()` - Finalize session with statistics
- `getLastCalledNumbers()` - Get current game state
- `detectWinners()` - Analyze winning patterns

**Rules:**
- Always call telemetry functions for game state changes
- Telemetry data persists in localStorage with key `bingo-telemetry-sessions`
- Use telemetry for server synchronization and statistics
- Session management is critical for multiplayer consistency

### 3. Server Interaction System

WebSocket-based multiplayer communication with host/client architecture:

```typescript
// src/serverInteractions/ServerInteractionService.ts - Main service
class ServerInteractionService {
  // Singleton pattern for global state management
  public static getInstance(): ServerInteractionService

  // Host operations
  public async hostRoom(serverUrl: string, authToken: string): Promise<boolean>

  // Client operations
  public async joinRoom(serverUrl: string, roomId: string): Promise<boolean>
}
```

**Connection Flow:**
1. **Host**: `/host` endpoint → WebSocket `/start/{room_id}?room_token={token}`
2. **Client**: Direct WebSocket `/join/{room_id}` → QR code scanning

**Key Classes:**
- `ServerConnection` - Base WebSocket connection with retry logic
- `HostConnection` - Host-specific connection handling
- `ClientConnection` - Client-specific connection handling
- `useServerInteraction` - React hook for component integration

**Message Types:**
- `setup` - Game configuration and state sync
- `activate`/`deactivate` - Number state changes
- `update_free` - Free space toggle
- `modal_activate` - Audience interactions

**Rules:**
- Use singleton pattern: `ServerInteractionService.getInstance()`
- Always handle connection errors and retries
- Sync telemetry data with server messages
- Maintain state consistency between host and clients

### 4. Game Pattern Generation

Complex pattern generation system with rotation and filtering:

```typescript
// src/data/games.ts - Pattern generation functions
function generateSingleBoardRotations(originalPattern: Coordinate[]): Coordinate[][] {
  // Generates all 4 rotations of a pattern
}

function generateDoubleBingoRotations(originalPatterns: Coordinate[][]): Coordinate[][] {
  // Handles complex multi-pattern rotations
}
```

**Key Features:**
- Coordinate-based pattern system: `{row: number, col: number}`
- Free space handling at position `{row: 2, col: 2}`
- Pattern caching for performance
- Rotation algorithms for pattern variations
- Shuffle functions for randomization

**Rules:**
- Always use coordinate system for pattern definitions
- Handle free space exclusion in pattern validation
- Cache generated patterns for performance
- Use provided utility functions for transformations

### 5. Component Architecture

React components with CSS Modules and TypeScript:

```typescript
// Example component structure
interface ComponentProps {
  // Always define prop interfaces
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // Component implementation
};
```

**Key Patterns:**
- CSS Modules: `ComponentName.module.css`
- TypeScript interfaces for all props
- React Router v6 for navigation
- Custom hooks for shared logic

**Important Components:**
- `SidebarWithMenu` - Main navigation
- `ClientLog` - Telemetry display
- `QRCode` - Server connection QR codes
- `AudienceInteractionButtons` - Interactive features

## Development Guidelines

### File Organization

```
src/
├── components/          # Reusable React components
├── routes/V5/          # Page-level components
├── serverInteractions/ # WebSocket communication
├── utils/              # Utility functions (telemetry, etc.)
├── data/               # Game data and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

### Key Development Rules

1. **Telemetry Integration**
   ```typescript
   // Always call telemetry for state changes
   import { recordNumberCall, getLastCalledNumbers } from '../utils/telemetry';

   const handleNumberClick = (number: number) => {
     recordNumberCall(number, true); // true = activated
     // ... rest of logic
   };
   ```

2. **Server Synchronization**
   ```typescript
   // Use server hooks consistently
   const {
     sendNumberActivated,
     sendNumberDeactivated,
     isConnected
   } = useServerInteraction();

   // Always sync with server
   if (isConnected) {
     sendNumberActivated(number, totalActiveSpots);
   }
   ```

3. **Pattern Generation**
   ```typescript
   // Use existing game data functions
   import { games } from '../data/games';

   const currentGame = games.find(game => game.name === selectedGameName);
   const patterns = currentGame?.generateBoardAndFilters?.(false) || [];
   ```

4. **Version-Aware Development**
   ```typescript
   // Check version context
   import { getVersionFromPath } from '../config/versions';

   const version = getVersionFromPath(window.location.pathname);
   if (version === 'v4') {
     // Handle V4 compatibility
   }
   ```

### TypeScript Standards

- Use strict type checking
- Define interfaces for all data structures
- Use proper React.FC types for components
- Leverage utility types for transformations

### State Management

- React hooks for local state
- Singleton services for global state (ServerInteractionService)
- localStorage for persistence (telemetry, settings)
- No external state management library

### Error Handling

- Implement proper error boundaries
- Handle WebSocket connection failures gracefully
- Provide user feedback for errors
- Log errors appropriately for debugging

## Testing Patterns

- Component testing with React Testing Library
- Mock server interactions in tests
- Test telemetry integration
- Coverage reports available in `/coverage/`

## Build and Deployment

- Create React App build system
- `npm start` for development
- `npm run build` for production
- Static hosting compatible (GitHub Pages configuration)

## Common Pitfalls

1. **Homepage Configuration**: The `package.json` contains `"homepage": "https://web2098.github.io/BingoBoard"` which affects asset paths for GitHub Pages. For local development with `serve`, this can cause loading issues.

2. **Telemetry State**: Always check telemetry state before server operations to ensure data consistency.

3. **Pattern Caching**: Game patterns are cached for performance - clear cache when game configuration changes.

4. **WebSocket State**: Handle connection state changes properly to avoid memory leaks and orphaned connections.

5. **Version Routing**: Be careful with routing logic between V4 and V5 versions to maintain backward compatibility.

## Key Dependencies

- **React 18** + **TypeScript** - Modern React with strict typing
- **React Router v6** - Client-side routing
- **Swiper** - Touch slider components
- **WebSocket API** - Real-time communication
- **CSS Modules** - Scoped styling

This architecture supports complex multiplayer bingo functionality with real-time synchronization, comprehensive analytics, and maintainable code organization. Always consider the dual-version architecture and telemetry requirements when making changes.
