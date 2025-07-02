import React, { useEffect, useCallback } from 'react';
import './ImageModal.css';

export interface ImageModalProps {
  isVisible: boolean;
  imageSrc: string;
  alt?: string;
  onClose: () => void;
  closeOnShortcut?: string; // keyboard shortcut to close (e.g., 'x', 'Escape')
}

const ImageModal: React.FC<ImageModalProps> = ({
  isVisible,
  imageSrc,
  alt = 'Modal Image',
  onClose,
  closeOnShortcut
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

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageSrc}
          alt={alt}
          className="image-modal-img"
          onClick={onClose}
        />
        <div className="image-modal-close-hint">
          Click image{closeOnShortcut ? ` or press "${closeOnShortcut.toUpperCase()}"` : ''} to close
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
