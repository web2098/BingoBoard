// About.jsx
import React from 'react';
import SidebarWithMenu from '../../components/SidebarWithMenu';
import './about-page.css';

const About = () => {
  return (
    <div className="about-page">
      <SidebarWithMenu currentPage="about" />

      <div className="about-content">
        <div className="about-header">
          <h1>About Bingo App</h1>
          <p>A modern, interactive bingo game application</p>
        </div>

        <div className="about-sections">
          <section className="about-section">
            <h2>Features</h2>
            <ul>
              <li>Multiple game variants and patterns</li>
              <li>Customizable settings and preferences</li>
              <li>QR code room joining</li>
              <li>Interactive bingo boards</li>
              <li>Responsive design for all devices</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Version Information</h2>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Last Updated:</strong> July 2025</p>
            <p><strong>License:</strong> MIT</p>
          </section>

          <section className="about-section">
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
