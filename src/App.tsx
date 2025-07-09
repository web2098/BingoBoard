import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import SelectGamePage from './routes/V5/select-game-page';
import BoardPage from './routes/V5/board-page';
import SettingsPage from './routes/V5/settings-page';
import About from './routes/V5/about-page';
import TelemetryPage from './routes/V5/telemetry-page';
import ErrorPage from "./routes/error-page";
import { getSetting } from './utils/settings';
import { getVersionRoute, getVersionConfig, getAvailableVersions } from './config/versions';

// Component to handle version-based redirection
function VersionRedirect() {
  const defaultVersion = getSetting('defaultVersion', 'latest');
  const route = getVersionRoute(defaultVersion, 'root');

  // For external routes (like V4), use window.location.href
  if (route.external) {
    window.location.href = route.path;
    return null;
  }

  // For internal routes, use React Router navigation
  return <Navigate to={route.path} replace />;
}

// Component to handle version-aware routing for specific pages
function VersionAwareRoute({ routeKey, children }: { routeKey: keyof ReturnType<typeof getVersionConfig>['routes'], children: React.ReactNode }) {
  const defaultVersion = getSetting('defaultVersion', 'latest');
  const route = getVersionRoute(defaultVersion, routeKey);

  // If the current version for this route is external, redirect there
  if (route.external) {
    window.location.href = route.path;
    return null;
  }

  // Otherwise, render the React component
  return <>{children}</>;
}

// Component to handle version-specific routing
function VersionSpecificRoute({
  versionId,
  routeKey,
  children
}: {
  versionId: string,
  routeKey: keyof ReturnType<typeof getVersionConfig>['routes'],
  children: React.ReactNode
}) {
  const route = getVersionRoute(versionId, routeKey);

  // If this version route is external, redirect there
  if (route.external) {
    window.location.href = route.path;
    return null;
  }

  // Otherwise, render the React component
  return <>{children}</>;
}

export default function MyApp() {
  // Define page components mapping
  const pageComponents = {
    selectGame: SelectGamePage,
    board: BoardPage,
    settings: SettingsPage,
    about: About,
    telemetry: TelemetryPage,
  };

  // Generate routes dynamically
  const routes = [
    // Root and base routes
    {
      path: "/",
      element: <VersionRedirect />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/BingoBoard",
      element: <VersionRedirect />,
      errorElement: <ErrorPage />,
    },
  ];

  // Add default version-aware routes
  Object.entries(pageComponents).forEach(([routeKey, Component]) => {
    const routePath = `/BingoBoard/${routeKey === 'selectGame' ? 'select-game' : routeKey}`;
    routes.push({
      path: routePath,
      element: <VersionAwareRoute routeKey={routeKey as keyof typeof pageComponents}><Component /></VersionAwareRoute>,
      errorElement: <ErrorPage />,
    });
  });

  // Add version-specific routes for each version
  const availableVersions = getAvailableVersions();
  availableVersions.forEach(version => {
    Object.entries(pageComponents).forEach(([routeKey, Component]) => {
      const routePath = `/BingoBoard/${version.id}/${routeKey === 'selectGame' ? 'select-game' : routeKey}`;
      routes.push({
        path: routePath,
        element: <VersionSpecificRoute versionId={version.id} routeKey={routeKey as keyof typeof pageComponents}><Component /></VersionSpecificRoute>,
        errorElement: <ErrorPage />,
      });
    });
  });

  const router = createBrowserRouter(routes);

  return (
    <RouterProvider router={router} />
  );
}

