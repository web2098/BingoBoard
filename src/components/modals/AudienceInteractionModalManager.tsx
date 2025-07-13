import React, { useState } from 'react';
import { FlashModal, PopupModal, AnimatedModal } from '../modals';
import { getSetting } from '../../utils/settings';

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
  const [flashModal, setFlashModal] = useState<{
    isVisible: boolean;
    text: string;
    timeout?: number;
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
    backgroundColor?: string;
    borderColor?: string;
    animationColors?: [string, string];
  }>({
    isVisible: false,
    text: '',
    timeout: 5000,
    fontSize: 'large'
  });

  const [popupModal, setPopupModal] = useState<{
    isVisible: boolean;
    content: { text?: string; img?: string };
    alt?: string;
    closeOnShortcut?: string;
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  }>({
    isVisible: false,
    content: {},
    alt: '',
    closeOnShortcut: undefined,
    fontSize: 'large'
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
      const imageKey = `${interaction.id}_enableImage`;
      const enableImage = getSetting(imageKey, false);

      // Show popup modal with image
      const mappedImage = assetMap[interaction.content.img] || interaction.content.img;
      setPopupModal({
        isVisible: true,
        content: {
          img: enableImage ? mappedImage : undefined,
          text: customText || interaction.content?.text
        },
        alt: interaction.description,
        closeOnShortcut: shortcuts[0],
        fontSize: 'xlarge'
      });
      return;
    }

    // Original logic for single-content interactions
    if (hasText && !hasImage) {
      // Text-only modal - use FlashModal instead
      const timeout = getSetting('flashMessageTimeout', 3) * 1000;
      const backgroundColor = getSetting('flashMessageBackgroundColor', '#F5F0B9');
      const borderColor = getSetting('flashMessageBorderColor', '#307743');
      const animationColor1 = getSetting('flashMessageAnimationColor1', '#F5CE17');
      const animationColor2 = getSetting('flashMessageAnimationColor2', '#FFFF00');

      setFlashModal({
        isVisible: true,
        text: customText || interaction.content.text,
        timeout: timeout,
        fontSize: 'xlarge',
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        animationColors: [animationColor1, animationColor2]
      });
    } else if (hasImage && !hasAudio && !hasText) {
      // Image-only modal - use PopupModal
      const mappedImage = assetMap[interaction.content.img] || interaction.content.img;
      setPopupModal({
        isVisible: true,
        content: {
          img: mappedImage
        },
        alt: interaction.description,
        closeOnShortcut: shortcuts[0],
        fontSize: 'xlarge'
      });
    } else if (hasImage && hasAudio) {
      // Animated modal with audio
      const mappedImage = assetMap[interaction.content.img] || interaction.content.img;
      const mappedAudio = assetMap[interaction.content.audio] || interaction.content.audio;

      // Calculate if audio should play (individual setting AND global sound effects)
      const audioKey = `${interaction.id}_enableAudio`;
      const individualAudioEnabled = getSetting(audioKey, true);
      const globalSoundEffects = getSetting('soundEffects', true);
      const shouldPlayAudio = individualAudioEnabled && globalSoundEffects;
      const timeout = getSetting('flashMessageTimeout', 3) * 1000;

      setAnimatedModal({
        isVisible: true,
        imageSrc: mappedImage,
        audioSrc: mappedAudio,
        alt: interaction.description,
        timeout: timeout,
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

      {/* Flash Modal (replaces TextModal) */}
      <FlashModal
        isVisible={flashModal.isVisible}
        text={flashModal.text}
        timeout={flashModal.timeout}
        fontSize={flashModal.fontSize}
        backgroundColor={flashModal.backgroundColor}
        borderColor={flashModal.borderColor}
        animationColors={flashModal.animationColors}
        onClose={() => setFlashModal(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Popup Modal */}
      <PopupModal
        isVisible={popupModal.isVisible}
        content={popupModal.content}
        alt={popupModal.alt}
        closeOnShortcut={popupModal.closeOnShortcut}
        fontSize={popupModal.fontSize}
        onClose={() => setPopupModal(prev => ({ ...prev, isVisible: false }))}
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
