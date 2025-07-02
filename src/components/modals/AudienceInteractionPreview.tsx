import React, { useState } from 'react';
import { TextModal, ImageModal, AnimatedModal } from './index';

// Import the assets
import battleImg from '../../assets/images/audience-interactions/battle.jpg';
import order66Gif from '../../assets/images/audience-interactions/order66.gif';
import order66Audio from '../../assets/audio/audience-interactions/order66.mp3';

interface AudienceInteractionPreviewProps {
  interaction: any;
  customText?: string;
}

const AudienceInteractionPreview: React.FC<AudienceInteractionPreviewProps> = ({
  interaction,
  customText
}) => {
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [animatedModalVisible, setAnimatedModalVisible] = useState(false);

  const assetMap: { [key: string]: string } = {
    '/images/audience-interactions/battle.jpg': battleImg,
    '/images/audience-interactions/order66.gif': order66Gif,
    '/audio/audience-interactions/order66.mp3': order66Audio,
  };

  const handlePreview = () => {
    const hasText = interaction.content?.text || customText;
    const hasImage = interaction.content?.img;
    const hasAudio = interaction.content?.audio;

    if (hasText && !hasImage) {
      // Text-only modal
      setTextModalVisible(true);
    } else if (hasImage && !hasAudio) {
      // Image-only modal
      setImageModalVisible(true);
    } else if (hasImage && hasAudio) {
      // Animated modal with audio
      setAnimatedModalVisible(true);
    }
  };

  const getPreviewText = () => {
    if (customText) return customText;
    if (interaction.content?.text) return interaction.content.text;
    return 'Preview';
  };

  const getMappedImageSrc = () => {
    return assetMap[interaction.content?.img] || interaction.content?.img || '';
  };

  const getMappedAudioSrc = () => {
    return assetMap[interaction.content?.audio] || interaction.content?.audio || '';
  };

  return (
    <>
      <button
        onClick={handlePreview}
        className="preview-btn"
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          marginTop: '8px'
        }}
      >
        Preview
      </button>

      {/* Text Modal */}
      <TextModal
        isVisible={textModalVisible}
        text={getPreviewText()}
        timeout={3000}
        fontSize="xlarge"
        onClose={() => setTextModalVisible(false)}
      />

      {/* Image Modal */}
      <ImageModal
        isVisible={imageModalVisible}
        imageSrc={getMappedImageSrc()}
        alt={interaction.description}
        closeOnShortcut={interaction.shortcuts?.[0]}
        onClose={() => setImageModalVisible(false)}
      />

      {/* Animated Modal */}
      <AnimatedModal
        isVisible={animatedModalVisible}
        imageSrc={getMappedImageSrc()}
        audioSrc={getMappedAudioSrc()}
        alt={interaction.description}
        timeout={6000}
        onClose={() => setAnimatedModalVisible(false)}
      />
    </>
  );
};

export default AudienceInteractionPreview;
