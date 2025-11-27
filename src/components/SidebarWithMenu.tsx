import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AudienceInteractionButtons from './AudienceInteractionButtons';
import { getSetting, setSetting } from '../utils/settings';
import {
  getVersionLabels,
  getVersionRoute,
  getCurrentVersion,
  shouldNavigateForVersionChange
} from '../config/versions';
import { AudienceInteractionType, AudienceInteractionOptions } from '../serverInteractions/types';
import styles from './SidebarWithMenu.module.css';

interface SidebarButton {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  className?: string;
}

interface SidebarWithMenuProps {
  currentPage: string;
  version?: string;
  onSave?: () => void;
  onReset?: () => void;
  pageButtons?: SidebarButton[];
  children?: React.ReactNode;
  onAudienceInteraction?: (eventType: AudienceInteractionType, options: AudienceInteractionOptions) => void;
}

const SidebarWithMenu: React.FC<SidebarWithMenuProps> = ({
  currentPage,
  version = "1.0.0",
  onSave,
  onReset,
  pageButtons = [],
  children,
  onAudienceInteraction
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Available versions with their corresponding URLs
  const availableVersions = getVersionLabels();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  // Listen for fullscreen changes (e.g., user presses Escape)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleVersionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVersion = event.target.value;
    const currentDefaultVersion = getSetting('defaultVersion', 'latest');

    // Update the setting
    setSetting('defaultVersion', selectedVersion);

    // Check if navigation is needed using data-driven logic
    if (shouldNavigateForVersionChange(window.location.pathname, currentDefaultVersion, selectedVersion)) {
      const route = getVersionRoute(selectedVersion, 'root');
      if (route.external) {
        window.location.href = route.path;
      } else {
        window.location.href = route.path;
      }
    }
  };

  const getCurrentVersionForSelector = () => {
    const currentDefaultVersion = getSetting('defaultVersion', 'latest');
    return getCurrentVersion(window.location.pathname, currentDefaultVersion);
  };

  const handleMenuClick = (href: string, label: string) => {
    if (href === '#reset' && onReset) {
      onReset();
      setIsMenuOpen(false);
    }
    // For other hash links, don't do anything special
  };

  const getPageLinks = () => {
    switch (currentPage) {
      case 'select-game':
        return [
          { label: 'Start Game', href: '/board' },
          { label: 'Telemetry', href: '/telemetry' },
          { label: 'divider', href: '#' },
          { label: 'About', href: '/about' },
          { label: 'Settings', href: '/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'game-board':
        return [
          { label: 'Back to Game Selection', href: '/select-game' },
          { label: 'Reset Game', href: '#reset' },
          { label: 'New Game', href: '/select-game' },
          { label: 'divider', href: '#' },
          { label: 'About', href: '/about' },
          { label: 'Settings', href: '/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'settings':
        return [
          { label: 'Back to Game Selection', href: '/select-game' },
          { label: 'Reset to Defaults', href: '#reset' },
          { label: 'divider', href: '#' },
          { label: 'About', href: '/about' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'about':
        return [
          { label: 'Back to Game Selection', href: '/select-game' },
          { label: 'divider', href: '#' },
          { label: 'Settings', href: '/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'telemetry':
        return [
          { label: 'Back to Game Selection', href: '/select-game' },
          { label: 'divider', href: '#' },
          { label: 'Settings', href: '/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      default:
        return [];
    }
  };

  const handlePageButtonClick = (button: SidebarButton) => {
    if (button.onClick) {
      button.onClick();
    }
  };

  return (
    <>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        {/* Hamburger Menu Button */}
        <button
          className={styles.hamburgerButton}
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <div className={styles.hamburgerLine}></div>
          <div className={styles.hamburgerLine}></div>
          <div className={styles.hamburgerLine}></div>
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          className={styles.fullscreenButton}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          )}
        </button>

        {/* Page-specific buttons */}
        <div className={styles.pageButtons}>
          {pageButtons.map((button) => {
            // Map className to CSS Modules class
            let additionalClass = '';
            if (button.className) {
              // Convert kebab-case to camelCase and check if it exists in styles
              const camelCaseClass = button.className.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              additionalClass = styles[camelCaseClass] || '';
            }

            return (
              <button
                key={button.id}
                className={`${styles.sidebarButton} ${additionalClass}`}
                onClick={() => handlePageButtonClick(button)}
                title={button.label}
              >
                {button.icon}
              </button>
            );
          })}
        </div>

        {/* Custom content area */}
        {children && <div className={styles.sidebarCustomContent}>{children}</div>}

        {/* Audience Interaction Buttons */}
        <div className={styles.audienceInteractionSection}>
          <AudienceInteractionButtons
            currentPage={currentPage}
            onAudienceInteraction={onAudienceInteraction}
          />
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className={styles.sidebarMenuOverlay} onClick={toggleMenu}>
          <div className={styles.sidebarMenuPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sidebarMenuHeader}>
              <div className={styles.sidebarMenuHeaderTop}>
                <h2>Bingo Menu</h2>
                <button className={styles.sidebarMenuBackArrow} onClick={toggleMenu}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
              </div>
              <div className={styles.sidebarMenuVersionSelector}>
                <label htmlFor="version-select">Version:</label>
                <select
                  id="version-select"
                  value={getCurrentVersionForSelector()}
                  onChange={handleVersionChange}
                  className={styles.versionSelect}
                >
                  {availableVersions.map((versionOption) => (
                    <option key={versionOption.value} value={versionOption.value}>
                      {versionOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <nav className={styles.sidebarMenuNav}>
              {getPageLinks().map((link, index) => (
                link.label === "divider" ?
                <hr key={index} className={styles.sidebarMenuDivider} />
                :
                link.href.startsWith('#') ? (
                  <a
                    key={index}
                    href={link.href}
                    className={styles.sidebarMenuLink}
                    onClick={(e) => {
                      e.preventDefault();
                      handleMenuClick(link.href, link.label);
                    }}
                  >
                    {link.label}
                  </a>
                ) : (link as any).external ? (
                  <a
                    key={index}
                    href={link.href}
                    className={styles.sidebarMenuLink}
                    target={(link.href.startsWith('http') || link.href.startsWith('https')) ? "_blank" : undefined}
                    rel={(link.href.startsWith('http') || link.href.startsWith('https')) ? "noopener noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={index} to={link.href} className={styles.sidebarMenuLink}>
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarWithMenu;
