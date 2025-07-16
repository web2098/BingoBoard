import React from 'react';
import styles from './FreeSpaceToggle.module.css';

interface FreeSpaceToggleProps {
  freeSpace: boolean;
  onChange: (value: boolean) => void;
  variant?: any;
  className?: string;
}

// Free Space Toggle Component for board preview
const FreeSpaceToggle: React.FC<FreeSpaceToggleProps> = ({
  freeSpace,
  onChange,
  variant,
  className = ''
}) => {
  // Toggle should only be shown if dynamicFreeSpace is available
  const hasDynamicFreeSpace = variant && variant.hasOwnProperty('dynamicFreeSpace') && variant.dynamicFreeSpace;

  if (!hasDynamicFreeSpace) {
    return null;
  }

  return (
    <div className={`${styles.freeSpaceToggleMini} ${className}`} onClick={(e) => e.stopPropagation()}>
      <span className={styles.toggleLabel}>Free Space:</span>
      <label className={styles.toggleSwitch}>
        <input
          type="checkbox"
          checked={freeSpace}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.slider}></span>
      </label>
      <span className={styles.toggleState}>{freeSpace ? 'ON' : 'OFF'}</span>
    </div>
  );
};

export default FreeSpaceToggle;
