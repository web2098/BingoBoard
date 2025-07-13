import React, { useEffect } from 'react';
import { generateWelcomeMessage } from '../../utils/settings';
import styles from './WelcomeModal.module.css';

export interface WelcomeModalProps {
  isVisible: boolean;
  onClose: () => void;
  timeout?: number; // in milliseconds, default 5000ms
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isVisible,
  onClose,
  timeout = 5000
}) => {
  const welcomeText = generateWelcomeMessage();

  useEffect(() => {
    if (isVisible && timeout > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isVisible, timeout, onClose]);

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={styles.welcomeModalOverlay} onClick={onClose}>
      <div
        className={styles.welcomeModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.welcomeModalCard}>
          <h3 className={styles.welcomeModalTitle}>Welcome</h3>
          <pre className={styles.welcomeModalTemplate}>{welcomeText}</pre>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
