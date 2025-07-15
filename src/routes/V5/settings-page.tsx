import React, { useState, useEffect, useRef } from 'react';
import styles from './settings-page.module.css';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import MigrationModal from '../../components/settings/MigrationModal';
import {
  getSettingsSections,
  getSettings,
  saveSettings as saveSettingsUtil,
  resetSettings as resetSettingsUtil,
  resolveOptions,
  getOptionDisplayName,
  getSpecialNumbers,
  getSetting,
  setNumberMessage,
  getNumberMessageState,
  revertNumberMessage,
  formatDebugSettings,
  SettingsSection,
  SettingProperty,
  getLetterColor,
  getContrastTextColor,
  getBoardHighlightColor
} from '../../utils/settings';
import { migrateV4ToV5, isMigrationNeeded, MigrationDetail } from '../../utils/settingsMigration';

// Import centralized asset mapping
import { getMappedAsset } from '../../utils/assetMapping';

// Import version configuration
import { getVersionRoute } from '../../config/versions';

// Import telemetry utilities
import {
  getSessionHistory,
  getCurrentSession,
  clearAllTelemetryData,
  exportTelemetryData,
  getCurrentSessionStats,
  getLongTermStats,
  getTonightSessionStats
} from '../../utils/telemetry';

// Import server interaction context
import { useServerInteraction } from '../../serverInteractions/useServerInteraction';

interface SettingsPageProps {}

// Server Connection Status Component
const ServerConnectionStatus: React.FC = () => {
  const { isConnected, connectionError, roomId } = useServerInteraction();
  const serverUrl = getSetting('serverUrl', '');
  const authToken = getSetting('serverAuthToken', '');

  const hasServerSettings = serverUrl.trim() !== '' && authToken.trim() !== '';

  const getStatusColor = () => {
    if (!hasServerSettings) return '#6c757d'; // Gray for no settings
    if (connectionError) return '#dc3545'; // Red for error
    if (isConnected) return '#28a745'; // Green for connected
    return '#ffc107'; // Yellow for connecting
  };

  const getStatusText = () => {
    if (!hasServerSettings) return 'Not Configured';
    if (connectionError) return 'Connection Failed';
    if (isConnected) return roomId ? `Connected (Room: ${roomId})` : 'Connected';
    return 'Connecting...';
  };

  const getStatusIcon = () => {
    if (!hasServerSettings) return '⚙️';
    if (connectionError) return '❌';
    if (isConnected) return '✅';
    return '🔄';
  };

  return (
    <div className={styles.serverConnectionStatus}>
      <div
        className={styles.statusIndicator}
        style={{
          backgroundColor: getStatusColor(),
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}
      >
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </div>
      {connectionError && (
        <div
          className={styles.errorDetails}
          style={{
            fontSize: '0.8rem',
            color: '#dc3545',
            marginTop: '4px',
            fontStyle: 'italic'
          }}
        >
          {connectionError}
        </div>
      )}
      {!hasServerSettings && (
        <div
          className={styles.configHint}
          style={{
            fontSize: '0.8rem',
            color: '#6c757d',
            marginTop: '4px',
            fontStyle: 'italic'
          }}
        >
          Configure server URL and auth token to enable multiplayer
        </div>
      )}
    </div>
  );
};

// Color Picker Component with Undo/Redo functionality
const ColorPickerWithHistory: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const [colorHistory, setColorHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update history when value changes externally
  useEffect(() => {
    if (value !== colorHistory[historyIndex]) {
      const newHistory = colorHistory.slice(0, historyIndex + 1);
      newHistory.push(value);
      setColorHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [value, colorHistory, historyIndex]);

  const addToHistory = (newValue: string) => {
    if (newValue !== colorHistory[historyIndex]) {
      const newHistory = colorHistory.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      setColorHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.toUpperCase();
    // Ensure it starts with # if user is typing
    if (inputValue.length > 0 && !inputValue.startsWith('#')) {
      inputValue = '#' + inputValue;
    }
    // Allow empty value or valid hex color format
    if (inputValue === '' || /^#[0-9A-F]{0,6}$/.test(inputValue)) {
      // If it's a complete hex color (7 characters including #), update the property
      if (inputValue.length === 7) {
        addToHistory(inputValue);
        onChange(inputValue);
      } else if (inputValue === '') {
        const defaultColor = '#000000';
        addToHistory(defaultColor);
        onChange(defaultColor);
      }
    }
  };

  const handleColorTextBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // If incomplete hex, pad with zeros or revert to current value
    if (inputValue.length > 0 && inputValue.length < 7) {
      const paddedValue = inputValue.padEnd(7, '0');
      addToHistory(paddedValue);
      onChange(paddedValue);
    } else if (inputValue === '') {
      const defaultColor = '#000000';
      addToHistory(defaultColor);
      onChange(defaultColor);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    addToHistory(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const previousValue = colorHistory[newIndex];
        setHistoryIndex(newIndex);
        onChange(previousValue);
      }
    } else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      if (historyIndex < colorHistory.length - 1) {
        const newIndex = historyIndex + 1;
        const nextValue = colorHistory[newIndex];
        setHistoryIndex(newIndex);
        onChange(nextValue);
      }
    }
  };

  return (
    <div className={styles.colorPickerContainer}>
      <input
        type="text"
        value={value}
        onChange={handleColorTextChange}
        onBlur={handleColorTextBlur}
        onKeyDown={handleKeyDown}
        className={styles.colorTextInput}
        placeholder="#FFFFFF"
        maxLength={7}
        title="Hex color code (Ctrl+Z to undo, Ctrl+Y to redo)"
      />
      <input
        type="color"
        value={value}
        onChange={handleColorPickerChange}
        className={styles.colorInput}
        title="Color picker"
      />
    </div>
  );
};

// Audience Interactions Component
interface AudienceInteractionsProps {
  onChange: (value: any) => void;
}

const AudienceInteractions: React.FC<AudienceInteractionsProps> = ({ onChange }) => {
  const [selectedInteraction, setSelectedInteraction] = useState<string>('');
  const [interactionText, setInteractionText] = useState<string>('');
  const [imageEnabled, setImageEnabled] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [autoEnabled, setAutoEnabled] = useState<boolean>(false);
  const [audienceInteractions, setAudienceInteractions] = useState<any[]>([]);

  // Modal states - removed since we use global showAudienceInteraction

  useEffect(() => {
    // Load audience interactions
    import('../../data/audienceInteractions.json').then((data) => {
      // Show all interactions (no filtering by property)
      setAudienceInteractions(data.default);
    });
  }, []);

  const selectedInteractionData = audienceInteractions.find(interaction => interaction.id === selectedInteraction);

  const handleInteractionChange = (interactionId: string) => {
    setSelectedInteraction(interactionId);
    const interaction = audienceInteractions.find(int => int.id === interactionId);

    if (interaction) {
      // Load current text from settings using new key format
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const textKey = `${interaction.id}_text`;
      const imageKey = `${interaction.id}_enableImage`;
      const audioKey = `${interaction.id}_enableAudio`;
      const autoKey = `${interaction.id}_enableAutoPlay`;

      const currentText = currentSettings[textKey] || interaction.content?.text || '';
      setInteractionText(currentText);

      // Load image toggle setting if interaction has both text and image
      if (interaction.content?.text && interaction.content?.img) {
        setImageEnabled(currentSettings[imageKey] || false);
      } else {
        setImageEnabled(false);
      }

      // Load audio toggle setting if interaction has audio
      if (interaction.content?.audio) {
        setAudioEnabled(currentSettings[audioKey] || true); // Default to true for audio
      } else {
        setAudioEnabled(false);
      }

      // Load auto setting if interaction supports it
      if (interaction.auto) {
        setAutoEnabled(currentSettings[autoKey] || false);
      } else {
        setAutoEnabled(false);
      }
    } else {
      setInteractionText('');
      setImageEnabled(false);
      setAudioEnabled(false);
      setAutoEnabled(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInteractionText(text);
    if (selectedInteractionData) {
      // Update localStorage using new key format
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const textKey = `${selectedInteractionData.id}_text`;
      currentSettings[textKey] = text;
      localStorage.setItem('bingoSettings', JSON.stringify(currentSettings));
      onChange({ property: textKey, value: text });
    }
  };

  const handleImageToggle = (enabled: boolean) => {
    setImageEnabled(enabled);
    if (selectedInteractionData) {
      // Update localStorage using new key format
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const imageKey = `${selectedInteractionData.id}_enableImage`;
      currentSettings[imageKey] = enabled;
      localStorage.setItem('bingoSettings', JSON.stringify(currentSettings));
      onChange({ property: imageKey, value: enabled });
    }
  };

  const handleAudioToggle = (enabled: boolean) => {
    setAudioEnabled(enabled);
    if (selectedInteractionData) {
      // Update localStorage using new key format
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const audioKey = `${selectedInteractionData.id}_enableAudio`;
      currentSettings[audioKey] = enabled;
      localStorage.setItem('bingoSettings', JSON.stringify(currentSettings));
      onChange({ property: audioKey, value: enabled });
    }
  };

  const handleAutoToggle = (enabled: boolean) => {
    setAutoEnabled(enabled);
    if (selectedInteractionData?.auto) {
      // Update localStorage using new key format
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const autoKey = `${selectedInteractionData.id}_enableAutoPlay`;
      currentSettings[autoKey] = enabled;
      localStorage.setItem('bingoSettings', JSON.stringify(currentSettings));
      onChange({ property: autoKey, value: enabled });
    }
  };

  const renderIcon = (interaction: any) => {
    if (interaction.icon?.emoji) {
      return <span className={styles.interactionEmoji}>{interaction.icon.emoji}</span>;
    } else if (interaction.icon?.img) {
      const iconSrc = getMappedAsset(interaction.icon.img);
      return <img src={iconSrc} alt="" className={styles.interactionImg} />;
    }
    return null;
  };

  const handlePreview = () => {
    if (!selectedInteractionData) return;

    // Create a preview interaction object with current settings
    const previewInteraction = {
      ...selectedInteractionData,
      content: {
        ...selectedInteractionData.content,
        text: interactionText || selectedInteractionData.content?.text
      }
    };

    // Use the global showAudienceInteraction function
    if ((window as any).showAudienceInteraction) {
      (window as any).showAudienceInteraction(previewInteraction);
    } else {
      console.warn('AudienceInteractionModalManager not available');
    }
  };

  const renderContent = () => {
    if (!selectedInteractionData) return null;

    const hasTextContent = selectedInteractionData.content?.text;
    const hasImageContent = selectedInteractionData.content?.img;
    const hasBothTextAndImage = hasTextContent && hasImageContent;

    return (
      <div className={styles.interactionContent}>
        {hasBothTextAndImage && (
          <div className={styles.interactionToggle}>
            <label className={styles.checkboxLabel}>
              <span className={styles.toggleLabel}>Show Image instead of Text</span>
              <input
                type="checkbox"
                checked={imageEnabled}
                onChange={(e) => handleImageToggle(e.target.checked)}
              />
              <span className={styles.checkmark}></span>
            </label>
          </div>
        )}

        {hasImageContent && (!hasBothTextAndImage || imageEnabled) && (
          <div className={styles.interactionImagePreview}>
            <img
              src={getMappedAsset(selectedInteractionData.content.img)}
              alt={selectedInteractionData.description}
              className={styles.contentImage}
              onError={(e) => {
                console.error('Failed to load image:', selectedInteractionData.content.img);

                // Create a user-friendly error display
                const imgElement = e.target as HTMLImageElement;
                imgElement.style.display = 'none';

                // Check if error message already exists
                if (!imgElement.parentElement?.querySelector('.image-error')) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'image-error';
                  errorDiv.innerHTML = `
                    <div style="padding: 20px; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px; text-align: center;">
                      <strong>Image failed to load</strong><br>
                      <small>${selectedInteractionData.content.img}</small><br>
                      <button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Retry (Reload Page)
                      </button>
                    </div>
                  `;
                  imgElement.parentElement?.appendChild(errorDiv);
                }
              }}
              onLoad={() => {
                // Remove any existing error messages
                const errorDiv = document.querySelector('.image-error');
                if (errorDiv) {
                  errorDiv.remove();
                }
              }}
            />
          </div>
        )}

        {hasTextContent && (!hasBothTextAndImage || !imageEnabled) && (
          <div className={styles.interactionTextEditor}>
            <label className={styles.interactionLabel}>Message Text:</label>
            <textarea
              value={interactionText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Enter custom message for ${selectedInteractionData.description}`}
              className={styles.interactionTextarea}
            />
          </div>
        )}

        {selectedInteractionData.auto && (
          <div className={styles.interactionAutoToggle}>
            <label className={styles.checkboxLabel}>
              <span className={styles.autoLabel}>Enable Auto Activation</span>
              <input
                type="checkbox"
                checked={autoEnabled}
                onChange={(e) => handleAutoToggle(e.target.checked)}
              />
              <span className={styles.checkmark}></span>
            </label>
            <p className={styles.autoDescription}>
              Automatically trigger when number {selectedInteractionData.auto.number} is called
            </p>
          </div>
        )}

        {selectedInteractionData.content?.audio && (
          <div className={styles.interactionAudioToggle}>
            <label className={styles.checkboxLabel}>
              <span className={styles.audioLabel}>Enable Audio</span>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => handleAudioToggle(e.target.checked)}
              />
              <span className={styles.checkmark}></span>
            </label>
            <p className={styles.audioDescription}>
              Play audio when this interaction is triggered (also requires Sound Effects to be enabled)
            </p>
          </div>
        )}

        {/* Preview Button */}
        <div className={styles.interactionPreview}>
          <button
            onClick={handlePreview}
            className={styles.previewBtn}
          >
            🎬 Preview Interaction
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.audienceInteractionsContainer}>
      <div className={styles.interactionSelector}>
        <label className={styles.interactionLabel}>Select Audience Interaction:</label>
        <select
          value={selectedInteraction}
          onChange={(e) => handleInteractionChange(e.target.value)}
          className={styles.interactionSelect}
        >
          <option value="">Choose an interaction...</option>
          {audienceInteractions.map((interaction) => (
            <option key={interaction.id} value={interaction.id}>
              {interaction.description}
            </option>
          ))}
        </select>

        {selectedInteractionData && (
          <div className={styles.selectedInteractionInfo}>
            <div className={styles.interactionHeader}>
              {renderIcon(selectedInteractionData)}
              <span className={styles.interactionName}>{selectedInteractionData.description}</span>
            </div>
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  );
};

// Special Numbers Grid Component
interface SpecialNumbersGridProps {
  property: SettingProperty;
  onChange: (value: any) => void;
  colorVersion?: number;
}

const SpecialNumbersGrid: React.FC<SpecialNumbersGridProps> = ({ property, onChange, colorVersion = 0 }) => {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [textareaValue, setTextareaValue] = useState<string>('');

  // Get current special numbers (pre-built + user customizations, excluding cleared ones)
  const specialNumbers = getSpecialNumbers();

  const handleNumberClick = (number: number) => {
    setSelectedNumber(number);
    const messageState = getNumberMessageState(number);

    // Set textarea value based on current state
    if (messageState === 'cleared') {
      setTextareaValue('');
    } else {
      setTextareaValue(specialNumbers[number.toString()] || '');
    }
  };

  const handleTextareaChange = (value: string) => {
    setTextareaValue(value);

    if (selectedNumber !== null) {
      // Use the utility function to handle the message setting logic
      setNumberMessage(selectedNumber, value);

      // Update the onChange callback with the new user customizations
      const updatedCustomizations = getSetting('specialNumbers', {});
      onChange(updatedCustomizations);
    }
  };

  const handleClearMessage = () => {
    if (selectedNumber !== null) {
      const messageState = getNumberMessageState(selectedNumber);

      if (messageState === 'pre-built' || messageState === 'overridden') {
        // For pre-built messages, mark as cleared
        setNumberMessage(selectedNumber, '');
      } else if (messageState === 'custom') {
        // For custom messages, just remove them
        setNumberMessage(selectedNumber, '');
      }

      setTextareaValue('');

      // Update the onChange callback
      const updatedCustomizations = getSetting('specialNumbers', {});
      onChange(updatedCustomizations);
    }
  };

  const handleRevertMessage = () => {
    if (selectedNumber !== null) {
      revertNumberMessage(selectedNumber);

      // Update textarea with the pre-built message
      const preBuiltMessage = (require('../../data/specialNumbers.json') as { [key: string]: string })[selectedNumber.toString()] || '';
      setTextareaValue(preBuiltMessage);

      // Update the onChange callback
      const updatedCustomizations = getSetting('specialNumbers', {});
      onChange(updatedCustomizations);
    }
  };

  // Generate numbers 1-75 in a 5x15 grid (5 rows for B-I-N-G-O)
  const generateNumberGrid = () => {
    const grid: number[][] = [[], [], [], [], []]; // B, I, N, G, O rows

    // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 15; col++) {
        const number = (row * 15) + col + 1;
        grid[row].push(number);
      }
    }

    return grid;
  };

  const getPlaceholderText = (number: number): string => {
    const messageState = getNumberMessageState(number);

    switch (messageState) {
      case 'pre-built':
        return `Pre-built message for ${number}`;
      case 'custom':
        return `Custom message for ${number}`;
      case 'overridden':
        return `Custom message for ${number} (overrides pre-built)`;
      case 'cleared':
        return `Enter message for ${number} (pre-built message was cleared)`;
      default:
        return `Enter message for ${number}`;
    }
  };

  const numberGrid = generateNumberGrid();
  const rowHeaders = ['B', 'I', 'N', 'G', 'O'];
  const boardHighlightColor = getBoardHighlightColor();
  const boardHighlightTextColor = getContrastTextColor(boardHighlightColor);

  return (
    <div className={styles.specialNumbersGridContainer}>
      <div className={styles.bingoGridHorizontal}>
        {rowHeaders.map((header, rowIndex) => {
          const letterColor = getLetterColor(header);
          const letterTextColor = getContrastTextColor(letterColor);

          return (
            <div key={`${header}-${colorVersion}`} className={styles.bingoRow}>
              <div
                className={styles.rowHeader}
                style={{
                  backgroundColor: letterColor,
                  color: letterTextColor
                }}
              >
                {header}
              </div>
              <div className={styles.rowNumbers}>
                {numberGrid[rowIndex].map(number => {
                  const messageState = getNumberMessageState(number);
                  const hasMessage = specialNumbers[number.toString()];
                  const isSelected = selectedNumber === number;

                  // Dynamic styling for cells with messages
                  const cellStyle = hasMessage ? {
                    backgroundColor: boardHighlightColor,
                    borderColor: boardHighlightColor,
                    color: boardHighlightTextColor
                  } : {};

                  // Map messageState to camelCase className
                  const getMessageStateClass = (state: string) => {
                    switch (state) {
                      case 'pre-built': return styles.preBuilt;
                      case 'custom': return styles.custom;
                      case 'overridden': return styles.overridden;
                      case 'cleared': return styles.cleared;
                      case 'none': return styles.none;
                      default: return '';
                    }
                  };

                  return (
                    <button
                      key={`${number}-${colorVersion}`}
                      className={`${styles.numberCell} ${messageState ? getMessageStateClass(messageState) : ''} ${hasMessage ? styles.hasMessage : ''} ${isSelected ? styles.selected : ''}`}
                      style={!isSelected ? cellStyle : {}}
                      onClick={() => handleNumberClick(number)}
                    >
                      {number}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.numberMessageEditor}>
        <textarea
          value={textareaValue}
          onChange={(e) => handleTextareaChange(e.target.value)}
          placeholder={selectedNumber ? getPlaceholderText(selectedNumber) : 'Select a number above to edit its message'}
          className={styles.messageTextarea}
          disabled={selectedNumber === null}
        />

        {selectedNumber && (
          <div className={styles.messageActions}>
            <div className={styles.selectedNumberInfo}>
              <span className={styles.selectedNumber}>Number {selectedNumber}</span>
              {(() => {
                const messageState = getNumberMessageState(selectedNumber);
                switch (messageState) {
                  case 'pre-built':
                    return <span className={`${styles.messageBadge} ${styles.preBuilt}`}>Pre-built</span>;
                  case 'custom':
                    return <span className={`${styles.messageBadge} ${styles.custom}`}>Custom</span>;
                  case 'overridden':
                    return <span className={`${styles.messageBadge} ${styles.overridden}`}>Overridden</span>;
                  case 'cleared':
                    return <span className={`${styles.messageBadge} ${styles.cleared}`}>Cleared</span>;
                  default:
                    return <span className={`${styles.messageBadge} ${styles.none}`}>No message</span>;
                }
              })()}
            </div>
            <div className={styles.messageActionButtons}>
              <button
                className={styles.clearMessageBtn}
                onClick={handleClearMessage}
                disabled={getNumberMessageState(selectedNumber) === 'none'}
              >
                Clear Message
              </button>
              {(getNumberMessageState(selectedNumber) === 'overridden' || getNumberMessageState(selectedNumber) === 'cleared') && (
                <button
                  className={styles.revertMessageBtn}
                  onClick={handleRevertMessage}
                >
                  Revert to Pre-built
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [settingsSections, setSettingsSections] = useState<SettingsSection[]>([]);
  const [debugCollapsed, setDebugCollapsed] = useState<boolean>(true); // Debug section collapsed by default
  const [telemetryCollapsed, setTelemetryCollapsed] = useState<boolean>(true); // Telemetry section collapsed by default
  const [currentSettings, setCurrentSettings] = useState<{ [key: string]: any }>({});
  const [colorVersion, setColorVersion] = useState<number>(0);
  const [migrationModalVisible, setMigrationModalVisible] = useState<boolean>(false);

  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migratedCount: number;
    errors: string[];
    migrations: MigrationDetail[];
    complexMigrations: any[]; // ComplexMigrationResult[]
    v4Settings: { [key: string]: any };
    v5Settings: { [key: string]: any };
    requiresUserApproval: boolean;
  } | null>(null);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const urlParameterProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    // Load settings on component mount
    const sections = getSettingsSections();
    setSettingsSections(sections);

    // Load current settings for debug section
    const settings = getSettings();
    setCurrentSettings(settings);

    // Cleanup function to clear any pending auto-save timeout
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Separate effect for handling URL parameters after sections are loaded
  useEffect(() => {
    if (settingsSections.length === 0 || urlParameterProcessedRef.current) return; // Wait for sections to be loaded and avoid reprocessing

    // Check for URL parameters to expand specific sections
    const urlParams = new URLSearchParams(window.location.search);
    const expandSection = urlParams.get('expand');

    if (expandSection) {
      console.log('Expand section requested:', expandSection);
      urlParameterProcessedRef.current = true; // Mark as processed

      // Find and expand the specified section
      const updatedSections = settingsSections.map(section => {
        const sectionKey = section.title.toLowerCase().replace(/\s+/g, '-');

        if (sectionKey === expandSection.toLowerCase()) {
          console.log('Found matching section, expanding:', section.title);
          return { ...section, collapsed: false };
        }
        return section;
      });

      setSettingsSections(updatedSections);

      // Clear the URL parameter after processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('expand');
      window.history.replaceState({}, '', newUrl.toString());

      // Scroll to the expanded section after a brief delay
      setTimeout(() => {
        const targetSection = document.querySelector(`[data-section="${expandSection}"]`);
        if (targetSection) {
          // Add highlight class for visual feedback
          targetSection.classList.add('highlight-expanded');

          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });

          // Remove highlight class after animation completes
          setTimeout(() => {
            targetSection.classList.remove('highlight-expanded');
          }, 2000);
        }
      }, 100);
    }
  }, [settingsSections]); // Run when sections change

  // Listen for color setting changes
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent;

      // Handle reset action
      if (customEvent.detail && customEvent.detail.action === 'reset') {
        setColorVersion(prev => prev + 1);
        return;
      }

      // Handle save action - check if any color settings were changed
      if (customEvent.detail && customEvent.detail.action === 'save' && customEvent.detail.settings) {
        const settings = customEvent.detail.settings;
        const colorSettings = [
          'boardHighlightColor',
          'bingoLetterColorB',
          'bingoLetterColorI',
          'bingoLetterColorN',
          'bingoLetterColorG',
          'bingoLetterColorO'
        ];

        // Check if any color settings exist in the saved settings
        const hasColorChanges = colorSettings.some(setting => settings.hasOwnProperty(setting));

        if (hasColorChanges) {
          setColorVersion(prev => prev + 1);
        }
        return;
      }

      // Handle specific setting changes (legacy support)
      if (customEvent.detail && customEvent.detail.id && (
        customEvent.detail.id === 'boardHighlightColor' ||
        customEvent.detail.id === 'bingoLetterColorB' ||
        customEvent.detail.id === 'bingoLetterColorI' ||
        customEvent.detail.id === 'bingoLetterColorN' ||
        customEvent.detail.id === 'bingoLetterColorG' ||
        customEvent.detail.id === 'bingoLetterColorO'
      )) {
        setColorVersion(prev => prev + 1);
      }
    };

    window.addEventListener('bingoSettingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('bingoSettingsChanged', handleSettingsChange);
    };
  }, []);

  const toggleSection = (index: number) => {
    setSettingsSections(sections =>
      sections.map((section, i) =>
        i === index ? { ...section, collapsed: !section.collapsed } : section
      )
    );
  };

  const updateSetting = (sectionIndex: number, settingId: string, value: any) => {
    setSettingsSections(sections => {
      const updatedSections = sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              properties: section.properties.map(property =>
                property.id === settingId ? { ...property, value } : property
              )
            }
          : section
      );

      // Get all current settings for saving and debug display
      const allSettings = updatedSections.reduce((acc, section) => {
        section.properties.forEach(property => {
          acc[property.id] = property.value;
        });
        return acc;
      }, {} as { [key: string]: any });

      // Update current settings state for debug section
      setCurrentSettings(allSettings);

      // Clear any existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set a new timeout for debounced auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveSettingsUtil(allSettings);
        // Settings save silently in background
        // Event dispatching is handled by saveSettings function
      }, 500); // 500ms debounce delay

      return updatedSections;
    });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const success = resetSettingsUtil();
      if (success) {
        // Reload settings from defaults
        const sections = getSettingsSections();
        setSettingsSections(sections);

        // Update current settings for debug section
        const settings = getSettings();
        setCurrentSettings(settings);

        // Settings reset silently without notification
      }
      // No error notification - reset operation fails silently
    }
  };

  const handleMigration = () => {
    const result = migrateV4ToV5();

    // The result now already contains all the detailed information we need
    setMigrationResult(result);
    // Show migration modal
    setMigrationModalVisible(true);

    // Reload settings after migration
    const sections = getSettingsSections();
    setSettingsSections(sections);

    const settings = getSettings();
    setCurrentSettings(settings);
  };

  const renderSettingInput = (property: SettingProperty, sectionIndex: number) => {
    const onChange = (value: any) => updateSetting(sectionIndex, property.id, value);    // Special handling for version setting
    if (property.id === 'defaultVersion') {
      const handleVersionChange = (value: string) => {
        onChange(value);

        // Check if we need to navigate
        const shouldNavigate = () => {
          // If we're on V4 and selecting something other than V4, navigate
          if (window.location.pathname.includes('/v4/') && value !== 'v4') {
            return true;
          }

          // If we're on V5 and selecting V4, navigate
          if (!window.location.pathname.includes('/v4/') && value === 'v4') {
            return true;
          }

          // If we're on V5 and selecting latest or v5, no need to navigate (they're the same)
          if (!window.location.pathname.includes('/v4/') && (value === 'latest' || value === 'v5')) {
            return false;
          }

          return false;
        };

        // Only navigate if necessary
        if (shouldNavigate()) {
          const route = getVersionRoute(value, 'root');
          if (window.confirm(`Switch to ${value === 'latest' ? 'Latest' : value.toUpperCase()} version? This will navigate away from the current page.`)) {
            if (route.external) {
              window.location.href = route.path;
            } else {
              window.location.href = route.path;
            }
          }
        }
      };

      const selectOptions = resolveOptions(property.options, property);
      return (
        <select
          value={property.value}
          onChange={(e) => handleVersionChange(e.target.value)}
          className={styles.selectInput}
        >
          {selectOptions.map((option: string) => (
            <option key={option} value={option}>
              {getOptionDisplayName(option, property)}
            </option>
          ))}
        </select>
      );
    }

    switch (property.type) {
      case 'boolean':
        return (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={property.value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className={styles.checkmark}></span>
          </label>
        );
      case 'number':
        return (
          <input
            type="number"
            value={property.value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={styles.numberInput}
          />
        );
      case 'colorpicker':
        return (
          <ColorPickerWithHistory
            value={property.value}
            onChange={onChange}
          />
        );
      case 'select':
        const selectOptions = resolveOptions(property.options, property);
        return (
          <select
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.selectInput}
          >
            {selectOptions.map((option: string) => (
              <option key={option} value={option}>
                {getOptionDisplayName(option, property)}
              </option>
            ))}
          </select>
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.textInput}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.textareaInput}
            readOnly={property.readonly}
            style={{
              backgroundColor: property.readonly ? '#f8f9fa' : 'white',
              cursor: property.readonly ? 'default' : 'text'
            }}
          />
        );
      case 'password':
        return (
          <input
            type="password"
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className={styles.passwordInput}
            placeholder="Enter password..."
          />
        );
      case 'combo+textarea':
        const comboOptions = resolveOptions(property.options, property);
        return (
          <div className={styles.comboTextareaContainer}>
            <select
              value={property.value?.selectedKey || ''}
              onChange={(e) => {
                const selectedKey = e.target.value;
                const defaultData = property.default?.[selectedKey];
                const defaultValue = defaultData && typeof defaultData === 'object' && 'value' in defaultData
                  ? defaultData.value
                  : '';

                onChange({
                  selectedKey: selectedKey,
                  customValue: selectedKey ? defaultValue : ''
                });
              }}
              className={styles.comboSelect}
            >
              <option value="">Select option...</option>
              {comboOptions.map((option: string) => (
                <option key={option} value={option}>
                  {getOptionDisplayName(option, property)}
                </option>
              ))}
            </select>
            <textarea
              value={property.value?.customValue || ''}
              onChange={(e) => onChange({
                selectedKey: property.value?.selectedKey || '',
                customValue: e.target.value
              })}
              className={styles.comboTextarea}
              placeholder="Enter details..."
            />
          </div>
        );
    }
  };

  // Telemetry Section Component
  interface TelemetrySectionProps {
    collapsed: boolean;
    onToggle: () => void;
  }

  const TelemetrySection: React.FC<TelemetrySectionProps> = ({ collapsed, onToggle }) => {
    const [sessionHistory, setSessionHistory] = useState(getSessionHistory());
    const [currentSession, setCurrentSession] = useState(getCurrentSession());
    const [currentStats, setCurrentStats] = useState(getCurrentSessionStats());
    const [longTermStats, setLongTermStats] = useState(getLongTermStats());
    const [tonightStats, setTonightStats] = useState(getTonightSessionStats());

    useEffect(() => {
      const interval = setInterval(() => {
        setSessionHistory(getSessionHistory());
        setCurrentSession(getCurrentSession());
        setCurrentStats(getCurrentSessionStats());
        setLongTermStats(getLongTermStats());
        setTonightStats(getTonightSessionStats());
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }, []);

    const handleClearTelemetry = () => {
      if (window.confirm('Are you sure you want to clear all telemetry data? This action cannot be undone.')) {
        clearAllTelemetryData();
        setSessionHistory([]);
        setCurrentSession(null);
        setCurrentStats(null);
        setLongTermStats(getLongTermStats());
        setTonightStats(getTonightSessionStats());
      }
    };

    const handleExportTelemetry = () => {
      const data = exportTelemetryData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bingo-telemetry-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const formatDuration = (milliseconds: number) => {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    };

    return (
      <div className={`${styles.settingsSection} telemetry-section`}>
        <div className={styles.sectionHeader} onClick={onToggle}>
          <h2>Game Telemetry</h2>
          <span className={`${styles.collapseArrow} ${collapsed ? styles.collapsed : ''}`}>
            ▼
          </span>
        </div>

        {!collapsed && (
          <div className={styles.sectionContent}>
            <div className={styles.sectionContentWrapper}>
              {/* Current Session */}
              {currentStats && (
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Current Session</label>
                    <p className={styles.settingDescription}>
                      Information about the currently active game session.
                    </p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={styles.telemetryInfo}>
                      <p><strong>Game:</strong> {currentStats.gameName}</p>
                      <p><strong>Variant:</strong> {currentStats.variant}</p>
                      <p><strong>Free Space:</strong> {currentStats.freeSpace ? 'ON' : 'OFF'}</p>
                      <p><strong>Numbers Called:</strong> {currentStats.numbersCalled}/{currentStats.totalNumbers} ({currentStats.percentComplete}%)</p>
                      <p><strong>Duration:</strong> {formatDuration(currentStats.duration)}</p>
                      <p><strong>Started:</strong> {currentStats.startTime.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Session History */}
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Session History</label>
                  <p className={styles.settingDescription}>
                    History of completed game sessions. Shows {sessionHistory.length} total sessions.
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.telemetryHistory}>
                    {sessionHistory.length === 0 ? (
                      <p>No completed sessions yet.</p>
                    ) : (
                      <div className={styles.sessionList}>
                        {sessionHistory.slice(-5).reverse().map((session, index) => (
                          <div key={session.sessionId} className={styles.sessionItem}>
                            <div className={styles.sessionHeader}>
                              <strong>{session.gameName}</strong>
                              <span className={styles.sessionDate}>
                                {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={styles.sessionDetails}>
                              <span>Numbers: {session.numbersCalled.length}/{session.totalNumbers}</span>
                              {session.endTime && (
                                <span>Duration: {formatDuration(session.endTime.getTime() - session.startTime.getTime())}</span>
                              )}
                              {session.winners && session.winners.length > 0 && (
                                <span>Winners: {session.winners.length} ({session.winners.map(w => w.detectionMethod).join(', ')})</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {sessionHistory.length > 5 && (
                          <p className={styles.sessionNote}>Showing 5 most recent sessions of {sessionHistory.length} total.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tonight's Session Stats */}
              {tonightStats && tonightStats.totalGames > 0 && (
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Tonight's Session</label>
                    <p className={styles.settingDescription}>
                      Statistics for all games played in today's session.
                    </p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={styles.telemetryInfo}>
                      <p><strong>Total Games:</strong> {tonightStats.totalGames}</p>
                      <p><strong>Total Numbers Called:</strong> {tonightStats.totalNumbersCalled}</p>
                      <p><strong>Total Duration:</strong> {formatDuration(tonightStats.totalDuration)}</p>
                      <p><strong>Total Winners:</strong> {tonightStats.totalWinners}</p>
                      <p><strong>Average Game Duration:</strong> {formatDuration(tonightStats.averageGameDuration)}</p>
                      <p><strong>Average Numbers Per Game:</strong> {Math.round(tonightStats.averageNumbersPerGame * 100) / 100}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Long-Term Statistics */}
              {longTermStats && longTermStats.totalGamesPlayed > 0 && (
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Long-Term Statistics</label>
                    <p className={styles.settingDescription}>
                      Overall statistics across all recorded game sessions.
                    </p>
                  </div>
                  <div className={styles.settingControl}>
                    <div className={styles.telemetryInfo}>
                      <p><strong>Total Games Played:</strong> {longTermStats.totalGamesPlayed}</p>
                      <p><strong>Average Call Rate:</strong> {Math.round(longTermStats.overallStats.averageCallRate * 100) / 100} numbers/second</p>
                      {longTermStats.overallStats.shortestWinnerNumbers !== Infinity && (
                        <>
                          <p><strong>Shortest Winner:</strong> {longTermStats.overallStats.shortestWinnerNumbers} numbers</p>
                          <p><strong>Longest Winner:</strong> {longTermStats.overallStats.longestWinnerNumbers} numbers</p>
                        </>
                      )}
                      <p><strong>Most Called Number:</strong> {
                        Object.entries(longTermStats.numberCallFrequency).length > 0 ?
                        Object.entries(longTermStats.numberCallFrequency)
                          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
                        : 'None'
                      }</p>
                      <p><strong>Game Types Played:</strong> {Object.keys(longTermStats.gameTypeStats).length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Telemetry Actions</label>
                  <p className={styles.settingDescription}>
                    Export or clear telemetry data. Export includes all session history and statistics.
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.telemetryActions}>
                    <button
                      className={`${styles.telemetryButton} ${styles.export}`}
                      onClick={handleExportTelemetry}
                      disabled={sessionHistory.length === 0 && !currentSession}
                    >
                      📊 Export Data
                    </button>
                    <button
                      className={`${styles.telemetryButton} ${styles.clear}`}
                      onClick={handleClearTelemetry}
                    >
                      🗑️ Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Static Debug Section Component
  interface DebugSectionProps {
    collapsed: boolean;
    onToggle: () => void;
    currentSettings: { [key: string]: any };
  }

  const DebugSection: React.FC<DebugSectionProps> = ({ collapsed, onToggle, currentSettings }) => {
    const debugInfo = formatDebugSettings(currentSettings);

    // Get the debug settings from the main settings sections
    const debugSettings = settingsSections.find(section => section.title === 'Debug Settings');

    return (
      <div className={`${styles.settingsSection} ${styles.debugSection}`}>
        <div className={styles.sectionHeader} onClick={onToggle}>
          <h2>Debug</h2>
          <span className={`${styles.collapseArrow} ${collapsed ? styles.collapsed : ''}`}>
            ▼
          </span>
        </div>

        {!collapsed && (
          <div className={styles.sectionContent}>
            <div className={styles.sectionContentWrapper}>
              {/* Debug Settings */}
              {debugSettings && debugSettings.properties.map((property) => {
                const originalSectionIndex = settingsSections.findIndex(section => section.title === 'Debug Settings');
                return (
                  <div key={property.id} className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <label className={styles.settingLabel}>{property.Label}</label>
                      <p className={styles.settingDescription}>{property.description}</p>
                    </div>
                    <div className={styles.settingControl}>
                      {renderSettingInput(property, originalSectionIndex)}
                    </div>
                  </div>
                );
              })}

              {/* Debug JSON Dump */}
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Current Settings JSON</label>
                  <p className={styles.settingDescription}>
                    Developer information showing all current settings in JSON format. This area is read-only and automatically updates when settings change.
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <textarea
                    value={debugInfo}
                    readOnly
                    className={styles.textareaInput}
                    style={{
                      backgroundColor: '#f8f9fa',
                      cursor: 'default'
                    }}
                  />
                </div>
              </div>

              {/* V4 to V5 Migration */}
              {isMigrationNeeded() && (
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>V4 Settings Migration</label>
                    <p className={styles.settingDescription}>
                      Migrate your V4 settings to the new V5 format. This will preserve your existing preferences.
                    </p>
                  </div>
                  <div className={styles.settingControl}>
                    <button
                      onClick={handleMigration}
                      className={styles.resetButton}
                      style={{ backgroundColor: '#007acc' }}
                    >
                      Migrate V4 Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.settingsPage}>
      <SidebarWithMenu
        currentPage="settings"
        onReset={handleReset}
        pageButtons={[
          {
            id: 'reset-settings',
            label: 'Reset',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23,4 23,10 17,10"/>
                <polyline points="1,20 1,14 7,14"/>
                <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10"/>
                <path d="M3.51,15a9,9,0,0,0,14.85,3.36L23,14"/>
              </svg>
            ),
            onClick: handleReset,
            className: 'reset-settings-button'
          }
        ]}
      />

      <div className={styles.settingsContent}>
        <div className={styles.settingsMainHeader}>
          <div className={styles.settingsHeader}>
            <h1>Settings</h1>
            <p>Configure your bingo game preferences • <span className={styles.autoSaveIndicator}>Auto-save enabled ✓</span></p>
          </div>

          <div className={`${styles.specialNumbersHeader} ${styles.desktopOnly}`}>
            <h1>Special Numbers</h1>
            <p>Customize messages shown for certain numbers when activated • <span className={styles.autoSaveIndicator}>Auto-save enabled ✓</span></p>
          </div>
        </div>

        <div className={styles.settingsLayout}>
          <div className={styles.settingsSections}>
            {settingsSections.map((section, sectionIndex) => {
              // Skip debug settings as they're handled separately
              if (section.title === 'Debug Settings') return null;

              return (
                <div key={section.title} className={styles.settingsSection} data-section={section.title.toLowerCase().replace(/\s+/g, '-')}>
                  <div
                    className={styles.sectionHeader}
                    onClick={() => toggleSection(sectionIndex)}
                  >
                    <h2>{section.title}</h2>
                    <span className={`${styles.collapseArrow} ${section.collapsed ? styles.collapsed : ''}`}>
                      ▼
                    </span>
                  </div>

                  {!section.collapsed && (
                    <div className={styles.sectionContent}>
                      <div className={styles.sectionContentWrapper}>
                        {/* Add server connection status for Bingo Server Settings */}
                        {section.title === 'Bingo Server Settings' && (
                          <div className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                              <label className={styles.settingLabel}>Connection Status</label>
                              <p className={styles.settingDescription}>Real-time status of server connection. Auto-reconnect attempts at configurable intervals.</p>
                            </div>
                            <div className={styles.settingControl}>
                              <ServerConnectionStatus />
                            </div>
                          </div>
                        )}

                        {section.properties.map((property) => (
                          <div key={property.id} className={styles.settingItem}>
                            <div className={styles.settingInfo}>
                              <label className={styles.settingLabel}>{property.Label}</label>
                              <p className={styles.settingDescription}>{property.description}</p>
                            </div>
                            <div className={styles.settingControl}>
                              {renderSettingInput(property, sectionIndex)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Static Telemetry Section */}
            <TelemetrySection
              collapsed={telemetryCollapsed}
              onToggle={() => setTelemetryCollapsed(!telemetryCollapsed)}
            />

            {/* Static Debug Section */}
            <DebugSection
              collapsed={debugCollapsed}
              onToggle={() => setDebugCollapsed(!debugCollapsed)}
              currentSettings={currentSettings}
            />
          </div>

          <div className={styles.specialNumbersSection}>
            <div className={`${styles.specialNumbersHeader} ${styles.mobileOnly}`}>
              <h1>Special Numbers</h1>
              <p>Customize messages shown for certain numbers when activated • <span className={styles.autoSaveIndicator}>Auto-save enabled ✓</span></p>
            </div>

            <SpecialNumbersGrid
              property={{
                id: 'specialNumbers',
                value: getSetting('specialNumbers', {}),
                type: 'special-numbers',
                Label: 'Special Numbers',
                section: 'Special Numbers',
                description: 'Custom messages for numbers',
                default: {}
              }}
              onChange={(value) => {
                // Update the localStorage directly for special numbers
                const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
                currentSettings['specialNumbers'] = value;
                localStorage.setItem('bingoSettings', JSON.stringify(currentSettings));
              }}
              colorVersion={colorVersion}
            />

            {/* Audience Interactions Section */}
            <div className={styles.audienceInteractionsSection}>
              <div className={styles.sectionHeaderStatic}>
                <h2>Audience Interactions</h2>
                <p>Configure audience interaction messages and auto-triggers • <span className={styles.autoSaveIndicator}>Auto-save enabled ✓</span></p>
              </div>

              <div className={styles.sectionContentStatic}>
                <AudienceInteractions
                  onChange={(data) => {
                    // Handle audience interaction changes
                    console.log('Audience interaction updated:', data);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Results Modal */}
      <MigrationModal
        isVisible={migrationModalVisible && !!migrationResult}
        migrationResult={migrationResult}
        onClose={() => setMigrationModalVisible(false)}
        onSettingsRefresh={() => {
          // Refresh settings after migration - reload both sections and current settings
          const sections = getSettingsSections();
          setSettingsSections(sections);
          setCurrentSettings(getSettings());
        }}
      />

    </div>
  );
};

export default SettingsPage;
