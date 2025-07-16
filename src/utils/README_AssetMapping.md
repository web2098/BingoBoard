# Asset Mapping Utility

This utility provides centralized asset management for audience interaction assets across the BingoBoard application.

## Purpose

Instead of duplicating asset imports in every component that needs to display audience interaction images or play audio, this utility centralizes all asset mappings in one place.

## Usage

### Import the utility

```typescript
import { getMappedAsset, getMappedImage, getMappedAudio } from '../utils/assetMapping';
```

### Basic usage

```typescript
// Map a public path to an imported asset
const imageUrl = getMappedAsset('/images/audience-interactions/battle.jpg');
const audioUrl = getMappedAsset('/audio/audience-interactions/order66.mp3');

// Use in JSX
<img src={getMappedImage('/images/audience-interactions/lightsaber.png')} alt="Lightsaber" />
```

### Available Functions

- `getMappedAsset(publicPath)` - Get mapped asset URL for any asset type
- `getMappedImage(publicPath)` - Specifically for images (same as getMappedAsset)
- `getMappedAudio(publicPath)` - Specifically for audio (same as getMappedAsset)
- `hasAssetMapping(publicPath)` - Check if a mapping exists
- `getAllAssetMappings()` - Get all available mappings

## Adding New Assets

To add new assets to the mapping:

1. Place the asset file in the appropriate folder under `src/assets/`
2. Add an import statement at the top of `assetMapping.ts`
3. Add the mapping to the `assetMap` object

Example:
```typescript
// Add import
import newImage from '../assets/images/audience-interactions/new-image.jpg';

// Add to assetMap
export const assetMap: { [key: string]: string } = {
  // ...existing mappings...
  '/images/audience-interactions/new-image.jpg': newImage,
};
```

## Benefits

- **Centralized Management**: All asset mappings in one place
- **Type Safety**: TypeScript support for asset paths
- **Build Optimization**: Webpack can properly process and optimize assets
- **Cache Busting**: Imported assets get proper cache-busting hashes
- **Error Prevention**: Reduces likelihood of broken asset paths
- **Maintainability**: Easy to update asset locations without touching multiple files

## Components Using This Utility

- `AudienceInteractionButtons` - For floating interaction buttons
- `SettingsPage` - For audience interaction configuration
- Any future components that need audience interaction assets

## Fallback Behavior

If an asset path is not found in the mapping, the utility returns the original path. This allows for graceful degradation if assets are missing or if public folder assets are used as fallbacks.
