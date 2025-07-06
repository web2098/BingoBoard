import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  currentPage: string;
  version?: string;
  onSave?: () => void;
  onReset?: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  currentPage,
  version = "1.0.0",
  onSave,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (href: string, label: string) => {
    if (href === '#reset' && onReset) {
      onReset();
      setIsOpen(false);
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
      case 'board':
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

  return (
    <>
      <button
        className="hamburger-button"
        onClick={toggleMenu}
        aria-label="Menu"
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      {isOpen && (
        <div className="menu-overlay" onClick={toggleMenu}>
          <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <h2>Bingo Menu</h2>
              <p className="menu-version">Version {version}</p>
            </div>

            <nav className="menu-nav">
              {getPageLinks().map((link, index) => (
                link.label === "divider" ?
                <hr key={index} className="menu-divider" />
                :
                link.href.startsWith('#') ? (
                  <a
                    key={index}
                    href={link.href}
                    className="menu-link"
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
                    className="menu-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link key={index} to={link.href} className="menu-link">
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

export default HamburgerMenu;
