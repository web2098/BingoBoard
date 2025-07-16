// About.jsx
import React, { useState, useEffect } from 'react';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import styles from './about-page.module.css';
import { VERSIONS } from '../../config/versions';
import changelogData from '../../data/changelog.json';
import aboutPageData from '../../data/aboutPageData.json';

interface ChangeLog {
  version: string;
  description: string;
  changes: Array<{ feature: string; details: string }>;
  aiOpinion?: string;
}

interface VersionChangeData {
  description: string;
  changes: Array<{ feature: string; details: string }>;
  ai_opinion?: string;
}

const ChangeLogSection: React.FC<ChangeLog & { isCurrentVersion: boolean }> = ({
  version,
  description,
  changes,
  aiOpinion,
  isCurrentVersion
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${styles.changeLogItem} ${isCurrentVersion ? styles.currentVersionItem : styles.otherVersionItem}`}>
      <h2
        onClick={() => setIsExpanded(!isExpanded)}
        className={isCurrentVersion ? styles.currentVersion : styles.otherVersion}
      >
        {version} {isExpanded ? '▼' : '▶'}
      </h2>
      {isExpanded && (
        <div className={styles.changeLogContent}>
          <p>{description}</p>
          {changes.length > 0 ? (
            <ul>
              {changes.map((change, index) => (
                <li key={index}>
                  <strong>{change.feature}:</strong> {change.details}
                </li>
              ))}
            </ul>
          ) : (
            <p><em>No changes documented from the previous version.</em></p>
          )}
          {aiOpinion && (
            <div className={styles.aiOpinion}>
              <h4>🤖 AI Opinion:</h4>
              <p>{aiOpinion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const About = () => {
  const [changeLogs, setChangeLogs] = useState<Record<string, VersionChangeData>>({});
  const [currentVersion, setCurrentVersion] = useState<string>('V5');

  // Helper function to render text with clickable links
  const renderTextWithLinks = (text: string) => {
    // Regular expression to match URLs (github.com/user/repo format and full URLs)
    const urlRegex = /(https?:\/\/[^\s]+|github\.com\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const url = part.startsWith('http') ? part : `https://${part}`;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007acc', textDecoration: 'underline' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    // Get current version from VERSIONS config
    // Find the highest version number (current version)
    const versionEntries = Object.entries(VERSIONS).filter(([key]) => key !== 'latest');
    const sortedVersions = versionEntries.sort((a, b) => {
      const aNum = parseInt(a[0].substring(1)) || 0;
      const bNum = parseInt(b[0].substring(1)) || 0;
      return bNum - aNum;
    });

    if (sortedVersions.length > 0) {
      const currentVersionKey = sortedVersions[0][0].toUpperCase(); // Convert v5 to V5
      setCurrentVersion(currentVersionKey);
    }

    // Build changelog data by combining versions.ts and changelog.json
    const logs: Record<string, VersionChangeData> = {};

    sortedVersions.forEach(([versionId, versionConfig]) => {
      const versionKey = versionId.toUpperCase(); // Convert v5 to V5 for changelog lookup
      const changelogEntry = (changelogData as any)[versionKey];

      if (changelogEntry) {
        // Use changelog data if available
        logs[versionKey] = {
          description: changelogEntry.description,
          changes: changelogEntry.changes,
          ai_opinion: changelogEntry.ai_opinion
        };
      } else {
        // Create fallback entry for versions without changelog data
        logs[versionKey] = {
          description: versionConfig.description || `${versionConfig.name} implementation`,
          changes: [] // Empty changes array will trigger "No changes documented" message
        };
      }
    });

    setChangeLogs(logs);
  }, []);

  return (
    <div className={styles.aboutPage}>
      <SidebarWithMenu currentPage="about" />

      <div className={styles.aboutContent}>
        <div className={styles.aboutHeaders}>
          <div className={styles.aboutHeader}>
            <h1>{aboutPageData.headers.about.title}</h1>
            <p>{aboutPageData.headers.about.subtitle}</p>
          </div>

          <div className={styles.aboutHeader}>
            <h1>{aboutPageData.headers.changelog.title}</h1>
            <p>{aboutPageData.headers.changelog.subtitle}</p>
          </div>
        </div>

        <div className={styles.aboutColumns}>
          <div className={styles.leftColumn}>
            {aboutPageData.sections.filter(section => section.title !== "👨‍💻 About Me").map((section, index) => (
              <section key={index} className={styles.aboutSection}>
                <h2>{section.title}</h2>
                {section.type === 'list' ? (
                  <ul>
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {typeof item === 'string' ? renderTextWithLinks(item) :
                         (item as any).text && (item as any).link ? (
                           <a
                             href={(item as any).link}
                             target="_blank"
                             rel="noopener noreferrer"
                             style={{ color: '#007acc', textDecoration: 'underline' }}
                           >
                             {(item as any).text}
                           </a>
                         ) :
                         (item as any).label && (item as any).value ? `${(item as any).label}: ${(item as any).value}` :
                         JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                ) : section.type === 'details' ? (
                  <div>
                    {section.items.map((item, itemIndex) => (
                      <p key={itemIndex}>
                        {typeof item === 'string' ? item :
                         (item as any).label && (item as any).value ? (
                           <>
                             <strong>{(item as any).label}:</strong> {(item as any).link ? (
                               <a href={(item as any).link} target="_blank" rel="noopener noreferrer">
                                 {(item as any).label === 'Version' ? currentVersion : (item as any).value}
                               </a>
                             ) : (
                               (item as any).label === 'Version' ? currentVersion : (item as any).value
                             )}
                             {(item as any).note && <span> ({(item as any).note})</span>}
                           </>
                         ) : JSON.stringify(item)}
                      </p>
                    ))}
                  </div>
                ) : section.type === 'profile' ? (
                  <div>
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className={styles.profileCard}>
                        <a
                          href={(item as any).link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.profileLink}
                        >
                          <img
                            src={(item as any).avatar}
                            alt={`${(item as any).name} avatar`}
                            className={styles.profileAvatar}
                          />
                          <div className={styles.profileInfo}>
                            <h3 className={styles.profileName}>{(item as any).name}</h3>
                            <p className={styles.profileDescription}>{(item as any).description}</p>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {section.items.map((item, itemIndex) => (
                      <p key={itemIndex}>
                        {typeof item === 'string' ? item : JSON.stringify(item)}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className={styles.rightColumn}>
            {/* Changelog sections first */}
            {Object.entries(changeLogs).map(([version, log]) => (
              <ChangeLogSection
                key={version}
                version={version}
                description={log.description}
                changes={log.changes}
                aiOpinion={log.ai_opinion}
                isCurrentVersion={version === currentVersion}
              />
            ))}

            {/* About Me section below changelog versions */}
            {aboutPageData.sections.filter(section => section.title === "👨‍💻 About Me").map((section, index) => (
              <section key={index} className={styles.aboutSection}>
                <h2>{section.title}</h2>
                {section.type === 'profile' ? (
                  <div>
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className={styles.profileCard}>
                        <a
                          href={(item as any).link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.profileLink}
                        >
                          <img
                            src={(item as any).avatar}
                            alt={`${(item as any).name} avatar`}
                            className={styles.profileAvatar}
                          />
                          <div className={styles.profileInfo}>
                            <h3 className={styles.profileName}>{(item as any).name}</h3>
                            <p className={styles.profileDescription}>{(item as any).description}</p>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.copyright}>
        <p>© 2025 Eric Gressman. All rights reserved.</p>
      </div>
    </div>
  );
};

export default About;
