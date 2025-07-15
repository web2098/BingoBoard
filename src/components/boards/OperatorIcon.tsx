import React from 'react';
import styles from './OperatorIcon.module.css';

interface OperatorIconProps {
  operator: string;
  className?: string;
}

// Operator Icon Component for dual board games
const OperatorIcon: React.FC<OperatorIconProps> = ({ operator, className = '' }) => {
  const getOperatorSymbol = () => {
    switch (operator.toUpperCase()) {
      case 'AND': return 'AND';
      case 'OR': return 'OR';
      case 'TRANSITION': return 'INTO';
      default: return operator;
    }
  };

  return (
    <div className={`${styles.operatorIcon} ${className}`}>
      {getOperatorSymbol()}
    </div>
  );
};

export default OperatorIcon;
