// Test script for debugging special numbers migration
import { migrateV4ToV5 } from '../utils/settingsMigration';
import { getSetting, setSetting } from '../utils/settings';

export function testSpecialNumbersMigration() {
  console.log('=== Testing Special Numbers Migration ===');

  // Set up V4 test data (simulate what would be in V4 localStorage)
  const v4SpecialNumbers = {
    "11": "B11! B! B! 11!",
    "25": "Beep Beep",
    "69": "Oooooooooh"
  };

  // Store V4 data in localStorage
  localStorage.setItem('special-numbers', JSON.stringify(v4SpecialNumbers));
  console.log('Set V4 special numbers:', v4SpecialNumbers);

  // Clear any existing V5 special numbers
  setSetting('specialNumbers', {});
  console.log('Cleared V5 special numbers');

  // Run migration
  console.log('Running migration...');
  const result = migrateV4ToV5();

  console.log('Migration result:', result);

  // Check what was actually stored
  const migratedSpecialNumbers = getSetting('specialNumbers', {});
  console.log('Migrated special numbers in V5:', migratedSpecialNumbers);

  // Expected results:
  console.log('Expected V4 numbers (should be present):');
  console.log('  11:', migratedSpecialNumbers['11'] || 'MISSING');
  console.log('  25:', migratedSpecialNumbers['25'] || 'MISSING');
  console.log('  69:', migratedSpecialNumbers['69'] || 'MISSING');

  console.log('Expected V5 defaults (should be cleared with empty strings):');
  const v5Defaults = ["1", "7", "13", "21", "33", "42", "50", "55", "66", "75"];
  v5Defaults.forEach(num => {
    const value = migratedSpecialNumbers[num];
    const status = value === '' ? 'CLEARED ✓' : value ? `UNEXPECTED: "${value}"` : 'MISSING ✗';
    console.log(`  ${num}:`, status);
  });

  return result;
}

// Make it available globally for browser console testing
(window as any).testSpecialNumbersMigration = testSpecialNumbersMigration;
