import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './migration-page.module.css';
import { migrateV4ToV5, isMigrationNeeded } from '../../utils/settingsMigration';
import { setSetting } from '../../utils/settings';
import MigrationModal, { MigrationResult } from '../../components/settings/MigrationModal';
import SidebarWithMenu from '../../components/SidebarWithMenu';

interface MigrationPageProps {}

interface MigrationState {
  status: 'start' | 'progress' | 'migrating' | 'success' | 'error';
  migrationResult: MigrationResult | null;
  errorMessage: string;
}

const MigrationPage: React.FC<MigrationPageProps> = () => {
  const navigate = useNavigate();
  const [migrationState, setMigrationState] = useState<MigrationState>({
    status: 'start',
    migrationResult: null,
    errorMessage: ''
  });

  useEffect(() => {
    // Check if migration is actually needed
    if (!isMigrationNeeded()) {
      // No V4 settings found, redirect directly to select-game
      setSetting('defaultVersion', 'latest');
      navigate('/select-game');
    }
  }, [navigate]);

  const startMigration = () => {
    setMigrationState(prev => ({ ...prev, status: 'progress' }));

    setTimeout(() => {
      try {
        const result = migrateV4ToV5();
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
    }, 1500);
  };

  const handleMigrationComplete = () => {
    // Set version to latest
    setSetting('defaultVersion', 'latest');

    // Show success and redirect
    setMigrationState(prev => ({ ...prev, status: 'success' }));

    setTimeout(() => {
      navigate('/select-game');
    }, 2000);
  };

  const renderMigrationStart = () => (
    <div className={styles.migrationStart}>
      <div className={styles.migrationActions}>
        <button
          className={styles.startMigrationBtn}
          onClick={startMigration}
        >
          Start Migration
        </button>
      </div>
      <button
        className={styles.backLink}
        onClick={() => window.location.href = '/BingoBoard/v4/settings.html'}
      >
        ← Back to V4 Settings
      </button>
    </div>
  );

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
        onClick={() => window.location.href = '/BingoBoard/v4/settings.html'}
      >
        ← Back to V4 Settings
      </button>
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
      default:
        return renderMigrationStart();
    }
  };

  return (
    <div className={styles.migrationPage}>
      <div className={styles.migrationContainer}>
        <div className={styles.migrationHeader}>
          <h1>🚀 Welcome to the Latest Version!</h1>
          <p>We're migrating your settings from V4 to the new enhanced V5 format. This will preserve all your preferences while unlocking new features.</p>
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
    </div>
  );
};

export default MigrationPage;
