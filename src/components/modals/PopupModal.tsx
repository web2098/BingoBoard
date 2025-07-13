import React, { useEffect, useCallback } from 'react';
import './PopupModal.css';

export interface PopupModalProps {
  isVisible: boolean;
  content: {
    text?: string;
    img?: string;
  };
  alt?: string;
  onClose: () => void;
  closeOnShortcut?: string; // keyboard shortcut to close (e.g., 'x', 'Escape')
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
}

const PopupModal: React.FC<PopupModalProps> = ({
  isVisible,
  content,
  alt = 'Popup Modal',
  onClose,
  closeOnShortcut,
  fontSize = 'large'
}) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (closeOnShortcut && event.key.toLowerCase() === closeOnShortcut.toLowerCase()) {
      onClose();
    }
    // Always close on Escape key
    if (event.key === 'Escape') {
      onClose();
    }
  }, [closeOnShortcut, onClose]);

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyPress);
    } else {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isVisible, handleKeyPress]);

  if (!isVisible) return null;

  const hasImage = content.img;
  console.log(`PopupModal rendering with content:`, content);
  const hasText = content.text;

  return (
    <div className="popup-modal-overlay" onClick={onClose}>
      <div className="popup-modal-content" onClick={(e) => e.stopPropagation()}>
        {hasImage ? (
          // Image popup - should fill entire page
          <>
            <img
              src={content.img}
              alt={alt}
              className="popup-modal-img"
              onClick={onClose}
            />
            <div className="popup-modal-close-hint">
              Click image{closeOnShortcut ? ` or press "${closeOnShortcut.toUpperCase()}"` : ''} to close
            </div>
          </>
        ) : (
          // Text popup
          <div
            className={`popup-modal-text ${fontSize}`}
            onClick={onClose}
          >
            {hasText && content.text}
            <div className="popup-modal-close-hint">
              Click text{closeOnShortcut ? ` or press "${closeOnShortcut.toUpperCase()}"` : ''} to close
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupModal;
