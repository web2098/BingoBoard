import React, { useEffect, useState } from 'react';
import audienceInteractionsData from '../data/audienceInteractions.json';
import { TextModal, ImageModal, AnimatedModal, WelcomeModal } from './modals';
import { getMappedAsset } from '../utils/assetMapping';
import './AudienceInteractionButtons.css';

interface AudienceInteraction {
  id: string;
  content: {
    text?: string;
    img?: string;
    audio?: string;
  };
  icon: {
    emoji?: string;
    img?: string;
  };
  action: {
    function: string;
    args: string[];
  };
  auto?: {
    number: number;
  };
  description: string;
  pages: string[];
  shortcuts: string[];
}

interface AudienceInteractionButtonsProps {
  currentPage: string;
  className?: string;
}

const AudienceInteractionButtons: React.FC<AudienceInteractionButtonsProps> = ({
  currentPage,
  className = ""
}) => {
  const [interactions, setInteractions] = useState<AudienceInteraction[]>([]);

  // Modal states
  const [textModal, setTextModal] = useState({ isVisible: false, text: '' });
  const [imageModal, setImageModal] = useState({ isVisible: false, imageSrc: '', text: '' });
  const [animatedModal, setAnimatedModal] = useState({
    isVisible: false,
    imageSrc: '',
    audioSrc: '',
    alt: ''
  });
  const [welcomeModal, setWelcomeModal] = useState({ isVisible: false });

  useEffect(() => {
    // Filter interactions for current page
    const pageInteractions = audienceInteractionsData.filter(
      (interaction: AudienceInteraction) => interaction.pages.includes(currentPage)
    );
    setInteractions(pageInteractions);
  }, [currentPage]);

  const handleInteractionClick = React.useCallback((interaction: AudienceInteraction) => {
    console.log(`Triggered interaction: ${interaction.id}`, interaction);

    // Use proper modals based on interaction type
    switch (interaction.action.function) {
      case 'showAudienceInteraction':
        showTextModal(interaction.content.text || interaction.description);
        break;
      case 'showBattleToTheDeath':
        if (imageModal.isVisible) {
          // If modal is already visible, close it
          closeImageModal();
        } else {
          // If modal is not visible, show it
          if (interaction.content.img) {
            showImageModal(interaction.content.img, interaction.content.text);
          } else {
            showTextModal(interaction.content.text || interaction.description);
          }
        }
        break;
      case 'executeOrder66':
        showAnimatedModal(interaction);
        break;
      case 'showWelcomeCard':
        if (welcomeModal.isVisible) {
          // If modal is already visible, close it
          closeWelcomeModal();
        } else {
          // If modal is not visible, show it
          showWelcomeModal();
        }
        break;
      default:
        console.log('Unknown interaction function:', interaction.action.function);
    }
  }, [imageModal.isVisible, welcomeModal.isVisible]);

  // Modal handler functions
  const showTextModal = (text: string) => {
    setTextModal({ isVisible: true, text });
  };

  const showImageModal = (imageSrc: string, text?: string) => {
    setImageModal({
      isVisible: true,
      imageSrc: getMappedAsset(imageSrc),
      text: text || ''
    });
  };

  const showAnimatedModal = (interaction: AudienceInteraction) => {
    setAnimatedModal({
      isVisible: true,
      imageSrc: getMappedAsset(interaction.content.img || ''),
      audioSrc: getMappedAsset(interaction.content.audio || ''),
      alt: interaction.description
    });
  };

  const showWelcomeModal = () => {
    setWelcomeModal({ isVisible: true });
  };

  // Modal close handlers
  const closeTextModal = () => setTextModal({ isVisible: false, text: '' });
  const closeImageModal = () => setImageModal({ isVisible: false, imageSrc: '', text: '' });
  const closeAnimatedModal = () => setAnimatedModal({
    isVisible: false,
    imageSrc: '',
    audioSrc: '',
    alt: ''
  });
  const closeWelcomeModal = () => setWelcomeModal({ isVisible: false });

  useEffect(() => {
    // Set up keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Find interaction with matching shortcut
      const interaction = interactions.find(inter =>
        inter.shortcuts.some(shortcut => shortcut.toLowerCase() === key)
      );

      if (interaction) {
        event.preventDefault();
        handleInteractionClick(interaction);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [interactions, handleInteractionClick]);

  const renderInteractionIcon = (interaction: AudienceInteraction) => {
    if (interaction.icon.emoji) {
      return <span className="interaction-emoji">{interaction.icon.emoji}</span>;
    } else if (interaction.icon.img) {
      return (
        <img
          src={getMappedAsset(interaction.icon.img)}
          alt={interaction.description}
          className="interaction-icon-img"
        />
      );
    }
    return <span className="interaction-emoji">🎭</span>;
  };

  if (interactions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`audience-interaction-buttons ${className}`}>
        {interactions.map((interaction, index) => (
          <button
            key={interaction.id}
            className="audience-interaction-btn"
            onClick={() => handleInteractionClick(interaction)}
            title={`${interaction.description} (${interaction.shortcuts.join(', ')})`}
            style={{ '--btn-index': index } as React.CSSProperties}
          >
            {renderInteractionIcon(interaction)}
          </button>
        ))}
      </div>

      {/* Modal Components */}
      <TextModal
        isVisible={textModal.isVisible}
        text={textModal.text}
        onClose={closeTextModal}
        fontSize="xlarge"
        timeout={3000}
      />

      <ImageModal
        isVisible={imageModal.isVisible}
        imageSrc={imageModal.imageSrc}
        alt={imageModal.text || "Audience Interaction"}
        onClose={closeImageModal}
        closeOnShortcut="esc"
      />

      <AnimatedModal
        isVisible={animatedModal.isVisible}
        imageSrc={animatedModal.imageSrc}
        audioSrc={animatedModal.audioSrc}
        alt={animatedModal.alt}
        onClose={closeAnimatedModal}
        timeout={6000}
        autoPlay={true}
      />

      <WelcomeModal
        isVisible={welcomeModal.isVisible}
        onClose={closeWelcomeModal}
        timeout={0}
      />
    </>
  );
};

export default AudienceInteractionButtons;
