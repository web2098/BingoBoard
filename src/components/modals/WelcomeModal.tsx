import React, { useEffect } from 'react';
import { generateWelcomeMessage } from '../../utils/settings';
import './WelcomeModal.css';

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
    <div className="welcome-modal-overlay" onClick={onClose}>
      <div
        className="welcome-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="welcome-modal-card">
          <h3 className="welcome-modal-title">Welcome</h3>
          <pre className="welcome-modal-template">{welcomeText}</pre>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
