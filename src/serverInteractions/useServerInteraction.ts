import { useState, useEffect, useCallback } from 'react';
import ServerInteractionService from './ServerInteractionService';
import { GameState, StyleConfig, SessionConfig, AudienceInteractionType, AudienceInteractionOptions } from './types';

interface UseServerInteractionOptions {
  onNumberActivated?: (number: number, totalSpots: number) => void;
  onNumberDeactivated?: (number: number, totalSpots: number) => void;
  onFreeSpaceUpdate?: (freeSpaceEnabled: boolean) => void;
  onAudienceInteraction?: (eventType: string, options: any) => void;
  onModalDeactivate?: () => void;
  autoConnect?: boolean; // Enable auto-connection
  autoConnectRetryInterval?: number; // Retry interval in seconds
}

export const useServerInteraction = (options: UseServerInteractionOptions = {}) => {
  const service = ServerInteractionService.getInstance();
  const [state, setState] = useState(service.getState());

  // Set up callbacks on the service
  useEffect(() => {
    service.setCallbacks(options);
  }, [service, options]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = service.subscribe(setState);
    return unsubscribe;
  }, [service]);

  // Auto-connection effect
  useEffect(() => {
    if (options.autoConnect) {
      const retryInterval = options.autoConnectRetryInterval || 10;
      const cleanup = service.startAutoConnect(retryInterval);
      return cleanup;
    }
  }, [service, options.autoConnect, options.autoConnectRetryInterval]);

  // Memoized API methods
  const hostRoom = useCallback((serverUrl: string, authToken: string) => {
    return service.hostRoom(serverUrl, authToken);
  }, [service]);

  const joinRoom = useCallback((serverUrl: string, roomId: string) => {
    return service.joinRoom(serverUrl, roomId);
  }, [service]);

  const sendGameSetup = useCallback((gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig) => {
    service.sendGameSetup(gameState, styleConfig, sessionConfig);
  }, [service]);

  const sendNumberActivated = useCallback((number: number, totalSpots: number) => {
    service.sendNumberActivated(number, totalSpots);
  }, [service]);

  const sendNumberDeactivated = useCallback((number: number, totalSpots: number) => {
    service.sendNumberDeactivated(number, totalSpots);
  }, [service]);

  const sendFreeSpaceUpdate = useCallback((freeSpaceEnabled: boolean) => {
    service.sendFreeSpaceUpdate(freeSpaceEnabled);
  }, [service]);

  const sendAudienceInteraction = useCallback((eventType: AudienceInteractionType, options: AudienceInteractionOptions = {}) => {
    service.sendAudienceInteraction(eventType, options);
  }, [service]);

  const sendModalDeactivate = useCallback(() => {
    service.sendModalDeactivate();
  }, [service]);

  const requestUpdate = useCallback(() => {
    service.requestUpdate();
  }, [service]);

  const disconnect = useCallback(() => {
    service.disconnect();
  }, [service]);

  const clearError = useCallback(() => {
    service.clearError();
  }, [service]);

  // Expose auto-connection methods for direct use
  const autoConnect = useCallback(() => service.autoConnect(), [service]);
  const startAutoConnect = useCallback((retryInterval?: number) => service.startAutoConnect(retryInterval), [service]);

  return {
    // State
    ...state,

    // Actions
    hostRoom,
    joinRoom,
    sendGameSetup,
    sendNumberActivated,
    sendNumberDeactivated,
    sendFreeSpaceUpdate,
    sendAudienceInteraction,
    sendModalDeactivate,
    requestUpdate,
    disconnect,
    clearError,

    // Auto-connection methods
    autoConnect,
    startAutoConnect
  };
};
