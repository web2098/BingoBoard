# Media Assets Organization

**IMPORTANT: Audience interaction assets have been moved to `src/assets/`**

This document describes the current asset organization. Audience interaction assets are now processed by the build system for better optimization.

## Directory Structure

```
public/
├── images/
│   └── audience-interactions/    # LEGACY - moved to src/assets/
├── audio/
│   └── audience-interactions/    # LEGACY - moved to src/assets/
└── [static files]               # favicon.ico, manifest.json, etc.
```

## New Asset Location

Audience interaction assets are now in:
```
src/assets/
├── images/
│   └── audience-interactions/
│       ├── battle.jpg           # Battle "To The Death" image
│       ├── order66.gif          # Execute Order 66 animated GIF
│       └── lightsaber.png       # Lightsaber icon
└── audio/
    └── audience-interactions/
        └── order66.mp3          # Execute Order 66 sound effect
```

## Usage in Code

Assets are now imported and processed by webpack:

```tsx
// Import assets
import order66Gif from '../assets/images/audience-interactions/order66.gif';
import order66Audio from '../assets/audio/audience-interactions/order66.mp3';

// Use in components
<img src={order66Gif} alt="Order 66" />
<audio src={order66Audio} />
```

## Benefits of New Structure

- **Better optimization**: Assets are processed by webpack
- **Cache busting**: Automatic filename hashing
- **Type safety**: TypeScript declarations for imports
- **Bundle splitting**: Better loading performance
- **Development reliability**: Immediate feedback on missing assets

## Migration Status

✅ Images moved to `src/assets/images/audience-interactions/`
✅ Audio moved to `src/assets/audio/audience-interactions/`
✅ Component updated to use asset mapping
✅ TypeScript declarations added for asset types
