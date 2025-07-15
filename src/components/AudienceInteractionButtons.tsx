import React, { useEffect, useState } from 'react';
import audienceInteractionsData from '../data/audienceInteractions.json';
import { getMappedAsset } from '../utils/assetMapping';
import { recordAudienceWinner } from '../utils/telemetry';
import { AudienceInteractionType, AudienceInteractionOptions } from '../serverInteractions/types';
import styles from './AudienceInteractionButtons.module.css';
import { getSetting } from '../utils/settings';

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
  onAudienceInteraction?: (eventType: AudienceInteractionType, options: AudienceInteractionOptions) => void;
}

const AudienceInteractionButtons: React.FC<AudienceInteractionButtonsProps> = ({
  currentPage,
  className = "",
  onAudienceInteraction
}) => {
  const [interactions, setInteractions] = useState<AudienceInteraction[]>([]);

  useEffect(() => {
    // Filter interactions for current page
    const pageInteractions = audienceInteractionsData.filter(
      (interaction: AudienceInteraction) => interaction.pages.includes(currentPage)
    );
    setInteractions(pageInteractions);
  }, [currentPage]);

  const handleInteractionClick = React.useCallback((interaction: AudienceInteraction) => {
    // Record winner if this is a winner interaction
    if (interaction.id === 'winner') {
      recordAudienceWinner();
    }

    const imageKey = `${interaction.id}_enableImage`;
    const audioKey = `${interaction.id}_enableAudio`;
    // Create default options for the interaction using the correct interface structure
    const defaultOptions: AudienceInteractionOptions = {
        enable_image: getSetting(imageKey, true),
        enable_audio: getSetting(audioKey, true)
    };

    console.log('Audience interaction clicked:', interaction, defaultOptions);

    // Send audience interaction to server (for clients)
    if (onAudienceInteraction) {
      onAudienceInteraction(interaction.id as AudienceInteractionType, defaultOptions);
    }

    // Use the global showAudienceInteraction function (for local display)
    if ((window as any).showAudienceInteraction) {
      (window as any).showAudienceInteraction(interaction, defaultOptions);
    } else {
      console.warn('AudienceInteractionModalManager not available');
    }
  }, [onAudienceInteraction]);

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
      return <span className={styles.interactionEmoji}>{interaction.icon.emoji}</span>;
    } else if (interaction.icon.img) {
      return (
        <img
          src={getMappedAsset(interaction.icon.img)}
          alt={interaction.description}
          className={styles.interactionIconImg}
        />
      );
    }
    return <span className={styles.interactionEmoji}>🎭</span>;
  };

  if (interactions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`${styles.audienceInteractionButtons} ${className}`}>
        {interactions.map((interaction, index) => (
          <button
            key={interaction.id}
            className={styles.audienceInteractionBtn}
            onClick={() => handleInteractionClick(interaction)}
            title={`${interaction.description} (${interaction.shortcuts.join(', ')})`}
            style={{ '--btn-index': index } as React.CSSProperties}
          >
            {renderInteractionIcon(interaction)}
          </button>
        ))}
      </div>
    </>
  );
};

export default AudienceInteractionButtons;
