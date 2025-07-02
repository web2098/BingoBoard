import React, { useState } from 'react';
import { TextModal, ImageModal, AnimatedModal } from './index';

// Import the assets we moved to src/assets
import battleImg from '../../assets/images/audience-interactions/battle.jpg';
import order66Gif from '../../assets/images/audience-interactions/order66.gif';
import order66Audio from '../../assets/audio/audience-interactions/order66.mp3';

const ModalExample: React.FC = () => {
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [animatedModalVisible, setAnimatedModalVisible] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Modal Components Demo</h2>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setTextModalVisible(true)}>
          Show Text Modal
        </button>

        <button onClick={() => setImageModalVisible(true)}>
          Show Image Modal
        </button>

        <button onClick={() => setAnimatedModalVisible(true)}>
          Show Animated Modal
        </button>
      </div>

      {/* Text Modal Example */}
      <TextModal
        isVisible={textModalVisible}
        text="APPLAUSE!"
        timeout={3000}
        onClose={() => setTextModalVisible(false)}
        fontSize="xlarge"
        textColor="#ffffff"
      />

      {/* Image Modal Example */}
      <ImageModal
        isVisible={imageModalVisible}
        imageSrc={battleImg}
        alt="Battle to the Death"
        onClose={() => setImageModalVisible(false)}
        closeOnShortcut="x"
      />

      {/* Animated Modal Example */}
      <AnimatedModal
        isVisible={animatedModalVisible}
        imageSrc={order66Gif}
        audioSrc={order66Audio}
        alt="Execute Order 66"
        timeout={6000}
        onClose={() => setAnimatedModalVisible(false)}
        autoPlay={true}
      />
    </div>
  );
};

export default ModalExample;
