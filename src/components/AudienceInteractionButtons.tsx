import React, { useEffect, useState } from 'react';
import audienceInteractionsData from '../data/audienceInteractions.json';
import { getMappedAsset } from '../utils/assetMapping';
import { recordAudienceWinner } from '../utils/telemetry';
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

    // Use the global showAudienceInteraction function
    if ((window as any).showAudienceInteraction) {
      (window as any).showAudienceInteraction(interaction);
    } else {
      console.warn('AudienceInteractionModalManager not available');
    }
  }, []);

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
    </>
  );
};

export default AudienceInteractionButtons;
