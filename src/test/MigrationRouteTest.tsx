// Test file to verify migration route is accessible
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MigrationPage from '../routes/V5/migration-page';

test('MigrationPage renders without crashing', () => {
  render(
    <BrowserRouter>
      <MigrationPage />
    </BrowserRouter>
  );

  // Check that the migration page title is present
  expect(screen.getByText(/migrate settings/i)).toBeInTheDocument();
});

test('MigrationPage shows migration status', () => {
  render(
    <BrowserRouter>
      <MigrationPage />
    </BrowserRouter>
  );

  // Check that migration status elements are present
  expect(screen.getByText(/checking for settings/i)).toBeInTheDocument();
});
