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
  onModalClose?: () => void; // Callback when modal is closed via Escape or other means
}

const AudienceInteractionModalManager: React.FC<AudienceInteractionModalManagerProps> = ({ children, onModalClose }) => {
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

  // Track the current popup shortcut for toggle functionality
  const [currentPopupShortcut, setCurrentPopupShortcut] = useState<string | null>(null);

  // Global keyboard listener for popup modal toggle functionality
  React.useEffect(() => {
    const handleGlobalKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Only handle toggle if a popup modal is currently visible and the pressed key matches its shortcut
      if (popupModal.isVisible && currentPopupShortcut && key === currentPopupShortcut.toLowerCase()) {
        // Close the popup modal
        setPopupModal(prev => ({ ...prev, isVisible: false }));
        setCurrentPopupShortcut(null);
        if (onModalClose) onModalClose();
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyPress, true); // Use capture phase

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress, true);
    };
  }, [popupModal.isVisible, currentPopupShortcut, onModalClose]);

  // Function to show audience interaction modal
  const showAudienceInteraction = React.useCallback((interaction: any, customText?: string) => {
    const hasText = interaction.content?.text || customText;
    const hasImage = interaction.content?.img;
    const hasAudio = interaction.content?.audio;
    const shortcuts = interaction.shortcuts || [];
    const primaryShortcut = shortcuts[0];
    // Check if this interaction would show a popup modal and if the same shortcut is already active
    const wouldShowPopup = (hasText && hasImage && !hasAudio) || (hasImage && !hasAudio && !hasText);

    if (wouldShowPopup && popupModal.isVisible && primaryShortcut && primaryShortcut.toLowerCase() === currentPopupShortcut?.toLowerCase()) {
      // Same shortcut pressed while popup is visible - close it (toggle functionality)
      setPopupModal(prev => ({ ...prev, isVisible: false }));
      setCurrentPopupShortcut(null);
      if (onModalClose) onModalClose();
      return;
    }

    // Check if any modal is currently active - prevent new activations (AFTER toggle check)
    const isAnyModalActive = flashModal.isVisible || popupModal.isVisible || animatedModal.isVisible;

    if (isAnyModalActive) {
      console.log('Modal activation blocked: Another modal is already active', {
        flashModal: flashModal.isVisible,
        popupModal: popupModal.isVisible,
        animatedModal: animatedModal.isVisible
      });
      return;
    }

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
        closeOnShortcut: primaryShortcut,
        fontSize: 'xlarge'
      });
      setCurrentPopupShortcut(primaryShortcut);
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
        closeOnShortcut: primaryShortcut,
        fontSize: 'xlarge'
      });
      setCurrentPopupShortcut(primaryShortcut);
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
  }, [flashModal.isVisible, popupModal.isVisible, animatedModal.isVisible, currentPopupShortcut, onModalClose]);

  // Function to hide any currently visible audience interaction modal
  const hideAudienceInteraction = React.useCallback(() => {
    // Close all modals
    setFlashModal(prev => ({ ...prev, isVisible: false }));
    setPopupModal(prev => ({ ...prev, isVisible: false }));
    setAnimatedModal(prev => ({ ...prev, isVisible: false }));
    setCurrentPopupShortcut(null);
  }, []);

  // Function to check if any modal is currently active
  const isAnyModalActive = React.useCallback(() => {
    return flashModal.isVisible || popupModal.isVisible || animatedModal.isVisible;
  }, [flashModal.isVisible, popupModal.isVisible, animatedModal.isVisible]);

  // Make the functions available globally for other components to use
  React.useEffect(() => {
    console.log('Registering global modal functions');
    (window as any).showAudienceInteraction = showAudienceInteraction;
    (window as any).hideAudienceInteraction = hideAudienceInteraction;
    (window as any).isAnyModalActive = isAnyModalActive;
    return () => {
      delete (window as any).showAudienceInteraction;
      delete (window as any).hideAudienceInteraction;
      delete (window as any).isAnyModalActive;
    };
  }, [showAudienceInteraction, hideAudienceInteraction, isAnyModalActive]);

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
        onClose={() => {
          setFlashModal(prev => ({ ...prev, isVisible: false }));
          if (onModalClose) onModalClose();
        }}
      />

      {/* Popup Modal */}
      <PopupModal
        isVisible={popupModal.isVisible}
        content={popupModal.content}
        alt={popupModal.alt}
        closeOnShortcut={popupModal.closeOnShortcut}
        fontSize={popupModal.fontSize}
        onClose={() => {
          setPopupModal(prev => ({ ...prev, isVisible: false }));
          setCurrentPopupShortcut(null);
          if (onModalClose) onModalClose();
        }}
      />

      {/* Animated Modal */}
      <AnimatedModal
        isVisible={animatedModal.isVisible}
        imageSrc={animatedModal.imageSrc}
        audioSrc={animatedModal.audioSrc}
        alt={animatedModal.alt}
        timeout={animatedModal.timeout}
        autoPlay={animatedModal.autoPlay}
        onClose={() => {
          setAnimatedModal(prev => ({ ...prev, isVisible: false }));
          if (onModalClose) onModalClose();
        }}
      />
    </>
  );
};

export default AudienceInteractionModalManager;
