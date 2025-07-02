// Centralized asset mapping for audience interactions
// This utility provides a centralized way to map public folder paths to imported assets
// Use this instead of duplicating asset imports across components

// Import images
import battleImg from '../assets/images/audience-interactions/battle.jpg';
import lightsaberImg from '../assets/images/audience-interactions/lightsaber.png';
import order66Gif from '../assets/images/audience-interactions/order66.gif';

// Import audio
import order66Audio from '../assets/audio/audience-interactions/order66.mp3';

// Asset mapping for audience interactions
export const assetMap: { [key: string]: string } = {
  '/images/audience-interactions/battle.jpg': battleImg,
  '/images/audience-interactions/lightsaber.png': lightsaberImg,
  '/images/audience-interactions/order66.gif': order66Gif,
  '/audio/audience-interactions/order66.mp3': order66Audio,
};

/**
 * Get the mapped asset URL for a given public path
 * @param publicPath - The public folder path (e.g., '/images/audience-interactions/battle.jpg')
 * @returns The imported asset URL or the original path if no mapping exists
 */
export const getMappedAsset = (publicPath: string): string => {
  return assetMap[publicPath] || publicPath;
};

/**
 * Get the mapped image asset URL for a given public path
 * @param publicPath - The public folder path to an image
 * @returns The imported image URL or the original path if no mapping exists
 */
export const getMappedImage = (publicPath: string): string => {
  return getMappedAsset(publicPath);
};

/**
 * Get the mapped audio asset URL for a given public path
 * @param publicPath - The public folder path to an audio file
 * @returns The imported audio URL or the original path if no mapping exists
 */
export const getMappedAudio = (publicPath: string): string => {
  return getMappedAsset(publicPath);
};

/**
 * Check if an asset path has a mapping
 * @param publicPath - The public folder path to check
 * @returns True if a mapping exists, false otherwise
 */
export const hasAssetMapping = (publicPath: string): boolean => {
  return publicPath in assetMap;
};

/**
 * Get all available asset mappings
 * @returns Object containing all asset path mappings
 */
export const getAllAssetMappings = (): { [key: string]: string } => {
  return { ...assetMap };
};

// Default export object
const assetUtils = {
  assetMap,
  getMappedAsset,
  getMappedImage,
  getMappedAudio,
  hasAssetMapping,
  getAllAssetMappings
};

export default assetUtils;
