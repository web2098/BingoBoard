import React, { useState, useEffect } from 'react';
import styles from './ClientSettings.module.css';
import clientSettingsData from '../data/clientSettings.json';

interface ClientSetting {
  section: string;
  Label: string;
  id: string;
  description: string;
  type: string;
  default: any;
  options?: string[];
}

interface ClientSettingsProps {
  className?: string;
}

const ClientSettings: React.FC<ClientSettingsProps> = ({ className }) => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [collapsed, setCollapsed] = useState(true);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadedSettings: Record<string, any> = {};

    clientSettingsData.forEach((setting: ClientSetting) => {
      const savedValue = localStorage.getItem(setting.id);
      if (savedValue !== null) {
        try {
          loadedSettings[setting.id] = JSON.parse(savedValue);
        } catch {
          loadedSettings[setting.id] = savedValue;
        }
      } else {
        loadedSettings[setting.id] = setting.default;
      }
    });

    setSettings(loadedSettings);
  }, []);

  // Save setting to localStorage
  const updateSetting = (settingId: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [settingId]: value
    }));

    localStorage.setItem(settingId, JSON.stringify(value));

    // Dispatch a custom event to notify other components of setting changes
    const event = new CustomEvent('clientSettingChanged', {
      detail: { settingId, value }
    });
    window.dispatchEvent(event);
  };

  // Group settings by section
  const groupedSettings = clientSettingsData.reduce((acc, setting) => {
    if (!acc[setting.section]) {
      acc[setting.section] = [];
    }
    acc[setting.section].push(setting);
    return acc;
  }, {} as Record<string, ClientSetting[]>);

  // Render input based on setting type
  const renderSettingInput = (setting: ClientSetting) => {
    const value = settings[setting.id] ?? setting.default;

    switch (setting.type) {
      case 'boolean':
        return (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateSetting(setting.id, e.target.checked)}
            />
            <span className={styles.checkmark}></span>
          </label>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateSetting(setting.id, Number(e.target.value))}
            className={styles.numberInput}
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateSetting(setting.id, e.target.value)}
            className={styles.selectInput}
          >
            {setting.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateSetting(setting.id, e.target.value)}
            className={styles.textInput}
          />
        );
    }
  };

  return (
    <div className={`${styles.clientSettings} ${className || ''}`}>
      <div className={styles.settingsSection}>
        <div
          className={styles.sectionHeader}
          onClick={() => setCollapsed(!collapsed)}
        >
          <h3>Client Settings</h3>
          <span className={`${styles.collapseArrow} ${collapsed ? styles.collapsed : ''}`}>
            ▼
          </span>
        </div>

        {!collapsed && (
          <div className={styles.sectionContent}>
            <div className={styles.sectionContentWrapper}>
              {Object.entries(groupedSettings).map(([sectionName, sectionSettings]) => (
                <div key={sectionName} className={styles.settingSubsection}>
                  {Object.keys(groupedSettings).length > 1 && (
                    <h4 className={styles.subsectionTitle}>{sectionName}</h4>
                  )}
                  {sectionSettings.map((setting) => (
                    <div key={setting.id} className={styles.settingItem}>
                      <div className={styles.settingInfo}>
                        <label className={styles.settingLabel}>{setting.Label}</label>
                        <p className={styles.settingDescription}>{setting.description}</p>
                      </div>
                      <div className={styles.settingControl}>
                        {renderSettingInput(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSettings;
