import React, { useState } from 'react';
import { TextModal, ImageModal, AnimatedModal } from '../modals';

// Import the assets
import battleImg from '../../assets/images/audience-interactions/battle.jpg';
import order66Gif from '../../assets/images/audience-interactions/order66.gif';
import order66Audio from '../../assets/audio/audience-interactions/order66.mp3';

// Asset mapping for audience interactions
const assetMap: { [key: string]: string } = {
  '/images/audience-interactions/battle.jpg': battleImg,
  '/images/audience-interactions/order66.gif': order66Gif,
  '/audio/audience-interactions/order66.mp3': order66Audio,
};

interface AudienceInteractionModalManagerProps {
  children: React.ReactNode;
}

const AudienceInteractionModalManager: React.FC<AudienceInteractionModalManagerProps> = ({ children }) => {
  const [textModal, setTextModal] = useState<{
    isVisible: boolean;
    text: string;
    timeout?: number;
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  }>({
    isVisible: false,
    text: '',
    timeout: 3000,
    fontSize: 'large'
  });

  const [imageModal, setImageModal] = useState<{
    isVisible: boolean;
    imageSrc: string;
    alt?: string;
    closeOnShortcut?: string;
  }>({
    isVisible: false,
    imageSrc: '',
    alt: '',
    closeOnShortcut: undefined
  });

  const [animatedModal, setAnimatedModal] = useState<{
    isVisible: boolean;
    imageSrc: string;
    audioSrc?: string;
    alt?: string;
    timeout?: number;
    autoPlay?: boolean;
  }>({
    isVisible: false,
    imageSrc: '',
    audioSrc: undefined,
    alt: '',
    timeout: 5000,
    autoPlay: true
  });

  // Function to show audience interaction modal
  const showAudienceInteraction = (interaction: any, customText?: string) => {
    const hasText = interaction.content?.text || customText;
    const hasImage = interaction.content?.img;
    const hasAudio = interaction.content?.audio;
    const shortcuts = interaction.shortcuts || [];

    // Check if this is a dual-support interaction (has both text and image)
    if (hasText && hasImage && !hasAudio) {
      // Check the {id}_enableImage setting to determine which modal to show
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const imageKey = `${interaction.id}_enableImage`;
      const enableImage = currentSettings[imageKey] || false;

      if (enableImage) {
        // Show image modal
        const mappedImage = assetMap[interaction.content.img] || interaction.content.img;
        setImageModal({
          isVisible: true,
          imageSrc: mappedImage,
          alt: interaction.description,
          closeOnShortcut: shortcuts[0]
        });
      } else {
        // Show text modal
        setTextModal({
          isVisible: true,
          text: customText || interaction.content.text,
          timeout: 3000,
          fontSize: 'xlarge'
        });
      }
      return;
    }

    // Original logic for single-content interactions
    if (hasText && !hasImage) {
      // Text-only modal
      setTextModal({
        isVisible: true,
        text: customText || interaction.content.text,
        timeout: 3000,
        fontSize: 'xlarge'
      });
    } else if (hasImage && !hasAudio && !hasText) {
      // Image-only modal
      const mappedImage = assetMap[interaction.content.img] || interaction.content.img;
      setImageModal({
        isVisible: true,
        imageSrc: mappedImage,
        alt: interaction.description,
        closeOnShortcut: shortcuts[0]
      });
    } else if (hasImage && hasAudio) {
      // Animated modal with audio
      const mappedImage = assetMap[interaction.content.img] || interaction.content.img;
      const mappedAudio = assetMap[interaction.content.audio] || interaction.content.audio;

      // Calculate if audio should play (individual setting AND global sound effects)
      const currentSettings = JSON.parse(localStorage.getItem('bingoSettings') || '{}');
      const audioKey = `${interaction.id}_enableAudio`;
      const individualAudioEnabled = currentSettings[audioKey] !== undefined ? currentSettings[audioKey] : true;
      const globalSoundEffects = currentSettings.soundEffects !== undefined ? currentSettings.soundEffects : true;
      const shouldPlayAudio = individualAudioEnabled && globalSoundEffects;

      setAnimatedModal({
        isVisible: true,
        imageSrc: mappedImage,
        audioSrc: mappedAudio,
        alt: interaction.description,
        timeout: 6000,
        autoPlay: shouldPlayAudio
      });
    }
  };

  // Make the function available globally for other components to use
  React.useEffect(() => {
    (window as any).showAudienceInteraction = showAudienceInteraction;
    return () => {
      delete (window as any).showAudienceInteraction;
    };
  }, []);

  return (
    <>
      {children}

      {/* Text Modal */}
      <TextModal
        isVisible={textModal.isVisible}
        text={textModal.text}
        timeout={textModal.timeout}
        fontSize={textModal.fontSize}
        onClose={() => setTextModal(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Image Modal */}
      <ImageModal
        isVisible={imageModal.isVisible}
        imageSrc={imageModal.imageSrc}
        alt={imageModal.alt}
        closeOnShortcut={imageModal.closeOnShortcut}
        onClose={() => setImageModal(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Animated Modal */}
      <AnimatedModal
        isVisible={animatedModal.isVisible}
        imageSrc={animatedModal.imageSrc}
        audioSrc={animatedModal.audioSrc}
        alt={animatedModal.alt}
        timeout={animatedModal.timeout}
        autoPlay={animatedModal.autoPlay}
        onClose={() => setAnimatedModal(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
};

export default AudienceInteractionModalManager;
