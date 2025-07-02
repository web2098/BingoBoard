import React, { useState, useEffect, useRef } from 'react';
import './settings-page.css';
import HamburgerMenu from '../components/HamburgerMenu';
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
  SettingProperty
} from '../utils/settings';

// Import modal components
import { TextModal, ImageModal, AnimatedModal } from '../components/modals';

// Import centralized asset mapping
import { getMappedAsset } from '../utils/assetMapping';

interface SettingsPageProps {}

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

  // Modal states
  const [textModalVisible, setTextModalVisible] = useState<boolean>(false);
  const [imageModalVisible, setImageModalVisible] = useState<boolean>(false);
  const [animatedModalVisible, setAnimatedModalVisible] = useState<boolean>(false);

  useEffect(() => {
    // Load audience interactions
    import('../data/audienceInteractions.json').then((data) => {
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
      return <span className="interaction-emoji">{interaction.icon.emoji}</span>;
    } else if (interaction.icon?.img) {
      const iconSrc = getMappedAsset(interaction.icon.img);
      return <img src={iconSrc} alt="" className="interaction-img" />;
    }
    return null;
  };

  const handlePreview = () => {
    if (!selectedInteractionData) return;

    const hasText = selectedInteractionData.content?.text || interactionText;
    const hasImage = selectedInteractionData.content?.img;
    const hasAudio = selectedInteractionData.content?.audio;

    // Check if this is a dual-support interaction (has both text and image)
    if (hasText && hasImage && !hasAudio) {
      // Check the {id}_enableImage setting to determine which modal to show
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const imageKey = `${selectedInteractionData.id}_enableImage`;
      const enableImage = currentSettings[imageKey] || false;

      if (enableImage) {
        // Show image modal
        setImageModalVisible(true);
      } else {
        // Show text modal
        setTextModalVisible(true);
      }
      return;
    }

    // Original logic for single-content interactions
    if (hasText && !hasImage) {
      // Text-only modal
      setTextModalVisible(true);
    } else if (hasImage && !hasAudio && !hasText) {
      // Image-only modal
      setImageModalVisible(true);
    } else if (hasImage && hasAudio) {
      // Animated modal with audio
      setAnimatedModalVisible(true);
    }
  };

  const getPreviewText = () => {
    if (interactionText) return interactionText;
    if (selectedInteractionData?.content?.text) return selectedInteractionData.content.text;
    return 'Preview';
  };

  const getMappedImageSrc = () => {
    if (!selectedInteractionData?.content?.img) return '';
    return getMappedAsset(selectedInteractionData.content.img);
  };

  const getMappedAudioSrc = () => {
    if (!selectedInteractionData?.content?.audio) return '';
    return getMappedAsset(selectedInteractionData.content.audio);
  };

  const renderContent = () => {
    if (!selectedInteractionData) return null;

    const hasTextContent = selectedInteractionData.content?.text;
    const hasImageContent = selectedInteractionData.content?.img;
    const hasBothTextAndImage = hasTextContent && hasImageContent;

    return (
      <div className="interaction-content">
        {hasBothTextAndImage && (
          <div className="interaction-toggle">
            <label className="checkbox-label">
              <span className="toggle-label">Show Image instead of Text</span>
              <input
                type="checkbox"
                checked={imageEnabled}
                onChange={(e) => handleImageToggle(e.target.checked)}
              />
              <span className="checkmark"></span>
            </label>
          </div>
        )}

        {hasImageContent && (!hasBothTextAndImage || imageEnabled) && (
          <div className="interaction-image-preview">
            <img
              src={getMappedAsset(selectedInteractionData.content.img)}
              alt={selectedInteractionData.description}
              className="content-image"
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
          <div className="interaction-text-editor">
            <label className="interaction-label">Message Text:</label>
            <textarea
              value={interactionText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Enter custom message for ${selectedInteractionData.description}`}
              className="interaction-textarea"
            />
          </div>
        )}

        {selectedInteractionData.auto && (
          <div className="interaction-auto-toggle">
            <label className="checkbox-label">
              <span className="auto-label">Enable Auto Activation</span>
              <input
                type="checkbox"
                checked={autoEnabled}
                onChange={(e) => handleAutoToggle(e.target.checked)}
              />
              <span className="checkmark"></span>
            </label>
            <p className="auto-description">
              Automatically trigger when number {selectedInteractionData.auto.number} is called
            </p>
          </div>
        )}

        {selectedInteractionData.content?.audio && (
          <div className="interaction-audio-toggle">
            <label className="checkbox-label">
              <span className="audio-label">Enable Audio</span>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => handleAudioToggle(e.target.checked)}
              />
              <span className="checkmark"></span>
            </label>
            <p className="audio-description">
              Play audio when this interaction is triggered (also requires Sound Effects to be enabled)
            </p>
          </div>
        )}

        {/* Preview Button */}
        <div className="interaction-preview">
          <button
            onClick={handlePreview}
            className="preview-btn"
          >
            🎬 Preview Interaction
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="audience-interactions-container">
      <div className="interaction-selector">
        <label className="interaction-label">Select Audience Interaction:</label>
        <select
          value={selectedInteraction}
          onChange={(e) => handleInteractionChange(e.target.value)}
          className="interaction-select"
        >
          <option value="">Choose an interaction...</option>
          {audienceInteractions.map((interaction) => (
            <option key={interaction.id} value={interaction.id}>
              {interaction.description}
            </option>
          ))}
        </select>

        {selectedInteractionData && (
          <div className="selected-interaction-info">
            <div className="interaction-header">
              {renderIcon(selectedInteractionData)}
              <span className="interaction-name">{selectedInteractionData.description}</span>
            </div>
          </div>
        )}
      </div>

      {renderContent()}

      {/* Modal Components */}
      <TextModal
        isVisible={textModalVisible}
        text={getPreviewText()}
        timeout={3000}
        fontSize="xlarge"
        onClose={() => setTextModalVisible(false)}
      />

      <ImageModal
        isVisible={imageModalVisible}
        imageSrc={getMappedImageSrc()}
        alt={selectedInteractionData?.description || 'Interaction Image'}
        closeOnShortcut={selectedInteractionData?.shortcuts?.[0]}
        onClose={() => setImageModalVisible(false)}
      />

      <AnimatedModal
        isVisible={animatedModalVisible}
        imageSrc={getMappedImageSrc()}
        audioSrc={getMappedAudioSrc()}
        alt={selectedInteractionData?.description || 'Animated Interaction'}
        timeout={6000}
        autoPlay={(() => {
          if (!selectedInteractionData?.content?.audio) return false;
          const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
          const audioKey = `${selectedInteractionData.id}_enableAudio`;
          const individualAudioEnabled = currentSettings[audioKey] !== undefined ? currentSettings[audioKey] : true;
          const globalSoundEffects = currentSettings.soundEffects !== undefined ? currentSettings.soundEffects : true;
          return individualAudioEnabled && globalSoundEffects;
        })()}
        onClose={() => setAnimatedModalVisible(false)}
      />
    </div>
  );
};

// Special Numbers Grid Component
interface SpecialNumbersGridProps {
  property: SettingProperty;
  onChange: (value: any) => void;
}

const SpecialNumbersGrid: React.FC<SpecialNumbersGridProps> = ({ property, onChange }) => {
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
      const preBuiltMessage = (require('../data/specialNumbers.json') as { [key: string]: string })[selectedNumber.toString()] || '';
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

  return (
    <div className="special-numbers-grid-container">
      <div className="bingo-grid-horizontal">
        {rowHeaders.map((header, rowIndex) => (
          <div key={header} className="bingo-row">
            <div className="row-header">{header}</div>
            <div className="row-numbers">
              {numberGrid[rowIndex].map(number => {
                const messageState = getNumberMessageState(number);
                const hasMessage = specialNumbers[number.toString()];
                const isSelected = selectedNumber === number;

                return (
                  <button
                    key={number}
                    className={`number-cell ${messageState} ${hasMessage ? 'has-message' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleNumberClick(number)}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="number-message-editor">
        <textarea
          value={textareaValue}
          onChange={(e) => handleTextareaChange(e.target.value)}
          placeholder={selectedNumber ? getPlaceholderText(selectedNumber) : 'Select a number above to edit its message'}
          className="message-textarea"
          disabled={selectedNumber === null}
        />

        {selectedNumber && (
          <div className="message-actions">
            <div className="selected-number-info">
              <span className="selected-number">Number {selectedNumber}</span>
              {(() => {
                const messageState = getNumberMessageState(selectedNumber);
                switch (messageState) {
                  case 'pre-built':
                    return <span className="message-badge pre-built">Pre-built</span>;
                  case 'custom':
                    return <span className="message-badge custom">Custom</span>;
                  case 'overridden':
                    return <span className="message-badge overridden">Overridden</span>;
                  case 'cleared':
                    return <span className="message-badge cleared">Cleared</span>;
                  default:
                    return <span className="message-badge none">No message</span>;
                }
              })()}
            </div>
            <div className="message-action-buttons">
              <button
                className="clear-message-btn"
                onClick={handleClearMessage}
                disabled={getNumberMessageState(selectedNumber) === 'none'}
              >
                Clear Message
              </button>
              {(getNumberMessageState(selectedNumber) === 'overridden' || getNumberMessageState(selectedNumber) === 'cleared') && (
                <button
                  className="revert-message-btn"
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
  const [currentSettings, setCurrentSettings] = useState<{ [key: string]: any }>({});
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        // Removed notifications - settings save silently in background
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

  const renderSettingInput = (property: SettingProperty, sectionIndex: number) => {
    const onChange = (value: any) => updateSetting(sectionIndex, property.id, value);

    switch (property.type) {
      case 'boolean':
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={property.value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="checkmark"></span>
          </label>
        );
      case 'number':
        return (
          <input
            type="number"
            value={property.value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="number-input"
          />
        );
      case 'colorpicker':
        return (
          <input
            type="color"
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className="color-input"
          />
        );
      case 'select':
        const selectOptions = resolveOptions(property.options, property);
        return (
          <select
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className="select-input"
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
            className="text-input"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={property.value}
            onChange={(e) => onChange(e.target.value)}
            className="textarea-input"
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
            className="password-input"
            placeholder="Enter password..."
          />
        );
      case 'combo+textarea':
        const comboOptions = resolveOptions(property.options, property);
        return (
          <div className="combo-textarea-container">
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
              className="combo-select"
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
              className="combo-textarea"
              placeholder="Enter details..."
            />
          </div>
        );
    }
  };

  // Static Debug Section Component
  interface DebugSectionProps {
    collapsed: boolean;
    onToggle: () => void;
    currentSettings: { [key: string]: any };
  }

  const DebugSection: React.FC<DebugSectionProps> = ({ collapsed, onToggle, currentSettings }) => {
    const debugInfo = formatDebugSettings(currentSettings);

    return (
      <div className="settings-section debug-section">
        <div className="section-header" onClick={onToggle}>
          <h2>Debug</h2>
          <span className={`collapse-arrow ${collapsed ? 'collapsed' : ''}`}>
            ▼
          </span>
        </div>

        {!collapsed && (
          <div className="section-content">
            <div className="section-content-wrapper">
              <div className="setting-item">
                <div className="setting-info">
                  <label className="setting-label">Current Settings JSON</label>
                  <p className="setting-description">
                    Developer information showing all current settings in JSON format. This area is read-only and automatically updates when settings change.
                  </p>
                </div>
                <div className="setting-control">
                  <textarea
                    value={debugInfo}
                    readOnly
                    className="textarea-input"
                    style={{
                      backgroundColor: '#f8f9fa',
                      cursor: 'default'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="settings-page">
      <HamburgerMenu
        currentPage="settings"
        onReset={handleReset}
      />

      {/* Floating Action Buttons */}
      <div className="floating-actions">
        <button
          className="floating-action-btn reset-btn"
          onClick={handleReset}
          title="Reset to Defaults"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10"/>
            <path d="M3.51,15a9,9,0,0,0,14.85,3.36L23,14"/>
          </svg>
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-main-header">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Configure your bingo game preferences • <span className="auto-save-indicator">Auto-save enabled ✓</span></p>
          </div>

          <div className="special-numbers-header desktop-only">
            <h1>Special Numbers</h1>
            <p>Customize messages shown for certain numbers when activated • <span className="auto-save-indicator">Auto-save enabled ✓</span></p>
          </div>
        </div>

        <div className="settings-layout">
          <div className="settings-sections">
            {settingsSections.map((section, sectionIndex) => (
              <div key={section.title} className="settings-section">
                <div
                  className="section-header"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  <h2>{section.title}</h2>
                  <span className={`collapse-arrow ${section.collapsed ? 'collapsed' : ''}`}>
                    ▼
                  </span>
                </div>

                {!section.collapsed && (
                  <div className="section-content">
                    <div className="section-content-wrapper">
                      {section.properties.map((property) => (
                        <div key={property.id} className="setting-item">
                          <div className="setting-info">
                            <label className="setting-label">{property.Label}</label>
                            <p className="setting-description">{property.description}</p>
                          </div>
                          <div className="setting-control">
                            {renderSettingInput(property, sectionIndex)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Static Debug Section */}
            <DebugSection
              collapsed={debugCollapsed}
              onToggle={() => setDebugCollapsed(!debugCollapsed)}
              currentSettings={currentSettings}
            />
          </div>

          <div className="special-numbers-section">
            <div className="special-numbers-header mobile-only">
              <h1>Special Numbers</h1>
              <p>Customize messages shown for certain numbers when activated • <span className="auto-save-indicator">Auto-save enabled ✓</span></p>
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
            />

            {/* Audience Interactions Section */}
            <div className="audience-interactions-section">
              <div className="section-header-static">
                <h2>Audience Interactions</h2>
                <p>Configure audience interaction messages and auto-triggers • <span className="auto-save-indicator">Auto-save enabled ✓</span></p>
              </div>

              <div className="section-content-static">
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
    </div>
  );
};

export default SettingsPage;
