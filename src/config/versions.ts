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
      telemetry: { path: '/BingoBoard/v4/stats.html', external: true },
      migration: { path: '/migration' } // Redirect to V5 migration page
    }
  },
  v3: {
    id: 'v3',
    name: 'Version 3',
    label: 'V3 (Historical)',
    description: 'Historical version 3 implementation',
    routes: {
      root: { path: '/BingoBoard/v3/index.html', external: true },
      bingo: { path: '/BingoBoard/v3/index.html', external: true },
      selectGame: { path: '/BingoBoard/v3/index.html', external: true },
      board: { path: '/BingoBoard/v3/board.html', external: true },
      client: { path: '/BingoBoard/v3/client_view.html', external: true },
      settings: { path: '/BingoBoard/v3/settings.html', external: true },
      about: { path: '/BingoBoard/v3/about.html', external: true },
      telemetry: { path: '/BingoBoard/v3/stats.html', external: true },
      migration: { path: '/migration' } // Redirect to V5 migration page
    }
  },
  v2: {
    id: 'v2',
    name: 'Version 2',
    label: 'V2 (Historical)',
    description: 'Historical version 2 implementation',
    routes: {
      root: { path: '/BingoBoard/v2/index.html', external: true },
      bingo: { path: '/BingoBoard/v2/index.html', external: true },
      selectGame: { path: '/BingoBoard/v2/index.html', external: true },
      board: { path: '/BingoBoard/v2/board.html', external: true },
      client: { path: '/BingoBoard/v2/client_view.html', external: true },
      settings: { path: '/BingoBoard/v2/settings.html', external: true },
      about: { path: '/BingoBoard/v2/about.html', external: true },
      telemetry: { path: '/BingoBoard/v2/stats.html', external: true },
      migration: { path: '/migration' } // Redirect to V5 migration page
    }
  },
  v1: {
    id: 'v1',
    name: 'Version 1',
    label: 'V1 (Historical)',
    description: 'Historical version 1 implementation',
    routes: {
      root: { path: '/BingoBoard/v1/index.html', external: true },
      bingo: { path: '/BingoBoard/v1/index.html', external: true },
      selectGame: { path: '/BingoBoard/v1/index.html', external: true },
      board: { path: '/BingoBoard/v1/index.html', external: true },
      client: { path: '/BingoBoard/v1/index.html', external: true },
      settings: { path: '/BingoBoard/v1/index.html', external: true },
      about: { path: '/BingoBoard/v1/index.html', external: true },
      telemetry: { path: '/BingoBoard/v1/index.html', external: true },
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
  console.log(`Getting route for version ${versionId}, key: ${routeKey}`);
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

// Detect version from URL path
export function getVersionFromPath(pathname: string): string {
  // Check for specific version patterns in the URL
  if (pathname.includes('/v1/')) return 'v1';
  if (pathname.includes('/v2/')) return 'v2';
  if (pathname.includes('/v3/')) return 'v3';
  if (pathname.includes('/v4/')) return 'v4';

  // Default to V5 for modern React implementation
  return 'v5';
}

// Helper function to resolve version aliases to actual versions
export function resolveVersionAlias(versionId: string): string {
  const config = getVersionConfig(versionId);

  // If version inherits from another, return the inherited version
  if (config.inherit) {
    return config.inherit;
  }

  return versionId;
}

// Helper function to get the current actual version
export function getCurrentVersion(pathname: string, defaultVersionSetting: string): string {
  // First, try to detect from URL path
  const pathVersion = getVersionFromPath(pathname);

  // If we detected a specific version from path, use that
  if (pathVersion !== 'v5') {
    return pathVersion;
  }

  // Otherwise, resolve the default version setting
  return resolveVersionAlias(defaultVersionSetting);
}

// Helper function to check if two versions are equivalent
export function areVersionsEquivalent(version1: string, version2: string): boolean {
  const resolved1 = resolveVersionAlias(version1);
  const resolved2 = resolveVersionAlias(version2);

  return resolved1 === resolved2;
}

// Helper function to check if navigation is needed when switching versions
export function shouldNavigateForVersionChange(
  currentPathname: string,
  currentDefaultVersion: string,
  selectedVersion: string
): boolean {
  const currentActualVersion = getCurrentVersion(currentPathname, currentDefaultVersion);
  const selectedActualVersion = resolveVersionAlias(selectedVersion);

  // If versions are equivalent, no navigation needed
  if (areVersionsEquivalent(currentActualVersion, selectedActualVersion)) {
    return false;
  }

  // Navigation needed if versions are different
  return true;
}

// Helper function to get version display label by ID
export function getVersionLabel(versionId: string): string {
  const config = getVersionConfig(versionId);
  return config.label;
}

// Helper function to get the appropriate navigation route for after migration
export function getPostMigrationRoute(): string {
  // After migration, navigate to the latest version's root route
  const latestConfig = getVersionConfig('latest');
  const rootRoute = latestConfig.routes.root;

  // Since latest inherits from v5, this should be the React router path
  return rootRoute.path;
}
