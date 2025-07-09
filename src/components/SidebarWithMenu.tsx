import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AudienceInteractionButtons from './AudienceInteractionButtons';
import './SidebarWithMenu.css';

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
}

const SidebarWithMenu: React.FC<SidebarWithMenuProps> = ({
  currentPage,
  version = "1.0.0",
  onSave,
  onReset,
  pageButtons = [],
  children
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          { label: 'Start Game', href: '/BingoBoard/board' },
          { label: 'divider', href: '#' },
          { label: 'About', href: '/BingoBoard/about' },
          { label: 'Settings', href: '/BingoBoard/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'game-board':
        return [
          { label: 'Back to Game Selection', href: '/BingoBoard/select-game' },
          { label: 'Reset Game', href: '#reset' },
          { label: 'New Game', href: '/BingoBoard/select-game' },
          { label: 'divider', href: '#' },
          { label: 'About', href: '/BingoBoard/about' },
          { label: 'Settings', href: '/BingoBoard/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'settings':
        return [
          { label: 'Back to Game Selection', href: '/BingoBoard/select-game' },
          { label: 'Reset to Defaults', href: '#reset' },
          { label: 'divider', href: '#' },
          { label: 'About', href: '/BingoBoard/about' },
          { label: 'Settings', href: '/BingoBoard/settings' },
          { label: 'Report an Issue', href: 'https://github.com/web2098/BingoBoard/issues/new', external: true }
        ];
      case 'about':
        return [
          { label: 'Back to Game Selection', href: '/BingoBoard/select-game' },
          { label: 'divider', href: '#' },
          { label: 'Settings', href: '/BingoBoard/settings' },
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
      <div className="sidebar">
        {/* Hamburger Menu Button */}
        <button
          className="hamburger-button"
          onClick={toggleMenu}
          aria-label="Menu"
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>

        {/* Page-specific buttons */}
        <div className="page-buttons">
          {pageButtons.map((button) => (
            <button
              key={button.id}
              className={`sidebar-button ${button.className || ''}`}
              onClick={() => handlePageButtonClick(button)}
              title={button.label}
            >
              {button.icon}
            </button>
          ))}
        </div>

        {/* Custom content area */}
        {children && <div className="sidebar-custom-content">{children}</div>}

        {/* Audience Interaction Buttons */}
        <div className="audience-interaction-section">
          <AudienceInteractionButtons currentPage={currentPage} />
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="sidebar-menu-overlay" onClick={toggleMenu}>
          <div className="sidebar-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-menu-header">
              <div className="sidebar-menu-header-top">
                <h2>Bingo Menu</h2>
                <button className="sidebar-menu-back-arrow" onClick={toggleMenu}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
              </div>
              <p className="sidebar-menu-version">Version {version}</p>
            </div>

            <nav className="sidebar-menu-nav">
              {getPageLinks().map((link, index) => (
                link.label === "divider" ?
                <hr key={index} className="sidebar-menu-divider" />
                :
                link.href.startsWith('#') ? (
                  <a
                    key={index}
                    href={link.href}
                    className="sidebar-menu-link"
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
                    className="sidebar-menu-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={index} to={link.href} className="sidebar-menu-link">
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
