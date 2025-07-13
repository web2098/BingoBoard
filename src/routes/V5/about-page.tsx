// About.jsx
import React from 'react';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import styles from './about-page.module.css';

const About = () => {
  return (
    <div className={styles.aboutPage}>
      <SidebarWithMenu currentPage="about" />

      <div className={styles.aboutContent}>
        <div className={styles.aboutHeader}>
          <h1>About Bingo App</h1>
          <p>A modern, interactive bingo game application</p>
        </div>

        <div className={styles.aboutSections}>
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
      </div>
    </div>
  );
};

export default About;
