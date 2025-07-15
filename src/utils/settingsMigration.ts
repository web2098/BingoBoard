import settingsVersionUpdateData from '../data/settingsVersionUpdateData.json';
import specialNumbersData from '../data/specialNumbers.json';
import { setSetting } from './settings';

/**
 * Interface for version mapping entries
 */
interface VersionMapping {
  v4_id: string;
  v5_id: string | string[] | null;
  v4_to_v5?: string;
  migration_type?: 'simple' | 'complex';
}

/**
 * Custom migration functions for specific settings that need special handling
 */
const migrationFunctions: { [key: string]: (value: any) => any } = {
  /**
   * Migrate special numbers from V4 to V5 format
   * V4: JSON stringified object in localStorage 'special-numbers'
   * V5: Object stored in settings system under 'specialNumbers'
   *
   * This migration preserves V4 special numbers and explicitly marks
   * V5 defaults that weren't in V4 as "cleared by the user" by setting
   * them to empty strings in the specialNumbers setting.
   */
  specialNumbersV4ToV5: (v4Value: any): { [key: string]: string } => {
    try {
      // Parse the V4 JSON string
      const v4SpecialNumbers = JSON.parse(v4Value);

      // Load V5 default special numbers to check what needs to be cleared
      const v5DefaultSpecialNumbers = specialNumbersData;
      const result: { [key: string]: string } = {};

      // Add all V4 special numbers
      for (const [number, message] of Object.entries(v4SpecialNumbers)) {
        result[number] = message as string;
      }

      // For V5 defaults that weren't in V4, mark as cleared by setting empty string
      for (const number of Object.keys(v5DefaultSpecialNumbers)) {
        if (!(number in v4SpecialNumbers)) {
          result[number] = ''; // Empty string marks as "cleared by user"
        }
      }

      return result;
    } catch (error) {
      console.warn('Failed to parse V4 special numbers:', error);
      // Return empty object to clear all V5 defaults if V4 parsing fails
      return {};
    }
  },

  /**
   * Convert V4 game order values to V5 format
   */
  gameOrderV4ToV5: (v4Value: any): string => {
    const mapping: { [key: string]: string } = {
      'default': 'Default',
      'length': 'Length',
      'alphabetical': 'Alphabetical',
      'random': 'Random'
    };
    return mapping[v4Value] || 'Default';
  },

  /**
   * Convert V4 boolean strings to V5 boolean values
   */
  booleanStringToBoolean: (v4Value: any): boolean => {
    return v4Value === 'true';
  },

  /**
   * Convert V4 audience timeout from milliseconds string to V5 seconds number
   */
  audienceTimeoutV4ToV5: (v4Value: any): number => {
    try {
      const milliseconds = parseInt(v4Value, 10);
      return Math.round(milliseconds / 1000);
    } catch (error) {
      console.warn('Failed to convert audience timeout:', error);
      return 3; // Default to 3 seconds
    }
  },
  /**
   * Complex migration for welcome message - splits V4 single message into V5 multiple fields
   */
  welcomeMessageV4ToV5: (v4Value: any): ComplexMigrationResult => {
    const v4Message = String(v4Value);
    const proposedMigrations = [];

    // First, extract all the specific components from the message
    let extractedComponents = [];

    // Extract number of cards patterns
    const cardsPatternForWelcome = /\b(\d+)\s+cards?\s+(?:per\s+person|each|apiece)\b/i;
    const cardsMatchForWelcome = v4Message.match(cardsPatternForWelcome);
    if (cardsMatchForWelcome) {
      extractedComponents.push(cardsMatchForWelcome[0]);
    }

    // Extract time patterns (with optional prefixes like "Start:", "Time:", etc.)
    const timePatternForWelcome = /(?:start\s*time?\s*[:=]?\s*)?(?:time\s*[:=]?\s*)?\b(\d{1,2}:\d{2}\s*(AM|PM|am|pm)?|\d{1,2}\s*(AM|PM|am|pm))\b/i;
    const timeMatchForWelcome = v4Message.match(timePatternForWelcome);
    if (timeMatchForWelcome) {
      extractedComponents.push(timeMatchForWelcome[0]);
    }

    // Extract explicit bingo word declarations
    const bingoWordPatternForWelcome = /bingo\s*word\s*[:=]\s*([^\s,.\n]+)/i;
    const bingoWordMatchForWelcome = v4Message.match(bingoWordPatternForWelcome);
    if (bingoWordMatchForWelcome) {
      extractedComponents.push(bingoWordMatchForWelcome[0]);
    } else {
      // Also check for exclamation patterns that might be bingo words
      const exclamationPatternForWelcome = /\b([A-Z]{3,}!+|BINGO!?|BAHHH!?|YEAH!?|WOO!?)\b/g;
      const exclamationsForWelcome = v4Message.match(exclamationPatternForWelcome);
      if (exclamationsForWelcome && exclamationsForWelcome.length > 0) {
        extractedComponents.push(exclamationsForWelcome[0]);
      }
    }

    // Extract main welcome message by removing detected components
    let welcomeMessage = v4Message;
    let confidence: 'high' | 'medium' | 'low' = 'high';

    if (extractedComponents.length > 0) {
      // Remove each extracted component from the message
      let cleanedMessage = v4Message;
      extractedComponents.forEach(component => {
        cleanedMessage = cleanedMessage.replace(new RegExp(component.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
      });

      // Clean up extra whitespace and punctuation
      cleanedMessage = cleanedMessage
        .replace(/\s+/g, ' ') // multiple spaces to single space
        .replace(/[,\s]*$/, '') // trailing commas and spaces
        .replace(/^[,\s]*/, '') // leading commas and spaces
        .replace(/\s*[,.]$/, '') // trailing punctuation
        .trim();

      if (cleanedMessage.length > 0) {
        welcomeMessage = cleanedMessage;
        confidence = 'high'; // High confidence when we successfully extracted other components
      } else {
        // If nothing left after removal, fall back to first line or full message
        const lines = v4Message.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length > 0) {
          welcomeMessage = lines[0];
          confidence = 'medium';
        } else {
          welcomeMessage = v4Message;
          confidence = 'low';
        }
      }
    } else {
      // No components detected, use original logic
      const lines = v4Message.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length > 0) {
        welcomeMessage = lines[0];
        if (lines.length > 1) {
          confidence = 'medium';
        }
      }
    }

    proposedMigrations.push({
      v5_id: 'welcomeMessage',
      v5_value: welcomeMessage,
      confidence: confidence,
      description: extractedComponents.length > 0
        ? `Extracted welcome text after removing detected components (${extractedComponents.length} items removed)`
        : 'Using original message as welcome text'
    });

    // Number of cards - try to extract from patterns like "2 cards per person" or "3 card per person"
    let numberOfCards = 2;
    let cardsConfidence: 'high' | 'medium' | 'low' = 'low';
    let cardsDescription = 'Default number of cards (not specified in V4 welcome message)';

    // Look for patterns like "X card(s) per person" or "X card(s) each"
    const cardsPattern = /\b(\d+)\s+cards?\s+(?:per\s+person|each|apiece)\b/i;
    const cardsMatch = v4Message.match(cardsPattern);

    if (cardsMatch) {
      const extractedNumber = parseInt(cardsMatch[1], 10);
      if (extractedNumber >= 1 && extractedNumber <= 10) { // reasonable range
        numberOfCards = extractedNumber;
        cardsConfidence = 'high';
        cardsDescription = `Extracted from message: "${cardsMatch[0]}"`;
      }
    }

    proposedMigrations.push({
      v5_id: 'numberOfCards',
      v5_value: numberOfCards,
      confidence: cardsConfidence,
      description: cardsDescription
    });

    // Time message - try to extract time patterns with optional prefixes or use default
    let timeMessage = '6:30 PM';
    let timeConfidence: 'high' | 'medium' | 'low' = 'low';

    // Look for time patterns with optional prefixes like "Start:", "Time:", etc.
    const timePattern = /(?:start\s*time?\s*[:=]?\s*)?(?:time\s*[:=]?\s*)?\b(\d{1,2}:\d{2}\s*(AM|PM|am|pm)?|\d{1,2}\s*(AM|PM|am|pm))\b/i;
    const timeMatch = v4Message.match(timePattern);

    if (timeMatch) {
      // Extract just the time part (group 1) and clean it up
      let extractedTime = timeMatch[1] || timeMatch[0];

      // Remove any HTML controls, dashes, and extra whitespace
      extractedTime = extractedTime
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[-–—]/g, '') // Remove dashes (hyphen, en-dash, em-dash)
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .trim();

      timeMessage = extractedTime;
      timeConfidence = 'high';
    }

    proposedMigrations.push({
      v5_id: 'timeMessage',
      v5_value: timeMessage,
      confidence: timeConfidence,
      description: timeMatch ? `Extracted time from message: "${timeMatch[0]}"` : 'Default time (no time found in V4 message)'
    });

    // Bingo word - try to extract from "bingo word: X" or "bingo word = X" patterns, or use exclamations as fallback
    let bingoWord = 'BAHHH!';
    let bingoConfidence: 'high' | 'medium' | 'low' = 'low';
    let bingoDescription = 'Default bingo word (no exclamations found in V4 message)';

    // First, look for explicit "bingo word: X" or "bingo word = X" patterns (case insensitive, flexible spacing)
    const bingoWordPattern = /bingo\s*word\s*[:=]\s*([^\s,.\n]+)/i;
    const bingoWordMatch = v4Message.match(bingoWordPattern);

    if (bingoWordMatch) {
      bingoWord = bingoWordMatch[1].trim();
      bingoConfidence = 'high';
      bingoDescription = `Extracted from explicit bingo word declaration: "${bingoWordMatch[0]}"`;
    } else {
      // Fallback: Look for exclamations or words that might be bingo calls
      const exclamationPattern = /\b([A-Z]{3,}!+|BINGO!?|BAHHH!?|YEAH!?|WOO!?)\b/g;
      const exclamations = v4Message.match(exclamationPattern);

      if (exclamations && exclamations.length > 0) {
        bingoWord = exclamations[0];
        bingoConfidence = 'medium';
        bingoDescription = `Extracted possible bingo word from exclamation: "${bingoWord}"`;
      }
    }

    proposedMigrations.push({
      v5_id: 'bingoWord',
      v5_value: bingoWord,
      confidence: bingoConfidence,
      description: bingoDescription
    });

    return {
      v4_id: 'welcome-message',
      v4_value: v4Value,
      proposedMigrations,
      requiresApproval: true,
      autoConversionAttempted: true
    };
  }
};

/**
 * Get V4 settings from localStorage
 */
function getV4Settings(): { [key: string]: any } {
  const v4Settings: { [key: string]: any } = {};

  // Get all localStorage items that match known V4 setting keys
  settingsVersionUpdateData.forEach((mapping) => {
    const value = localStorage.getItem(mapping.v4_id);
    if (value !== null) {
      v4Settings[mapping.v4_id] = value;
    }
  });

  return v4Settings;
}

/**
 * Set V5 settings using the settings system
 */
function setV5Settings(settings: { [key: string]: any }): void {
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      setSetting(key, value);
    }
  });
}

/**
 * Interface for detailed migration results
 */
export interface MigrationDetail {
  v4_id: string;
  v5_id: string;
  v4_value: any;
  v5_value: any;
  success: boolean;
  error?: string;
  conversionType: 'direct' | 'function' | 'automatic' | 'complex' | 'user-approval';
  conversionFunction?: string;
  description: string;
  requiresUserApproval?: boolean;
  proposedValues?: { [key: string]: any };
  multipleTargets?: boolean;
  targetSettings?: string[];
}

/**
 * Interface for complex migration results that need user interaction
 */
export interface ProposedMigration {
  v5_id: string;
  v5_value: any;
  confidence: number;
  reasoning: string;
}

interface ComplexMigrationResult {
  v4_id: string;
  v4_value: any;
  proposedMigrations: {
    v5_id: string;
    v5_value: any;
    confidence: 'high' | 'medium' | 'low';
    description: string;
  }[];
  requiresApproval: boolean;
  autoConversionAttempted: boolean;
}

/**
 * Migrate settings from V4 to V5
 */
export function migrateV4ToV5(): {
  success: boolean;
  migratedCount: number;
  errors: string[];
  migrations: MigrationDetail[];
  complexMigrations: ComplexMigrationResult[];
  v4Settings: { [key: string]: any };
  v5Settings: { [key: string]: any };
  requiresUserApproval: boolean;
} {
  const errors: string[] = [];
  let migratedCount = 0;
  const migrations: MigrationDetail[] = [];
  const complexMigrations: ComplexMigrationResult[] = [];
  let requiresUserApproval = false;

  try {
    const v4Settings = getV4Settings();
    const v5Settings: { [key: string]: any } = {};

    console.log('Starting V4 to V5 migration...');
    console.log('Found V4 settings:', Object.keys(v4Settings));

    settingsVersionUpdateData.forEach((mapping) => {
      const { v4_id, v5_id, v4_to_v5, migration_type } = mapping;

      // Skip if no V5 equivalent exists
      if (!v5_id) {
        return;
      }

      // Skip if V4 value doesn't exist
      if (!(v4_id in v4Settings)) {
        return;
      }

      const v4Value = v4Settings[v4_id];

      // Handle complex migrations (multiple target fields)
      if (migration_type === 'complex' && Array.isArray(v5_id)) {
        if (v4_to_v5 && migrationFunctions[v4_to_v5]) {
          const complexResult = migrationFunctions[v4_to_v5](v4Value) as ComplexMigrationResult;
          complexMigrations.push(complexResult);
          requiresUserApproval = true;
        }

        const migrationDetail: MigrationDetail = {
          v4_id,
          v5_id: v5_id.join(', '),
          v4_value: v4Value,
          v5_value: 'Complex migration - see approval section',
          success: false,
          conversionType: 'complex',
          description: 'Complex migration requiring user approval',
          requiresUserApproval: true,
          multipleTargets: true,
          targetSettings: v5_id
        };
        migrations.push(migrationDetail);
        return;
      }

      // Handle simple migrations (single target field)
      if (typeof v5_id === 'string') {
        const migrationDetail: MigrationDetail = {
          v4_id,
          v5_id,
          v4_value: v4Value,
          v5_value: null,
          success: false,
          conversionType: 'direct',
          description: ''
        };

        try {
          let v5Value: any;
          let conversionDescription = '';

          if (v4_to_v5 && migrationFunctions[v4_to_v5]) {
            // Use custom migration function
            const migrationFn = migrationFunctions[v4_to_v5];
            v5Value = migrationFn(v4Value);
            migrationDetail.conversionType = 'function';
            migrationDetail.conversionFunction = v4_to_v5;

            // Create specific descriptions for each function
            switch (v4_to_v5) {
              case 'specialNumbersV4ToV5':
                conversionDescription = 'Parsed JSON string to object format';
                break;
              case 'gameOrderV4ToV5':
                conversionDescription = `Converted game order: "${v4Value}" → "${v5Value}"`;
                break;
              case 'booleanStringToBoolean':
                conversionDescription = `Converted string boolean: "${v4Value}" → ${v5Value}`;
                break;
              case 'audienceTimeoutV4ToV5':
                conversionDescription = `Converted timeout: ${v4Value}ms → ${v5Value}s`;
                break;
              default:
                conversionDescription = `Applied custom function: ${v4_to_v5}`;
            }

            console.log(`Migrated ${v4_id} -> ${v5_id} using ${v4_to_v5}:`, v4Value, '->', v5Value);
          } else {
            // Apply automatic conversions based on known patterns
            migrationDetail.conversionType = 'automatic';

            if (v4_id === 'game-order') {
              v5Value = migrationFunctions.gameOrderV4ToV5(v4Value);
              conversionDescription = `Auto-converted game order: "${v4Value}" → "${v5Value}"`;
            } else if (v4_id === 'last-number-on' || v4_id === 'number-history-on') {
              v5Value = migrationFunctions.booleanStringToBoolean(v4Value);
              conversionDescription = `Auto-converted boolean: "${v4Value}" → ${v5Value}`;
            } else if (v4_id === 'audience-message-timeout') {
              v5Value = migrationFunctions.audienceTimeoutV4ToV5(v4Value);
              conversionDescription = `Auto-converted timeout: ${v4Value}ms → ${v5Value}s`;
            } else {
              // Direct copy for simple cases
              v5Value = v4Value;
              conversionDescription = 'Direct copy (no conversion needed)';
            }
            console.log(`Migrated ${v4_id} -> ${v5_id} (automatic):`, v4Value, '->', v5Value);
          }

          migrationDetail.v5_value = v5Value;
          migrationDetail.success = true;
          migrationDetail.description = conversionDescription;

          // Apply all simple settings immediately - complex migrations are handled separately
          v5Settings[v5_id] = v5Value;
          migratedCount++;
        } catch (error) {
          const errorMsg = `Failed to migrate ${v4_id} to ${v5_id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);

          migrationDetail.success = false;
          migrationDetail.error = errorMsg;
          migrationDetail.description = 'Migration failed';
        }

        migrations.push(migrationDetail);
      }
    });

    // Apply all V5 settings
    setV5Settings(v5Settings);

    console.log(`Migration complete. Migrated ${migratedCount} settings.`);
    return {
      success: errors.length === 0,
      migratedCount,
      errors,
      migrations,
      complexMigrations,
      v4Settings,
      v5Settings,
      requiresUserApproval
    };
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    return {
      success: false,
      migratedCount,
      errors: [errorMsg],
      migrations: [],
      complexMigrations: [],
      v4Settings: {},
      v5Settings: {},
      requiresUserApproval: false
    };
  }
}

/**
 * Main migration function - only supports V4 to V5 upward migration
 */
export function migrateSettings(fromVersion: string, toVersion: string): {
  success: boolean;
  migratedCount: number;
  errors: string[];
  migrations: MigrationDetail[];
  v4Settings: { [key: string]: any };
  v5Settings: { [key: string]: any };
} {
  console.log(`Migrating settings from ${fromVersion} to ${toVersion}`);

  if (fromVersion === 'v4' && toVersion === 'v5') {
    return migrateV4ToV5();
  } else {
    const errorMsg = `Unsupported migration path: ${fromVersion} to ${toVersion}. Only V4 to V5 migration is supported.`;
    console.error(errorMsg);
    return {
      success: false,
      migratedCount: 0,
      errors: [errorMsg],
      migrations: [],
      v4Settings: {},
      v5Settings: {}
    };
  }
}

/**
 * Check if V4 to V5 migration is needed
 */
export function isMigrationNeeded(): boolean {
  const v4Settings = getV4Settings();
  return Object.keys(v4Settings).length > 0;
}

/**
 * Get available migration paths
 */
export function getAvailableMigrations(): string[] {
  return ['v4->v5'];
}
