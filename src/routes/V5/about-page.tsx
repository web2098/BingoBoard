// About.jsx
import React, { useState } from 'react';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import styles from './about-page.module.css';

interface ChangeLog {
  version: string;
  description: string;
  changes: Array<{ feature: string; details: string }>;

}

const ChangeLogSection: React.FC<ChangeLog> = ({ version, description, changes }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.changeLogItem}>
      <h2 onClick={() => setIsExpanded(!isExpanded)}>
        {version} {isExpanded ? '▼' : '▶'}
      </h2>
      {isExpanded && (
        <div className={styles.changeLogContent}>
          <p>{description}</p>
          <ul>
            {changes.map((change, index) => (
              <li key={index}>
                <strong>{change.feature}:</strong> {change.details}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const About = () => {
  const changeLogs = {
    V5: {
      description: "Modern React + TypeScript implementation of BingoBoard with enhanced features and architecture.",
      changes: [
        { feature: "Versioned Architecture", details: "Supports dual architecture with V4 (Legacy) and V5 (Modern) implementations." },
        { feature: "Telemetry System", details: "Comprehensive session tracking and analytics for real-time multiplayer functionality, inspired by the V4 stats view." },
        { feature: "Game Pattern Generation", details: "Advanced pattern generation with rotation, filtering, caching, and support for game pattern variants." },
        { feature: "Component Architecture", details: "React components with CSS Modules, TypeScript interfaces, and custom hooks." },
        { feature: "UI Refresh", details: "Complete redesign of the user interface with descriptions for each page." },
        { feature: "About Page", details: "New page providing detailed information about the application and its features." },
        { feature: "Migration Support", details: "Seamless migration tools and compatibility for transitioning from V4 to V5." }
      ]
    }
  };

  return (
    <div className={styles.aboutPage}>
      <SidebarWithMenu currentPage="about" />

      <div className={styles.aboutContent}>
        <div className={styles.aboutHeaders}>
          <div className={styles.aboutHeader}>
            <h1>About Bingo App</h1>
            <p>A modern, interactive bingo game application</p>
          </div>
          
          <div className={styles.aboutHeader}>
            <h1>Change Log</h1>
            <p>Version history and new features</p>
          </div>
        </div>

        <div className={styles.aboutColumns}>
          <div className={styles.leftColumn}>
            <section className={styles.aboutSection}>
              <h2>Features</h2>
              <ul>
                <li>Multiple game variants and patterns</li>
                <li>Customizable settings and preferences</li>
                <li>QR code room joining</li>
                <li>Interactive bingo boards</li>
                <li>Responsive design for all devices</li>
              </ul>
            </section>

            <section className={styles.aboutSection}>
              <h2>Version Information</h2>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Last Updated:</strong> July 2025</p>
              <p><strong>License:</strong> MIT</p>
            </section>

            <section className={styles.aboutSection}>
              <h2>Technology Stack</h2>
              <ul>
                <li>React 18 with TypeScript</li>
                <li>React Router for navigation</li>
                <li>CSS3 with responsive design</li>
                <li>Local storage for settings</li>
              </ul>
            </section>
          </div>

          <div className={styles.rightColumn}>
            {Object.entries(changeLogs).map(([version, log]) => (
              <ChangeLogSection
                key={version}
                version={version}
                description={log.description}
                changes={log.changes}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
