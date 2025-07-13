import React, { useEffect, useState, useRef } from 'react';
import './TextModal.css';

export interface TextModalProps {
  isVisible: boolean;
  text: string;
  timeout?: number; // in milliseconds, default 3000ms
  onClose: () => void;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  textColor?: string;
  isFlashMessage?: boolean; // true for flash message with special styling
  flashBackgroundColor?: string; // background color for flash message rectangle
  flashBorderColor?: string; // border color for flash message rectangle
  flashAnimationColors?: [string, string]; // two colors for flashing border animation
}

const TextModal: React.FC<TextModalProps> = ({
  isVisible,
  text,
  timeout = 3000,
  onClose,
  fontSize = 'large',
  textColor = '#ffffff',
  isFlashMessage = false,
  flashBackgroundColor = '#F5F0B9',
  flashBorderColor = '#307743',
  flashAnimationColors = ['#F5CE17', '#FFFF00']
}) => {
  const [countdown, setCountdown] = useState(0);
  const modalStartTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log(`Text Modal update(out): ${isVisible} ${timeout} ${modalStartTimeRef.current}`);
    if (isVisible && timeout > 0 && modalStartTimeRef.current === 0) {
      console.log(`Text Modal update: ${isVisible} ${timeout} ${modalStartTimeRef.current}`);
      // First time opening the modal
      modalStartTimeRef.current = Date.now();
      setCountdown(Math.ceil(timeout / 1000));

      // Update countdown every second
      intervalRef.current = setInterval(() => {
        console.log(`Text Modal countdown: ${countdown}`);
        setCountdown(prev => {
          console.log(`Text Modal setCountdown: ${prev}`);
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Close modal after timeout
      timeoutRef.current = setTimeout(() => {
        console.log(`Text Modal onClose`);
        onClose();
      }, timeout);

    } else if (!isVisible && modalStartTimeRef.current !== 0) {
      // Only clear timers when modal actually closes (not on re-renders)
      console.log(`Text Modal actually closing - clearing timers`);
      modalStartTimeRef.current = 0;
      setCountdown(0);

      // Clear any existing timers
      if (timeoutRef.current) {
        console.log(`Text Modal Not Visible - clearing timeout`);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        console.log(`Text Modal Not Visible - clearing interval`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Only cleanup on unmount, not on re-renders
  }, [isVisible, timeout, onClose]);

  // Cleanup only on component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount only
      if (timeoutRef.current) {
        console.log(`Text Modal unmounting - clearing timeout`);
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        console.log(`Text Modal unmounting - clearing interval`);
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
    <div className="text-modal-overlay">
      <div
        className={`text-modal-content ${fontSize} ${isFlashMessage ? 'flash-message' : ''}`}
        style={{
          color: textColor,
          backgroundColor: isFlashMessage ? flashBackgroundColor : 'transparent',
          border: isFlashMessage ? `3px solid ${flashBorderColor}` : 'none',
          borderRadius: isFlashMessage ? '8px' : '0',
          '--flash-color-1': flashAnimationColors[0],
          '--flash-color-2': flashAnimationColors[1],
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {timeout > 0 && countdown > 0 && (
          <div
            className="modal-countdown"
            style={{
              '--countdown-duration': `${timeout}ms`
            } as React.CSSProperties}
            key={`countdown-${modalStartTimeRef.current}`}
          >
            <svg className="countdown-circle" viewBox="0 0 70 70">
              <circle
                className="countdown-circle-bg"
                cx="35"
                cy="35"
                r="32"
              />
              <circle
                className="countdown-circle-progress"
                cx="35"
                cy="35"
                r="32"
                key={`progress-${modalStartTimeRef.current}`}
              />
            </svg>
            <div className="countdown-number">
              {countdown}
            </div>
          </div>
        )}
        {text}
      </div>
    </div>
  );
};

export default TextModal;
