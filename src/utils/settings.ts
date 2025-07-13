// Settings utility functions and configuration

import settingsData from '../data/settings.json';
import specialNumbersData from '../data/specialNumbers.json';

export interface SettingProperty {
  section: string;
  Label: string;
  id: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'colorpicker' | 'textarea' | 'password' | 'combo+textarea' | 'special-numbers';
  default: any;
  options?: string[] | string; // Can be array or function string
  value?: any; // Current value (runtime only)
  readonly?: boolean; // For read-only controls
}

export interface SettingsSection {
  title: string;
  properties: SettingProperty[];
  collapsed: boolean;
}

const SETTINGS_STORAGE_KEY = 'bingoSettings';

/**
 * Get settings properties from JSON data
 */
export function getSettingsProperties(): SettingProperty[] {
  return settingsData as SettingProperty[];
}

/**
 * Build sections from properties grouped by section name
 */
export function buildSectionsFromProperties(): SettingsSection[] {
  const properties = getSettingsProperties();
  const sectionsMap = new Map<string, SettingProperty[]>();

  // Group properties by section
  properties.forEach(property => {
    if (!sectionsMap.has(property.section)) {
      sectionsMap.set(property.section, []);
    }
    sectionsMap.get(property.section)!.push(property);
  });

  // Convert to sections array with specific ordering
  const sections: SettingsSection[] = [];

  // Define the preferred order for sections
  const sectionOrder = ['Welcome Customizations', 'Board Customizations', 'Display Settings', 'Bingo Server Settings'];

  // Add sections in preferred order
  sectionOrder.forEach(sectionTitle => {
    if (sectionsMap.has(sectionTitle)) {
      sections.push({
        title: sectionTitle,
        properties: sectionsMap.get(sectionTitle)!,
        collapsed: sectionTitle !== 'Game Settings' // Only Game Settings open by default
      });
      sectionsMap.delete(sectionTitle);
    }
  });

  // Add any remaining sections
  sectionsMap.forEach((properties, sectionTitle) => {
    sections.push({
      title: sectionTitle,
      properties,
      collapsed: sectionTitle !== 'Game Settings' // Only Game Settings open by default
    });
  });

  return sections;
}

/**
 * Get all settings from localStorage, merged with defaults
 */
export function getSettings(): { [key: string]: any } {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    const parsed = JSON.parse(savedSettings ? savedSettings : '{}');
    console.log(`Returning settings from localStorage:`, parsed);

    // Merge with defaults to ensure all settings exist
    const defaults = getDefaultSettings();
    const f = { ...defaults, ...parsed };
    console.log(`Returning settings from localStorage:`, f);
    return f;
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Get default settings as a flat object
 */
export function getDefaultSettings(): { [key: string]: any } {
  const defaults: { [key: string]: any } = {};
  const properties = getSettingsProperties();

  properties.forEach(property => {
    if (property.type === 'combo+textarea') {
      // For combo+textarea, set empty selection as default
      defaults[property.id] = { selectedKey: '', customValue: '' };
    } else if (property.type === 'special-numbers') {
      // For special-numbers, set empty object as default (pre-built will be merged in UI)
      defaults[property.id] = {};
    } else {
      defaults[property.id] = property.default;
    }
  });

  return defaults;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: { [key: string]: any }): boolean {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));

    // Dispatch custom event to notify components of settings change
    window.dispatchEvent(new CustomEvent('bingoSettingsChanged', { detail: { action: 'save', settings } }));

    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Reset all settings to defaults
 */
export function resetSettings(): boolean {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);

    // Dispatch custom event to notify components of settings reset
    window.dispatchEvent(new CustomEvent('bingoSettingsChanged', { detail: { action: 'reset' } }));

    return true;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return false;
  }
}

/**
 * Get a specific setting value
 */
export function getSetting(id: string, defaultValue?: any): any {
  const settings = getSettings();
  return settings[id] !== undefined ? settings[id] : defaultValue;
}

/**
 * Set a specific setting value
 */
export function setSetting(id: string, value: any): boolean {
  try {
    const settings = getSettings();
    settings[id] = value;
    const success = saveSettings(settings);

    // Dispatch custom event to notify components of settings change
    if (success) {
      window.dispatchEvent(new CustomEvent('bingoSettingsChanged', { detail: { id, value } }));
    }

    return success;
  } catch (error) {
    console.error('Error setting value:', error);
    return false;
  }
}

/**
 * Get settings sections with current values loaded
 */
export function getSettingsSections(): SettingsSection[] {
  const currentSettings = getSettings();
  const sections = buildSectionsFromProperties();

  return sections.map(section => ({
    ...section,
    properties: section.properties.map(property => {
      let value = currentSettings[property.id] !== undefined
        ? currentSettings[property.id]
        : property.default;

      return {
        ...property,
        value
      };
    })
  }));
}

/**
 * Export settings as JSON string
 */
export function exportSettings(): string {
  const settings = getSettings();
  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON string
 */
export function importSettings(jsonString: string): boolean {
  try {
    const settings = JSON.parse(jsonString);
    return saveSettings(settings);
  } catch (error) {
    console.error('Error importing settings:', error);
    return false;
  }
}

/**
 * Validate settings object
 */
export function validateSettings(settings: { [key: string]: any }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const properties = getSettingsProperties();
  const validIds = new Set(properties.map(p => p.id));

  // Check for unknown settings
  Object.keys(settings).forEach(id => {
    if (!validIds.has(id)) {
      errors.push(`Unknown setting: ${id}`);
    }
  });

  // Validate setting types and values
  properties.forEach(property => {
    const value = settings[property.id];
    if (value !== undefined) {
      switch (property.type) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Setting ${property.id} must be a boolean`);
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push(`Setting ${property.id} must be a valid number`);
          }
          break;
        case 'select':
          if (property.options) {
            const resolvedOptions = resolveOptions(property.options, property);
            if (resolvedOptions.length > 0 && !resolvedOptions.includes(value)) {
              errors.push(`Setting ${property.id} must be one of: ${resolvedOptions.join(', ')}`);
            }
          }
          break;
        case 'text':
        case 'textarea':
        case 'colorpicker':
        case 'password':
          if (typeof value !== 'string') {
            errors.push(`Setting ${property.id} must be a string`);
          }
          break;
        case 'combo+textarea':
          if (typeof value !== 'object' || value === null ||
              typeof value.selectedKey !== 'string' || typeof value.customValue !== 'string') {
            errors.push(`Setting ${property.id} must be an object with selectedKey and customValue strings`);
          }
          break;
        case 'special-numbers':
          if (typeof value !== 'object' || value === null) {
            errors.push(`Setting ${property.id} must be an object`);
          } else {
            // Validate that all keys are numbers 1-75 and values are strings
            Object.entries(value).forEach(([key, val]) => {
              const num = parseInt(key);
              if (isNaN(num) || num < 1 || num > 75) {
                errors.push(`Setting ${property.id} keys must be numbers between 1-75`);
              }
              if (typeof val !== 'string') {
                errors.push(`Setting ${property.id} values must be strings`);
              }
            });
          }
          break;
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Predefined option functions
 */
const OPTION_FUNCTIONS: { [key: string]: () => string[] } = {
  'getEventTypes': () => ['celebration', 'warning', 'announcement', 'special', 'order66', 'battle'],
  'getThemes': () => ['light', 'dark'],
  'getFontSizes': () => ['small', 'medium', 'large', 'extra-large'],
};

/**
 * Resolve options from either array, function string, or property default
 */
export function resolveOptions(options?: string[] | string, property?: SettingProperty): string[] {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options;
  }

  // Special case: get options from default object keys
  if (options === 'getFromDefaultKeys' && property?.default && typeof property.default === 'object') {
    return Object.keys(property.default);
  }

  // If it's a string, look it up in predefined functions
  if (OPTION_FUNCTIONS[options]) {
    try {
      return OPTION_FUNCTIONS[options]();
    } catch (error) {
      console.error(`Error calling option function ${options}:`, error);
      return [];
    }
  }

  console.warn(`Unknown option function: ${options}`);
  return [];
}

/**
 * Get display name for an option (includes emoji if available)
 */
export function getOptionDisplayName(optionKey: string, property?: SettingProperty): string {
  // Special handling for version options
  if (property?.id === 'defaultVersion') {
    switch (optionKey) {
      case 'latest':
        return 'Latest';
      case 'v5':
        return 'V5 (Current)';
      case 'v4':
        return 'V4 (Legacy)';
      default:
        return optionKey.toUpperCase();
    }
  }

  if (!property?.default || typeof property.default !== 'object') {
    return optionKey.charAt(0).toUpperCase() + optionKey.slice(1);
  }

  const optionData = property.default[optionKey];

  // If the option data is an object with emoji and value
  if (optionData && typeof optionData === 'object' && 'value' in optionData) {
    const emoji = optionData.emoji ? `${optionData.emoji} ` : '';
    const displayName = optionKey.charAt(0).toUpperCase() + optionKey.slice(1);
    return `${emoji}${displayName}`;
  }

  // Fallback to capitalized key name
  return optionKey.charAt(0).toUpperCase() + optionKey.slice(1);
}

/**
 * Get special numbers with pre-built messages merged with user customizations
 * Note: If user has cleared a pre-built message (set to empty string), it won't appear in the final result
 */
export function getSpecialNumbers(): { [key: string]: string } {
  const userCustomizations = getSetting('specialNumbers', {}) as { [key: string]: string };
  const result: { [key: string]: string } = {};

  // Start with pre-built messages
  for (const [number, message] of Object.entries(specialNumbersData)) {
    result[number] = message;
  }

  // Apply user customizations
  for (const [number, message] of Object.entries(userCustomizations)) {
    if (message === '') {
      // User has cleared this message - remove it entirely
      delete result[number];
    } else {
      // User has set a custom message
      result[number] = message;
    }
  }

  return result;
}

/**
 * Get message for a specific number (returns empty string if no message)
 */
export function getNumberMessage(number: number): string {
  const specialNumbers = getSpecialNumbers();
  return specialNumbers[number.toString()] || '';
}

/**
 * Set message for a specific number
 */
export function setNumberMessage(number: number, message: string): boolean {
  if (number < 1 || number > 75) {
    console.error('Number must be between 1 and 75');
    return false;
  }

  const currentCustomizations = getSetting('specialNumbers', {}) as { [key: string]: string };
  const updatedCustomizations = { ...currentCustomizations };
  const numberStr = number.toString();

  // Get the pre-built message for this number (if any)
  const preBuiltMessage = (specialNumbersData as { [key: string]: string })[numberStr];

  if (message.trim() === '') {
    // For clearing: if there's a pre-built message, set to empty string to mark as cleared
    // If no pre-built message, just remove the customization
    if (preBuiltMessage) {
      updatedCustomizations[numberStr] = '';
    } else {
      delete updatedCustomizations[numberStr];
    }
  } else if (preBuiltMessage && message.trim() === preBuiltMessage.trim()) {
    // If the user typed exactly the same message as the pre-built one,
    // revert to pre-built state by removing the customization
    delete updatedCustomizations[numberStr];
  } else {
    updatedCustomizations[numberStr] = message;
  }

  return setSetting('specialNumbers', updatedCustomizations);
}

/**
 * Get the message state for a specific number
 */
export function getNumberMessageState(number: number): 'none' | 'pre-built' | 'custom' | 'overridden' | 'cleared' {
  const numberStr = number.toString();
  const hasPreBuilt = !!(specialNumbersData as { [key: string]: string })[numberStr];
  const userCustomizations = getSetting('specialNumbers', {}) as { [key: string]: string };
  const userCustomization = userCustomizations[numberStr];

  if (!hasPreBuilt && !userCustomization) {
    return 'none';
  }

  if (userCustomization === '') {
    return 'cleared'; // User cleared a pre-built message
  }

  if (userCustomization && hasPreBuilt) {
    return 'overridden'; // User overrode a pre-built message
  }

  if (userCustomization && !hasPreBuilt) {
    return 'custom'; // User added a custom message where none existed
  }

  return 'pre-built'; // Only pre-built message exists
}

/**
 * Revert a number's message to its pre-built state
 */
export function revertNumberMessage(number: number): boolean {
  if (number < 1 || number > 75) {
    console.error('Number must be between 1 and 75');
    return false;
  }

  const currentCustomizations = getSetting('specialNumbers', {}) as { [key: string]: string };
  const updatedCustomizations = { ...currentCustomizations };

  // Remove any user customization to revert to pre-built
  delete updatedCustomizations[number.toString()];

  return setSetting('specialNumbers', updatedCustomizations);
}

/**
 * Format settings for debug display
 */
export function formatDebugSettings(settings: { [key: string]: any }): string {
  const debugInfo = {
    settingsCount: Object.keys(settings).length,
    lastModified: new Date().toISOString(),
    settings: settings
  };

  return JSON.stringify(debugInfo, null, 2);
}

/**
 * Generate welcome message using template with settings
 */
export function generateWelcomeMessage(): string {
  const welcomeMessage = getSetting('welcomeMessage', 'BINGO FREE TO PLAY!');
  const numberOfCards = getSetting('numberOfCards', 2);
  const timeMessage = getSetting('timeMessage', '6:30 PM');
  const bingoWord = getSetting('bingoWord', 'BAHHH!');

  const template = `${welcomeMessage}
${numberOfCards} CARDS PER PERSON
START TIME - ${timeMessage}
Bingo Word: ${bingoWord}`;

  return template;
}

/**
 * Get the color for a specific BINGO letter based on settings
 */
export function getLetterColor(letter: string): string {
  const letterUpper = letter.toUpperCase();

  switch (letterUpper) {
    case 'B':
      return getSetting('bLetterColor', '#007bff'); // Blue
    case 'I':
      return getSetting('iLetterColor', '#dc3545'); // Red
    case 'N':
      return getSetting('nLetterColor', '#ffffff'); // White
    case 'G':
      return getSetting('gLetterColor', '#28a745'); // Green
    case 'O':
      return getSetting('oLetterColor', '#ffc107'); // Yellow
    default:
      return '#28a745'; // Default green for fallback
  }
}

/**
 * Get text color that contrasts well with the given background color
 */
export function getContrastTextColor(backgroundColor: string): string {
  // Convert hex to RGB if needed
  let hex = backgroundColor.replace('#', '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? '#333333' : '#ffffff';
}

/**
 * Get the board highlight color from settings
 */
export function getBoardHighlightColor(): string {
  return getSetting('boardHighlightColor', '#1e4d2b'); // Default green
}
