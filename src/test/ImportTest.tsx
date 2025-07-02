import React from 'react';
// Test import - this should work now
import { TextModal, ImageModal, AnimatedModal } from '../components/modals';

// This is a test component to verify imports work
const ImportTest: React.FC = () => {
  return (
    <div>
      <p>Import test successful!</p>
      {/* The following proves the components are imported correctly */}
      <TextModal isVisible={false} text="Test" onClose={() => {}} />
      <ImageModal isVisible={false} imageSrc="" onClose={() => {}} />
      <AnimatedModal isVisible={false} imageSrc="" onClose={() => {}} />
    </div>
  );
};

export default ImportTest;
