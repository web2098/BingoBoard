import React, { useState } from 'react';
import styles from './MigrationModal.module.css';
import { MigrationDetail } from '../../utils/settingsMigration';
import { setSetting, getSettings } from '../../utils/settings';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  migrations: MigrationDetail[];
  complexMigrations: any[]; // ComplexMigrationResult[]
  v4Settings: { [key: string]: any };
  v5Settings: { [key: string]: any };
  requiresUserApproval: boolean;
}

interface MigrationModalProps {
  isVisible: boolean;
  migrationResult: MigrationResult | null;
  onClose: () => void;
  onSettingsRefresh: () => void;
}

const MigrationModal: React.FC<MigrationModalProps> = ({
  isVisible,
  migrationResult,
  onClose,
  onSettingsRefresh
}) => {
  const [complexMigrationEditedValues, setComplexMigrationEditedValues] = useState<{ [migrationId: string]: { [fieldId: string]: any } }>({});
  const [handledProposals, setHandledProposals] = useState<{ [migrationId: string]: { [fieldId: string]: boolean } }>({});
  const [approvedProposals, setApprovedProposals] = useState<{ [migrationId: string]: { [fieldId: string]: boolean } }>({});
  const [currentMigrationResult, setCurrentMigrationResult] = useState<MigrationResult | null>(migrationResult);

  React.useEffect(() => {
    setCurrentMigrationResult(migrationResult);
  }, [migrationResult]);

  // Check if all proposals have been handled
  const allProposalsHandled = React.useMemo(() => {
    if (!currentMigrationResult?.requiresUserApproval || !currentMigrationResult.complexMigrations) {
      return true;
    }

    return currentMigrationResult.complexMigrations.every((complexMigration, migrationIndex) =>
      complexMigration.proposedMigrations.every((proposed: any) =>
        handledProposals[`${migrationIndex}`]?.[proposed.v5_id] === true
      )
    );
  }, [currentMigrationResult, handledProposals]);

  // Automatically transition to details when all proposals are handled
  React.useEffect(() => {
    if (allProposalsHandled && currentMigrationResult?.requiresUserApproval) {
      // Count the number of proposals that were approved
      const approvedCount = currentMigrationResult.complexMigrations.reduce((total, complexMigration, migrationIndex) => {
        return total + complexMigration.proposedMigrations.filter((proposed: any) =>
          approvedProposals[`${migrationIndex}`]?.[proposed.v5_id] === true
        ).length;
      }, 0);

      // Update the migration result to reflect completion
      setCurrentMigrationResult(prev => prev ? {
        ...prev,
        requiresUserApproval: false,
        success: true,
        migratedCount: prev.migratedCount + approvedCount
      } : null);
    }
  }, [allProposalsHandled, currentMigrationResult?.requiresUserApproval, approvedProposals, currentMigrationResult?.complexMigrations]);

  if (!isVisible || !currentMigrationResult) {
    return null;
  }

  const handleApproveProposal = (migrationIndex: number, proposed: any) => {
    // Apply the setting immediately
    const valueToApply = complexMigrationEditedValues[`${migrationIndex}`]?.[proposed.v5_id]
      ?? proposed.v5_value;

    console.log(`Applying migration for ${proposed.v5_id}:`, valueToApply);

    try {
      // Convert string values to appropriate types for certain settings
      let finalValue = valueToApply;
      if (proposed.v5_id === 'numberOfCards' && typeof valueToApply === 'string') {
        finalValue = parseInt(valueToApply, 10);
        if (isNaN(finalValue)) {
          finalValue = proposed.v5_value; // fallback to original
        }
      }

      setSetting(proposed.v5_id, finalValue);

      // Mark as handled and approved
      setHandledProposals(prev => ({
        ...prev,
        [migrationIndex]: {
          ...prev[migrationIndex],
          [proposed.v5_id]: true
        }
      }));

      setApprovedProposals(prev => ({
        ...prev,
        [migrationIndex]: {
          ...prev[migrationIndex],
          [proposed.v5_id]: true
        }
      }));

      // Refresh settings
      onSettingsRefresh();
    } catch (error) {
      console.error(`Failed to apply setting ${proposed.v5_id}:`, error);
    }
  };

  const handleRejectProposal = (migrationIndex: number, proposed: any) => {
    // Mark as handled but not approved
    setHandledProposals(prev => ({
      ...prev,
      [migrationIndex]: {
        ...prev[migrationIndex],
        [proposed.v5_id]: true
      }
    }));
  };

  const handleApproveAll = (migrationIndex: number, complexMigration: any) => {
    complexMigration.proposedMigrations.forEach((proposed: any) => {
      if (!handledProposals[`${migrationIndex}`]?.[proposed.v5_id]) {
        handleApproveProposal(migrationIndex, proposed);
      }
    });
  };

  const handleRejectAll = (migrationIndex: number, complexMigration: any) => {
    complexMigration.proposedMigrations.forEach((proposed: any) => {
      if (!handledProposals[`${migrationIndex}`]?.[proposed.v5_id]) {
        handleRejectProposal(migrationIndex, proposed);
      }
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {currentMigrationResult.requiresUserApproval
              ? 'Migration - Approval Required'
              : 'Migration Results'
            }
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={`${styles.migrationSummary} ${
          currentMigrationResult.requiresUserApproval
            ? styles.migrationSummaryPending
            : currentMigrationResult.success
              ? styles.migrationSummarySuccess
              : styles.migrationSummaryFailed
        }`}>
          <p><strong>Status:</strong> {
            currentMigrationResult.requiresUserApproval
              ? '⏳ Pending Complex Migration Approval'
              : currentMigrationResult.success
                ? '✅ Success'
                : '❌ Failed'
          }</p>
          {currentMigrationResult.requiresUserApproval && (
            <p><strong>Awaiting Approval:</strong> {
              (() => {
                const totalProposals = currentMigrationResult.complexMigrations.reduce((total, cm) => total + cm.proposedMigrations.length, 0);
                const handledCount = Object.values(handledProposals).reduce((total, migration) =>
                  total + Object.values(migration).filter(Boolean).length, 0
                );
                return `${totalProposals - handledCount} of ${totalProposals} complex proposals`;
              })()
            }</p>
          )}
          {!currentMigrationResult.requiresUserApproval && (
            <p><strong>Settings Migrated:</strong> {currentMigrationResult.migrations.length}</p>
          )}
          {currentMigrationResult.errors.length > 0 && (
            <div className={styles.migrationErrors}>
              <p><strong>Errors:</strong></p>
              <ul>
                {currentMigrationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.migrationTabContent}>
          {/* Show Complex Migrations First if they exist and require approval */}
          {currentMigrationResult.requiresUserApproval ? (
            <div className={styles.complexMigrationsSection}>
              <div className={styles.pendingMigrationsNotice}>
                <h4>⚠️ Complex Migrations Require Individual Approval</h4>
                <p>
                  Some V4 settings require manual review before they can be applied to your V5 configuration.
                  Review each proposed setting below and click <strong>Approve</strong> to apply it or <strong>Reject</strong> to discard it.
                </p>
                <p>
                  <strong>Each proposal will be processed immediately when you click Approve or Reject. Once all proposals are handled, you'll automatically see the migration details.</strong>
                </p>
                {(() => {
                  const totalProposals = currentMigrationResult.complexMigrations.reduce((total, cm) => total + cm.proposedMigrations.length, 0);
                  const handledCount = Object.values(handledProposals).reduce((total, migration) =>
                    total + Object.values(migration).filter(Boolean).length, 0
                  );
                  return (
                    <p className={styles.migrationProgress}>
                      <strong>Progress: {handledCount} of {totalProposals} proposals handled</strong>
                    </p>
                  );
                })()}
              </div>

              {currentMigrationResult.complexMigrations.every((complexMigration: any, index: number) =>
                complexMigration.proposedMigrations.every((proposed: any) =>
                  handledProposals[`${index}`]?.[proposed.v5_id] === true
                )
              ) ? (
                <div className={styles.allProposalsHandledNotice}>
                  <h4>✅ All Proposals Handled</h4>
                  <p>All complex migration proposals have been processed. Transitioning to migration details...</p>
                </div>
              ) : (
                currentMigrationResult.complexMigrations
                  .map((complexMigration: any, originalIndex: number) => {
                    const remainingProposals = complexMigration.proposedMigrations.filter((proposed: any) =>
                      !handledProposals[`${originalIndex}`]?.[proposed.v5_id]
                    );

                    // Only render if there are remaining proposals
                    if (remainingProposals.length === 0) return null;

                    return (
                <div key={originalIndex} className={styles.complexMigrationItem}>
                  <div className={styles.complexMigrationHeader}>
                    <div className={styles.complexMigrationTitle}>
                      <h4>{complexMigration.v4_id} → Multiple V5 Settings</h4>
                      <p>{complexMigration.description} ({remainingProposals.length} remaining)</p>
                    </div>
                    {remainingProposals.length > 1 && (
                      <div className={styles.complexMigrationActions}>
                        <button
                          className={styles.approveAllButton}
                          onClick={() => handleApproveAll(originalIndex, complexMigration)}
                        >
                          Approve All
                        </button>
                        <button
                          className={styles.rejectAllButton}
                          onClick={() => handleRejectAll(originalIndex, complexMigration)}
                        >
                          Reject All
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.complexMigrationOriginal}>
                    <h5>Original V4 Value:</h5>
                    <div className={styles.originalValue}>
                      {complexMigration.private 
                        ? '[PRIVATE]'
                        : (typeof complexMigration.v4_value === 'string'
                            ? complexMigration.v4_value
                            : JSON.stringify(complexMigration.v4_value))
                      }
                    </div>
                  </div>

                  <div className={styles.proposedMigrations}>
                    <h5>Proposed V5 Settings:</h5>
                    {complexMigration.proposedMigrations
                      .filter((proposed: any) => !handledProposals[`${originalIndex}`]?.[proposed.v5_id])
                      .map((proposed: any, propIndex: number) => (
                      <div key={propIndex} className={styles.proposedMigrationItem}>
                        <div className={styles.proposedMigrationHeader}>
                          <span className={styles.proposedMigrationField}>{proposed.v5_id}</span>
                        </div>

                        <div className={styles.proposedMigrationReasoning}>
                          {proposed.description}
                        </div>

                        <div className={styles.proposedValue}>
                          <strong>Value:</strong>
                          <input
                            type="text"
                            value={complexMigrationEditedValues[`${originalIndex}`]?.[proposed.v5_id] ?? (typeof proposed.v5_value === 'string' ? proposed.v5_value : JSON.stringify(proposed.v5_value))}
                            onChange={(e) => {
                              setComplexMigrationEditedValues(prev => ({
                                ...prev,
                                [originalIndex]: {
                                  ...prev[originalIndex],
                                  [proposed.v5_id]: e.target.value
                                }
                              }));
                            }}
                            className={styles.migrationValueInput}
                            placeholder="Edit the value before applying..."
                          />
                        </div>

                        <div className={styles.proposalActions}>
                          <button
                            className={styles.approveButton}
                            onClick={() => handleApproveProposal(originalIndex, proposed)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className={styles.rejectButton}
                            onClick={() => handleRejectProposal(originalIndex, proposed)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                    );
                  })
                  .filter(Boolean)
                )}
            </div>
          ) : (
            /* Show Migration Details only after complex migrations are handled */
            <div className={styles.migrationDetailsContainer}>
              <div className={styles.migrationDetailsSection}>
                <h3>Migration Details</h3>
                <div className={styles.migrationList}>
                  {currentMigrationResult.migrations.map((migration, index) => (
                    <div key={index} className={`${styles.migrationItem} ${styles.migrationSuccess} ${
                      migration.conversionType === 'complex' && allProposalsHandled ? styles.migrationComplexComplete : ''
                    }`}>
                      <div className={styles.migrationHeader}>
                        <span className={styles.migrationStatus}>
                          ✅
                        </span>
                        <strong>{migration.v4_id}</strong> → <strong>{migration.v5_id}</strong>
                      </div>
                      <div className={styles.migrationDescription}>
                        {migration.description}
                      </div>
                      <div className={styles.migrationValues}>
                        <div className={styles.migrationValue}>
                          <span className={styles.migrationValueLabel}>V4:</span>
                          <code>
                            {migration.private 
                              ? '[PRIVATE]' 
                              : (typeof migration.v4_value === 'object' 
                                  ? JSON.stringify(migration.v4_value) 
                                  : String(migration.v4_value))
                            }
                          </code>
                        </div>
                        <div className={styles.migrationValue}>
                          <span className={styles.migrationValueLabel}>V5:</span>
                          {migration.conversionType === 'complex' ? (
                            <div className={styles.complexV5Values}>
                              {/* Find and display the complex migration details */}
                              {(() => {
                                const complexMigration = currentMigrationResult.complexMigrations.find(cm => cm.v4_id === migration.v4_id);
                                if (complexMigration) {
                                  // Find the original migration index for this complex migration
                                  const originalMigrationIndex = currentMigrationResult.complexMigrations.findIndex(cm => cm.v4_id === migration.v4_id);
                                  const currentSettings = getSettings();

                                  return (
                                    <div className={styles.complexProposedValues}>
                                      {complexMigration.proposedMigrations.map((proposed: any, propIndex: number) => {
                                        const wasApproved = approvedProposals[`${originalMigrationIndex}`]?.[proposed.v5_id];
                                        const wasHandled = handledProposals[`${originalMigrationIndex}`]?.[proposed.v5_id];
                                        const currentValue = currentSettings[proposed.v5_id];

                                        return (
                                          <div key={propIndex} className={`${styles.complexProposedValue} ${
                                            wasHandled ? (wasApproved ? styles.complexProposedValueApproved : styles.complexProposedValueRejected) : ''
                                          }`}>
                                            <div className={styles.complexProposalStatus}>
                                              {wasHandled ? (wasApproved ? '✅' : '❌') : '⏳'}
                                            </div>
                                            <strong>{proposed.v5_id}:</strong>
                                            <div className={styles.complexValueContainer}>
                                              <div className={styles.complexProposedValueText}>
                                                <span className={styles.complexValueLabel}>Proposed:</span>
                                                <code>{typeof proposed.v5_value === 'object' ? JSON.stringify(proposed.v5_value) : String(proposed.v5_value)}</code>
                                              </div>
                                              <div className={styles.complexCurrentValueText}>
                                                <span className={styles.complexValueLabel}>Current:</span>
                                                <code>{typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue)}</code>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }
                                return <code>
                                  {migration.private 
                                    ? '[PRIVATE]' 
                                    : (typeof migration.v5_value === 'object' 
                                        ? JSON.stringify(migration.v5_value) 
                                        : String(migration.v5_value))
                                  }
                                </code>;
                              })()}
                            </div>
                          ) : (
                            <code>
                              {migration.private 
                                ? '[PRIVATE]' 
                                : (typeof migration.v5_value === 'object' 
                                    ? JSON.stringify(migration.v5_value) 
                                    : String(migration.v5_value))
                              }
                            </code>
                          )}
                        </div>
                      </div>
                      {migration.conversionType && (
                        <div className={styles.migrationConversion}>
                          <span className={styles.migrationConversionLabel}>Conversion:</span>
                          {migration.conversionType === 'function' ? `Custom function (${migration.conversionFunction})` :
                           migration.conversionType === 'automatic' ? 'Automatic conversion' :
                           migration.conversionType === 'complex' ? 'Complex migration with user approval' : 'Direct copy'}
                        </div>
                      )}
                      {migration.error && (
                        <div className={styles.migrationError}>
                          <strong>Error:</strong> {migration.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationModal;
