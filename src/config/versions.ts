// Centralized version configuration for BingoBoard
// This file defines all available versions and their routing behavior

export interface VersionRoute {
  path: string;
  external?: boolean; // If true, uses window.location.href instead of React Router
}

export interface VersionConfig {
  id: string;
  name: string;
  label: string;
  description: string;
  inherit?: string; // Version ID to inherit from
  routes: {
    root: VersionRoute;
    bingo: VersionRoute;
    selectGame: VersionRoute;
    board: VersionRoute;
    client: VersionRoute;
    settings: VersionRoute;
    about: VersionRoute;
    telemetry: VersionRoute;
    migration: VersionRoute;
  };
}

// Available versions configuration
export const VERSIONS: Record<string, VersionConfig> = {
  latest: {
    id: 'latest',
    name: 'Latest',
    label: 'Latest',
    description: 'Always redirects to the most current version available',
    inherit: 'v5',
    routes: {} as any // Will be populated by inheritance
  },
  v5: {
    id: 'v5',
    name: 'Version 5',
    label: 'V5 (Current)',
    description: 'Enhanced React version with modern UI, color customization, and modal previews',
    routes: {
      root: { path: '/select-game' },
      bingo: { path: '/select-game' },
      selectGame: { path: '/select-game' },
      board: { path: '/board' },
      client: { path: '/client' },
      settings: { path: '/settings' },
      about: { path: '/about' },
      telemetry: { path: '/telemetry' },
      migration: { path: '/migration' }
    }
  },
  v4: {
    id: 'v4',
    name: 'Version 4',
    label: 'V4 (Legacy)',
    description: 'Classic HTML/CSS/JS version with traditional interface',
    routes: {
      root: { path: '/BingoBoard/v4/index.html', external: true },
      bingo: { path: '/BingoBoard/v4/index.html', external: true },
      selectGame: { path: '/BingoBoard/v4/index.html', external: true },
      board: { path: '/BingoBoard/v4/board.html', external: true },
      client: { path: '/BingoBoard/v4/client_view.html', external: true },
      settings: { path: '/BingoBoard/v4/settings.html', external: true },
      about: { path: '/BingoBoard/v4/about.html', external: true },
      telemetry: { path: '/BingoBoard/v4/stats.html' },
      migration: { path: '/migration' } // Redirect to V5 migration page
    }
  }
};

// Helper functions
export function getVersionConfig(versionId: string): VersionConfig {
  const baseConfig = VERSIONS[versionId] || VERSIONS.latest;

  // If no inheritance, return as is
  if (!baseConfig.inherit) {
    return baseConfig;
  }

  // Get the parent configuration
  const parentConfig = VERSIONS[baseConfig.inherit];
  if (!parentConfig) {
    console.warn(`Version ${versionId} inherits from ${baseConfig.inherit} but that version doesn't exist`);
    return baseConfig;
  }

  // Merge parent and child configurations
  // Child properties override parent properties
  const mergedRoutes = { ...parentConfig.routes, ...baseConfig.routes };

  return {
    ...parentConfig,
    ...baseConfig,
    routes: mergedRoutes
  };
}

export function getVersionRoute(versionId: string, routeKey: keyof VersionConfig['routes']): VersionRoute {
  const config = getVersionConfig(versionId);
  return config.routes[routeKey];
}

export function getAvailableVersions(): VersionConfig[] {
  return Object.values(VERSIONS);
}

export function getVersionLabels(): { value: string; label: string }[] {
  return Object.values(VERSIONS).map(version => ({
    value: version.id,
    label: version.label
  }));
}

// Navigate to a specific route for a given version
export function navigateToVersion(versionId: string, routeKey: keyof VersionConfig['routes']): void {
  const route = getVersionRoute(versionId, routeKey);

  if (route.external) {
    window.location.href = route.path;
  } else {
    // For React Router navigation, we'll need to handle this in the component
    // This function mainly serves as a helper for external navigation
    window.location.href = route.path;
  }
}
