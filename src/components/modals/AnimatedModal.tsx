import React, { useEffect, useRef, useState } from 'react';
import styles from './AnimatedModal.module.css';

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
  timeout = 8500, // Default 3.5 second fallback as per requirements
  onClose,
  autoPlay = true
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modalStartTimeRef = useRef<number>(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [effectiveTimeout, setEffectiveTimeout] = useState(timeout);

  useEffect(() => {
    if (isVisible) {
      // Only set start time if it's not already set (first time modal opens)
      if (modalStartTimeRef.current === 0) {
        modalStartTimeRef.current = Date.now();
      }

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Add escape key listener
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

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

      // Only show countdown if no audio (fallback timeout mode)
      if (!audioSrc && effectiveTimeout > 0 && modalStartTimeRef.current === Date.now()) {
        setCountdown(Math.ceil(effectiveTimeout / 1000));

        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Set fallback timeout (will be updated when audio metadata loads)
      if (!audioSrc) {
        // For non-audio modals, use timeout immediately
        timeoutRef.current = setTimeout(() => {
          onClose();
        }, effectiveTimeout);
      }
      // For audio modals, timeout will be set in handleAudioLoadedMetadata

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };

    } else if (!isVisible && modalStartTimeRef.current !== 0) {
      // Only clear timers when modal actually closes (not on re-renders)
      document.body.style.overflow = 'unset';
      setHasAudio(false);
      setCountdown(0);

      // Reset start time when modal closes
      modalStartTimeRef.current = 0;

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

      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    // Only cleanup on unmount, not on re-renders
  }, [isVisible, audioSrc, autoPlay, timeout, effectiveTimeout, onClose]);

  // Cleanup only on component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount only
      document.body.style.overflow = 'unset';
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

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

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDurationMs = audioRef.current.duration * 1000;
      const newEffectiveTimeout = Math.max(timeout, audioDurationMs);
      setEffectiveTimeout(newEffectiveTimeout);

      // Clear existing timeout and set new one with the effective duration
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, newEffectiveTimeout);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.animatedModalOverlay}>
      <div className={styles.animatedModalContent}>
        {!hasAudio && countdown > 0 && (
          <div
            className={styles.modalCountdown}
            style={{
              '--countdown-duration': `${effectiveTimeout}ms`
            } as React.CSSProperties}
            key={`countdown-${modalStartTimeRef.current}`}
          >
            <svg className={styles.countdownCircle} viewBox="0 0 70 70">
              <circle
                className={styles.countdownCircleBg}
                cx="35"
                cy="35"
                r="32"
              />
              <circle
                className={styles.countdownCircleProgress}
                cx="35"
                cy="35"
                r="32"
                key={`progress-${modalStartTimeRef.current}`}
              />
            </svg>
            <div className={styles.countdownNumber}>
              {countdown}
            </div>
          </div>
        )}
        <img
          src={imageSrc}
          alt={alt}
          className={styles.animatedModalImg}
        />

        {audioSrc && (
          <audio
            ref={audioRef}
            onEnded={handleAudioEnd}
            onError={handleAudioError}
            onLoadedMetadata={handleAudioLoadedMetadata}
            preload="metadata"
          >
            <source src={audioSrc} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}

        <div className={styles.animatedModalProgress}>
          <div
            className={styles.animatedModalProgressBar}
            style={{
              animationDuration: `${effectiveTimeout}ms`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedModal;
