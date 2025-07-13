import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const circleAnimationRef = useRef<NodeJS.Timeout | null>(null);

  // Function to calculate circle center positions around a rectangle
  const calculateCirclePositions = (rectWidth: number, rectHeight: number, radius: number, spacing: number) => {
    const positions: { x: number; y: number }[] = [];

    // Calculate how many circles fit on each side
    const topBottomLength = rectWidth;
    const leftRightLength = rectHeight;

    const numTop = Math.floor(topBottomLength / spacing);
    const numSide = Math.floor(leftRightLength / spacing);

    // Calculate actual spacing to distribute evenly
    const actualHorizontalSpacing = numTop > 1 ? topBottomLength / (numTop - 1) : 0;
    const actualVerticalSpacing = numSide > 1 ? leftRightLength / (numSide - 1) : 0;

    // Top edge (left to right)
    for (let i = 0; i < numTop; i++) {
      const x = i * actualHorizontalSpacing;
      positions.push({ x, y: 0 });
    }

    // Right edge (top to bottom, skip corner)
    for (let i = 1; i < numSide; i++) {
      const y = i * actualVerticalSpacing;
      positions.push({ x: rectWidth, y });
    }

    // Bottom edge (right to left, skip corner)
    for (let i = numTop - 2; i >= 0; i--) {
      const x = i * actualHorizontalSpacing;
      positions.push({ x, y: rectHeight });
    }

    // Left edge (bottom to top, skip corners)
    for (let i = numSide - 2; i > 0; i--) {
      const y = i * actualVerticalSpacing;
      positions.push({ x: 0, y });
    }

    return positions;
  };

  // Function to create and position circles around the border
  const updateCircles = useCallback(() => {
    if (!contentRef.current || !isVisible) return;

    const container = contentRef.current;

    // Remove any existing circles
    const existingCircles = container.querySelectorAll('.flash-circle');
    existingCircles.forEach(circle => circle.remove());

    const rect = container.getBoundingClientRect();
    const styles = window.getComputedStyle(container);

    // Get border sizes - should be 50px from CSS
    const borderWidth = parseFloat(styles.borderWidth) || 50;

    const rectWidth = rect.width - borderWidth;
    const rectHeight = rect.height - borderWidth;
    const circleRadius = borderWidth * 0.3; // Radius of circles
    const circleSpacing = circleRadius * 2; // Space between circle centers

    function createCircle(x: number, y: number, colorIndex: number) {
      const circle = document.createElement('div');
      circle.className = 'flash-circle';
      circle.style.position = 'absolute';
      // Position relative to the border area
      circle.style.left = `${x - borderWidth/2 - circleRadius}px`;
      circle.style.top = `${y - borderWidth/2 - circleRadius}px`;
      circle.style.width = `${circleRadius * 2}px`;
      circle.style.height = `${circleRadius * 2}px`;
      circle.style.borderRadius = '50%';
      // Set CSS custom properties for animation colors
      circle.style.setProperty('--flash-color-1', animationColors[0]);
      circle.style.setProperty('--flash-color-2', animationColors[1]);
      circle.style.zIndex = '1';
      circle.style.pointerEvents = 'none';
      container.appendChild(circle);
      return circle;
    }

    const circles: HTMLElement[] = [];

    // Get all circle positions
    const positions = calculateCirclePositions(rectWidth, rectHeight, circleRadius, circleSpacing);

    // Create circles at calculated positions
    positions.forEach(pos => {
      circles.push(createCircle(pos.x, pos.y, 0));
    });

    // Note: Animation is now handled by CSS @keyframes flash-blink
  }, [isVisible, animationColors]);

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(updateCircles, 100);

      // Add window resize listener to update circles when window size changes
      const handleResize = () => {
        if (isVisible) {
          updateCircles();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // Clean up circles when modal closes
      if (contentRef.current) {
        const existingCircles = contentRef.current.querySelectorAll('.flash-circle');
        existingCircles.forEach(circle => circle.remove());
      }
      if (circleAnimationRef.current) {
        clearInterval(circleAnimationRef.current);
        circleAnimationRef.current = null;
      }
    }
  }, [isVisible, updateCircles]);

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
      if (circleAnimationRef.current) {
        clearInterval(circleAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      // Add escape key listener
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, onClose]);

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
        ref={contentRef}
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
