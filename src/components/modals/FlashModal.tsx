import React, { useEffect, useState, useRef } from 'react';
import './FlashModal.css';

export interface FlashModalProps {
  isVisible: boolean;
  text: string;
  timeout?: number; // in milliseconds, default from settings
  onClose: () => void;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  backgroundColor?: string; // rectangle background color
  borderColor?: string; // rectangle border color
  animationColors?: [string, string]; // two colors for flashing border
}

const FlashModal: React.FC<FlashModalProps> = ({
  isVisible,
  text,
  timeout = 5000,
  onClose,
  fontSize = 'large',
  backgroundColor = '#F5F0B9',
  borderColor = '#307743',
  animationColors = ['#F5CE17', '#FFFF00']
}) => {
  const [countdown, setCountdown] = useState(0);
  const modalStartTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && timeout > 0 && modalStartTimeRef.current === 0) {
      // First time opening the modal
      modalStartTimeRef.current = Date.now();
      setCountdown(Math.ceil(timeout / 1000));

      // Update countdown every second
      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
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

      // Close modal after timeout - clicking should NOT disable this
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, timeout);

    } else if (!isVisible && modalStartTimeRef.current !== 0) {
      // Only clear timers when modal actually closes
      modalStartTimeRef.current = 0;
      setCountdown(0);

      // Clear any existing timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isVisible, timeout, onClose]);

  // Cleanup only on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
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
    <div className="flash-modal-overlay">
      {timeout > 0 && countdown > 0 && (
        <div
          className="flash-countdown"
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

      <div
        className={`flash-message-content ${fontSize}`}
        style={{
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          '--flash-color-1': animationColors[0],
          '--flash-color-2': animationColors[1],
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()} // Clicking should NOT close the modal
      >
        {text}
      </div>
    </div>
  );
};

export default FlashModal;
