import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './migration-page.module.css';
import { migrateVersionToV5, isMigrationNeededFromVersion } from '../../utils/settingsMigration';
import { setSetting } from '../../utils/settings';
import { getVersionRoute, getPostMigrationRoute } from '../../config/versions';
import MigrationModal, { MigrationResult } from '../../components/settings/MigrationModal';

interface MigrationPageProps {}

interface MigrationState {
  status: 'start' | 'progress' | 'migrating' | 'success' | 'error' | 'skip';
  migrationResult: MigrationResult | null;
  errorMessage: string;
  sourceVersion: string;
}

const MigrationPage: React.FC<MigrationPageProps> = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get source version from URL parameters (default to 'v4' for backward compatibility)
  const sourceVersion = searchParams.get('from') || 'v4';

  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'start',
    migrationResult: null,
    errorMessage: '',
    sourceVersion: sourceVersion
  });

  useEffect(() => {
    // Don't automatically redirect - let user click "Start Migration" for consistent UX
    // Analysis will happen when user clicks the button
  }, [navigate, sourceVersion]);
  const startMigration = () => {
    setMigrationState(prev => ({ ...prev, status: 'progress' }));

    // Always show analysis phase for consistent UX
    setTimeout(() => {
      try {
        // First, check if migration is needed
        if (!isMigrationNeededFromVersion(migrationState.sourceVersion)) {
          console.log(`No migration needed from ${migrationState.sourceVersion}, showing no migration required`);
          setMigrationState(prev => ({ ...prev, status: 'skip' }));

          // Navigate to select-game after showing skip message
          setTimeout(() => {
            setSetting('defaultVersion', 'latest');
            navigate(getPostMigrationRoute());
          }, 3000); // Show skip message for 3 seconds
          return;
        }

        // If migration is needed, proceed with migration
        const result = migrateVersionToV5(migrationState.sourceVersion);

        if (result.skipped) {
          console.log(`Migration skipped for ${migrationState.sourceVersion}, no settings to migrate`);
          setMigrationState(prev => ({ ...prev, status: 'skip' }));

          // Navigate to select-game after showing skip message
          setTimeout(() => {
            setSetting('defaultVersion', 'latest');
            navigate(getPostMigrationRoute());
          }, 3000); // Show skip message for 3 seconds
          return;
        }

        setMigrationState(prev => ({
          ...prev,
          status: 'migrating',
          migrationResult: result
        }));
      } catch (error) {
        setMigrationState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: `Failed to run migration: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    }, 1500); // Show analysis for 1.5 seconds
  };

  const skipMigration = () => {
    console.log(`User chose to skip migration from ${migrationState.sourceVersion}`);
    const postMigrationRoute = getPostMigrationRoute();
    console.log(`Navigating to post-migration route: ${postMigrationRoute}`);
    // Set version to latest and navigate directly
    setSetting('defaultVersion', 'latest');
    navigate(postMigrationRoute);
  };

  const handleMigrationComplete = () => {
    // Set version to latest
    setSetting('defaultVersion', 'latest');

    // Show success and redirect
    setMigrationState(prev => ({ ...prev, status: 'success' }));

    setTimeout(() => {
      navigate(getPostMigrationRoute());
    }, 2000);
  };

  const renderMigrationStart = () => {
    // Check if migration is supported for this version
    const migrationSupported = isMigrationNeededFromVersion(migrationState.sourceVersion);

    return (
      <div className={styles.migrationStart}>
        <div className={styles.migrationActions}>
          <button
            className={styles.startMigrationBtn}
            onClick={startMigration}
          >
            Start Migration
          </button>
          {migrationSupported && (
            <button
              className={styles.skipMigrationBtn}
              onClick={skipMigration}
            >
              Skip Migration
            </button>
          )}
        </div>
        <button
          className={styles.backLink}
          onClick={() => {
            const settingsRoute = getVersionRoute(migrationState.sourceVersion, 'settings');
            window.location.href = settingsRoute.path;
          }}
        >
          ← Back to {migrationState.sourceVersion.toUpperCase()} Settings
        </button>
      </div>
    );
  };

  const renderMigrationProgress = () => (
    <div className={styles.migrationProgress}>
      <div className={styles.migrationStatus}>
        <div className={styles.statusHeader}>
          <span className={styles.spinner}></span>
          Analyzing your settings...
        </div>
      </div>
    </div>
  );

  const renderMigrationSuccess = () => (
    <div className={styles.migrationSuccess}>
      <div className={styles.successMessage}>
        <h3>✅ Migration Complete!</h3>
        <p>Your settings have been successfully migrated to V5. Redirecting to the game selection...</p>
      </div>
    </div>
  );

  const renderMigrationError = () => (
    <div className={styles.migrationError}>
      <div className={styles.errorMessage}>
        <h3>❌ Migration Failed</h3>
        <p>{migrationState.errorMessage}</p>
      </div>
      <div className={styles.migrationActions}>
        <button
          className={styles.startMigrationBtn}
          onClick={startMigration}
        >
          Retry Migration
        </button>
      </div>
      <button
        className={styles.backLink}
        onClick={() => {
          const settingsRoute = getVersionRoute(migrationState.sourceVersion, 'settings');
          window.location.href = settingsRoute.path;
        }}
      >
        ← Back to {migrationState.sourceVersion.toUpperCase()} Settings
      </button>
    </div>
  );

  const renderMigrationSkip = () => (
    <div className={styles.migrationSuccess}>
      <div className={styles.successMessage}>
        <div className={styles.checkmarkContainer}>
          <div className={styles.greenCircle}>
            <span className={styles.checkmark}>✓</span>
          </div>
        </div>
        <h3>No Migration Required</h3>
        <p>Your {migrationState.sourceVersion.toUpperCase()} installation is already up to date - taking you to game selection...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (migrationState.status) {
      case 'start':
        return renderMigrationStart();
      case 'progress':
        return renderMigrationProgress();
      case 'migrating':
        return null; // MigrationModal handles this
      case 'success':
        return renderMigrationSuccess();
      case 'error':
        return renderMigrationError();
      case 'skip':
        return renderMigrationSkip();
      default:
        return renderMigrationStart();
    }
  };

  return (
    <div className={styles.migrationPage}>
      <div className={styles.migrationContainer}>
        <div className={styles.migrationHeader}>
          <h1>🚀 Welcome to the Latest Version!</h1>
          <p>We're migrating your settings from {migrationState.sourceVersion.toUpperCase()} to the new enhanced V5 format. This will preserve all your preferences while unlocking new features.</p>
          {isMigrationNeededFromVersion(migrationState.sourceVersion) && (
            <p><strong>Note:</strong> You can choose to skip the migration and start fresh with default settings if you prefer.</p>
          )}
        </div>
        {renderContent()}

        {/* Use MigrationModal for the actual migration process */}
        <MigrationModal
          isVisible={migrationState.status === 'migrating' && !!migrationState.migrationResult}
          migrationResult={migrationState.migrationResult}
          onClose={handleMigrationComplete}
          onSettingsRefresh={() => {
          }}
        />
      </div>

      <div className={styles.copyright}>
        <p>© 2025 Eric Gressman. All rights reserved.</p>
      </div>
    </div>
  );
};

export default MigrationPage;
