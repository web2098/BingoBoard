# Assets Directory

This directory contains all static assets used by the application that need to be processed by the build system.

## Structure

```
src/assets/
├── images/
│   └── audience-interactions/
│       ├── battle.jpg          # Content image for battle interaction
│       ├── lightsaber.png      # Icon for executeOrder66 interaction
│       └── order66.gif         # Content image for executeOrder66 interaction
└── audio/
    └── audience-interactions/
        └── order66.mp3         # Audio for executeOrder66 interaction
```

## Usage

Assets in this directory are imported directly into components and processed by the webpack build system. This ensures:

- Proper bundling and optimization
- Cache busting with hashed filenames
- Type safety with TypeScript declarations
- Reliable loading in both development and production

## Import Example

```typescript
import order66Gif from '../assets/images/audience-interactions/order66.gif';
import order66Audio from '../assets/audio/audience-interactions/order66.mp3';

// Use in component
<img src={order66Gif} alt="Order 66" />
```

## Asset Mapping

The settings page uses an asset mapping system to convert JSON path references to actual imported assets:

```typescript
const assetMap = {
  '/images/audience-interactions/order66.gif': order66Gif,
  '/audio/audience-interactions/order66.mp3': order66Audio,
  // ... other assets
};
```

This allows the JSON configuration to reference assets using logical paths while the component uses the properly bundled assets.
