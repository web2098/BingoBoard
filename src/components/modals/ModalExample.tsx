import React, { useState } from 'react';
import { FlashModal, PopupModal, AnimatedModal } from './index';

// Import the assets we moved to src/assets
import battleImg from '../../assets/images/audience-interactions/battle.jpg';
import order66Gif from '../../assets/images/audience-interactions/order66.gif';
import order66Audio from '../../assets/audio/audience-interactions/order66.mp3';

const ModalExample: React.FC = () => {
  const [flashModalVisible, setFlashModalVisible] = useState(false);
  const [popupModalVisible, setPopupModalVisible] = useState(false);
  const [animatedModalVisible, setAnimatedModalVisible] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Modal Components Demo</h2>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setFlashModalVisible(true)}>
          Show Flash Modal
        </button>

        <button onClick={() => setPopupModalVisible(true)}>
          Show Popup Modal
        </button>

        <button onClick={() => setAnimatedModalVisible(true)}>
          Show Animated Modal
        </button>
      </div>

      {/* Flash Modal Example */}
      <FlashModal
        isVisible={flashModalVisible}
        text="APPLAUSE!"
        timeout={3000}
        onClose={() => setFlashModalVisible(false)}
        fontSize="xlarge"
      />

      {/* Popup Modal Example */}
      <PopupModal
        isVisible={popupModalVisible}
        content={{
          img: battleImg,
          text: "Battle to the Death!"
        }}
        alt="Battle to the Death"
        onClose={() => setPopupModalVisible(false)}
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
