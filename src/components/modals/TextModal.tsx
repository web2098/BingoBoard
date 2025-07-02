import React, { useEffect } from 'react';
import './TextModal.css';

export interface TextModalProps {
  isVisible: boolean;
  text: string;
  timeout?: number; // in milliseconds, default 3000ms
  onClose: () => void;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  textColor?: string;
}

const TextModal: React.FC<TextModalProps> = ({
  isVisible,
  text,
  timeout = 3000,
  onClose,
  fontSize = 'large',
  textColor = '#ffffff'
}) => {
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

  if (!isVisible) return null;

  return (
    <div className="text-modal-overlay" onClick={onClose}>
      <div
        className={`text-modal-content ${fontSize}`}
        style={{ color: textColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {text}
      </div>
    </div>
  );
};

export default TextModal;
