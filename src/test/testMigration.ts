// Test script for debugging special numbers migration
import { migrateV4ToV5 } from '../utils/settingsMigration';
import { getSetting, setSetting } from '../utils/settings';

export function testServerSettingsMigration() {
  console.log('=== Testing Server Settings Migration ===');

  // Set up V4 test data for server settings
  localStorage.setItem('bingo_server_url', 'http://localhost:8080');
  localStorage.setItem('bingo_server_auth', 'test-token-123');

  console.log('Set V4 server settings:');
  console.log('  bingo_server_url:', localStorage.getItem('bingo_server_url'));
  console.log('  bingo_server_auth: [PRIVATE] (actual value hidden for security)');

  // Clear any existing V5 server settings
  setSetting('serverUrl', '');
  setSetting('serverAuthToken', '');

  console.log('Cleared V5 settings:');
  console.log('  serverUrl:', getSetting('serverUrl', ''));
  console.log('  serverAuthToken: [PRIVATE] (actual value hidden for security)');

  // Run migration
  console.log('Running migration...');
  const result = migrateV4ToV5();

  console.log('Migration result:', result);

  // Check results
  console.log('Post-migration V5 settings:');
  console.log('  serverUrl:', getSetting('serverUrl', ''));
  console.log('  serverAuthToken: [PRIVATE] (actual value hidden for security)');

  // Find the specific migrations for server settings
  const urlMigration = result.migrations.find(m => m.v4_id === 'bingo_server_url');
  const authMigration = result.migrations.find(m => m.v4_id === 'bingo_server_auth');

  console.log('URL Migration:', urlMigration);
  console.log('Auth Migration:', authMigration);
}

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

// Make both functions available globally for browser console testing
(window as any).testSpecialNumbersMigration = testSpecialNumbersMigration;
(window as any).testServerSettingsMigration = testServerSettingsMigration;
