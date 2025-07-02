import React, { useEffect, useRef, useState } from 'react';
import './AnimatedModal.css';

export interface AnimatedModalProps {
  isVisible: boolean;
  imageSrc: string;
  audioSrc?: string;
  alt?: string;
  timeout?: number; // fallback timeout in milliseconds
  onClose: () => void;
  autoPlay?: boolean; // whether audio should auto-play
}

const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isVisible,
  imageSrc,
  audioSrc,
  alt = 'Animated Modal',
  timeout = 5000, // Default 5 second fallback
  onClose,
  autoPlay = true
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Check if we have audio
      if (audioSrc && audioRef.current) {
        setHasAudio(true);

        if (autoPlay) {
          // Play audio
          audioRef.current.play().catch(error => {
            console.warn('Audio autoplay failed:', error);
            // If audio fails, fall back to timeout
            setHasAudio(false);
          });
        }
      } else {
        setHasAudio(false);
      }

      // Set fallback timeout (always set, but may be cleared by audio end)
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, timeout);

    } else {
      document.body.style.overflow = 'unset';
      setHasAudio(false);

      // Stop audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible, audioSrc, autoPlay, timeout, onClose]);

  const handleAudioEnd = () => {
    // Close modal when audio ends (if we have audio)
    if (hasAudio) {
      onClose();
    }
  };

  const handleAudioError = () => {
    console.warn('Audio failed to load');
    setHasAudio(false);
    // Continue with timeout-based closing
  };

  if (!isVisible) return null;

  return (
    <div className="animated-modal-overlay">
      <div className="animated-modal-content">
        <img
          src={imageSrc}
          alt={alt}
          className="animated-modal-img"
        />

        {audioSrc && (
          <audio
            ref={audioRef}
            onEnded={handleAudioEnd}
            onError={handleAudioError}
            preload="auto"
          >
            <source src={audioSrc} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}

        <div className="animated-modal-progress">
          <div
            className="animated-modal-progress-bar"
            style={{
              animationDuration: `${timeout}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedModal;
