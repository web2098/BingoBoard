import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { HostConnection } from './HostConnection';
import { ClientConnection } from './ClientConnection';
import { GameState, StyleConfig, SessionConfig, AudienceInteractionType, AudienceInteractionOptions } from './types';
import { getSetting } from '../utils/settings';

interface ServerInteractionState {
  // Connection state
  isConnected: boolean;
  isHost: boolean;
  clientId: string | null;
  roomId: string | null;
  connectionError: string | null;

  // Host-specific state
  hostConnection: HostConnection | null;

  // Client-specific state
  clientConnection: ClientConnection | null;
  gameState: GameState | null;
  styleConfig: StyleConfig | null;
  sessionConfig: SessionConfig | null;
}

interface ServerInteractionActions {
  // Host actions
  hostRoom: (serverUrl: string, authToken: string) => Promise<boolean>;
  sendGameSetup: (gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig) => void;
  sendNumberActivated: (number: number, totalSpots: number) => void;
  sendNumberDeactivated: (number: number, totalSpots: number) => void;
  sendFreeSpaceUpdate: (freeSpaceEnabled: boolean) => void;
  sendAudienceInteraction: (eventType: AudienceInteractionType, options?: AudienceInteractionOptions) => void;

  // Client actions
  joinRoom: (serverUrl: string, roomId: string) => Promise<boolean>;
  requestUpdate: () => void;

  // Common actions
  disconnect: () => void;
  clearError: () => void;
}

type ServerInteractionContextType = ServerInteractionState & ServerInteractionActions;

const ServerInteractionContext = createContext<ServerInteractionContextType | undefined>(undefined);

export const useServerInteraction = () => {
  const context = useContext(ServerInteractionContext);
  if (context === undefined) {
    throw new Error('useServerInteraction must be used within a ServerInteractionProvider');
  }
  return context;
};

interface ServerInteractionProviderProps {
  children: ReactNode;
  onGameStateUpdate?: (gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig) => void;
  onNumberActivated?: (number: number, totalSpots: number) => void;
  onNumberDeactivated?: (number: number, totalSpots: number) => void;
  onFreeSpaceUpdate?: (freeSpaceEnabled: boolean) => void;
  onAudienceInteraction?: (eventType: string, options: any) => void;
}

export const ServerInteractionProvider: React.FC<ServerInteractionProviderProps> = ({
  children,
  onGameStateUpdate,
  onNumberActivated,
  onNumberDeactivated,
  onFreeSpaceUpdate,
  onAudienceInteraction
}) => {
  const [state, setState] = useState<ServerInteractionState>({
    isConnected: false,
    isHost: false,
    clientId: null,
    roomId: null,
    connectionError: null,
    hostConnection: null,
    clientConnection: null,
    gameState: null,
    styleConfig: null,
    sessionConfig: null
  });

  // Use ref to track connection state to avoid effect re-triggering
  const connectionStateRef = useRef(state);

  // Update ref when state changes
  useEffect(() => {
    connectionStateRef.current = state;
  }, [state]);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'id':
        setState(prev => ({ ...prev, clientId: message.client_id }));
        break;

      case 'setup':
        const gameState: GameState = {
          name: message.data.game,
          freeSpaceOn: message.data.free,
          calledNumbers: message.data.active,
          lastNumber: message.data.lastNumber
        };
        setState(prev => ({
          ...prev,
          gameState,
          styleConfig: message.style,
          sessionConfig: { specialNumbers: message.session.numbers }
        }));
        if (onGameStateUpdate) {
          onGameStateUpdate(gameState, message.style, { specialNumbers: message.session.numbers });
        }
        break;

      case 'activate':
        if (onNumberActivated) {
          onNumberActivated(message.id, message.spots);
        }
        break;

      case 'deactivate':
        if (onNumberDeactivated) {
          onNumberDeactivated(message.id, message.spots);
        }
        break;

      case 'update_free':
        if (onFreeSpaceUpdate) {
          onFreeSpaceUpdate(message.free);
        }
        break;

      case 'modal_activate':
        if (onAudienceInteraction) {
          onAudienceInteraction(message.event_type, message.options);
        }
        break;

      case 'update':
        // Host received update request from client
        const currentState = connectionStateRef.current;
        if (currentState.isHost && onGameStateUpdate && currentState.gameState && currentState.styleConfig && currentState.sessionConfig) {
          // Re-send current state to requesting client
          currentState.hostConnection?.sendGameSetupToClient(
            message.client_id,
            currentState.gameState,
            currentState.styleConfig,
            currentState.sessionConfig
          );
        }
        break;
    }
  }, [onGameStateUpdate, onNumberActivated, onNumberDeactivated, onFreeSpaceUpdate, onAudienceInteraction]);

  const handleError = useCallback((error: Error) => {
    console.error('Server interaction error:', error);
    setState(prev => ({
      ...prev,
      connectionError: error.message,
      isConnected: false,
      hostConnection: null,
      clientConnection: null
    }));
  }, []);

  const handleOpen = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      connectionError: null
    }));
  }, []);

  const handleClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      hostConnection: null,
      clientConnection: null
    }));
  }, []);

  const hostRoom = useCallback(async (serverUrl: string, authToken: string): Promise<boolean> => {
    try {
      // Set connecting state
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionError: null
      }));

      const connection = new HostConnection({
        serverUrl,
        authToken,
        onMessage: handleMessage,
        onError: handleError,
        onOpen: handleOpen,
        onClose: handleClose,
        connectionTimeout: 5000
      });

      console.log("await connection.hostRoom()");
      await connection.hostRoom();

      console.log("SUCCESS");
      setState(prev => ({
        ...prev,
        hostConnection: connection,
        isHost: true,
        roomId: connection.getRoomId(),
        connectionError: null
      }));

      return true;
    } catch (error) {
      console.log("Exception:", error);
      handleError(error as Error);
      return false;
    }
  }, [handleMessage, handleError, handleOpen, handleClose]);

  const joinRoom = useCallback(async (serverUrl: string, roomId: string): Promise<boolean> => {
    try {
      const connection = new ClientConnection({
        serverUrl,
        roomId,
        onMessage: handleMessage,
        onError: handleError,
        onOpen: handleOpen,
        onClose: handleClose,
        connectionTimeout: 5000
      });

      const success = await connection.connectToRoom();
      if (success) {
        setState(prev => ({
          ...prev,
          clientConnection: connection,
          isHost: false,
          roomId,
          connectionError: null
        }));
      }
      return success;
    } catch (error) {
      handleError(error as Error);
      return false;
    }
  }, [handleMessage, handleError, handleOpen, handleClose]);

  // Auto-connect effect with configurable retry interval
  useEffect(() => {
    const serverUrl = getSetting('serverUrl', '');
    const authToken = getSetting('serverAuthToken', '');
    const retryIntervalSeconds = getSetting('connectionTimeout', 10);

    // Don't auto-connect if no server URL is configured
    if (!serverUrl.trim()) return;

    const attemptConnection = () => {
      // Only attempt connection if not already connected
      const currentState = connectionStateRef.current;
      if (currentState.isConnected || currentState.hostConnection || currentState.clientConnection) return;

      // Check if this is a client connection from QR code scanning
      const urlParams = new URLSearchParams(window.location.search);
      const roomId = urlParams.get('roomId');

      if (roomId) {
        // This is a client joining via QR code
        console.log('Auto-connecting as client to room:', roomId);
        joinRoom(serverUrl, roomId);
      } else {
        // This is a host connection
        if (authToken.trim()) {
          console.log('Auto-connecting as host to server:', serverUrl);
          hostRoom(serverUrl, authToken);
        }
      }
    };

    // Initial connection attempt
    attemptConnection();

    // Set up retry interval (configurable seconds)
    const retryInterval = setInterval(() => {
      attemptConnection();
    }, retryIntervalSeconds * 1000);

    return () => {
      clearInterval(retryInterval);
    };
  }, [hostRoom, joinRoom]);

  const sendGameSetup = useCallback((gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig) => {
    const currentState = connectionStateRef.current;
    if (currentState.hostConnection) {
      currentState.hostConnection.sendGameSetup(gameState, styleConfig, sessionConfig);
      setState(prev => ({ ...prev, gameState, styleConfig, sessionConfig }));
    }
  }, []);

  const sendNumberActivated = useCallback((number: number, totalSpots: number) => {
    const currentState = connectionStateRef.current;
    if (currentState.hostConnection) {
      currentState.hostConnection.sendNumberActivated(number, totalSpots);
    }
  }, []);

  const sendNumberDeactivated = useCallback((number: number, totalSpots: number) => {
    const currentState = connectionStateRef.current;
    if (currentState.hostConnection) {
      currentState.hostConnection.sendNumberDeactivated(number, totalSpots);
    }
  }, []);

  const sendFreeSpaceUpdate = useCallback((freeSpaceEnabled: boolean) => {
    const currentState = connectionStateRef.current;
    if (currentState.hostConnection) {
      currentState.hostConnection.sendFreeSpaceUpdate(freeSpaceEnabled);
    }
  }, []);

  const sendAudienceInteraction = useCallback((eventType: AudienceInteractionType, options: AudienceInteractionOptions = {}) => {
    const currentState = connectionStateRef.current;
    if (currentState.hostConnection) {
      currentState.hostConnection.sendAudienceInteraction(eventType, options);
    }
  }, []);

  const requestUpdate = useCallback(() => {
    const currentState = connectionStateRef.current;
    if (currentState.clientConnection) {
      currentState.clientConnection.requestUpdate();
    }
  }, []);

  const disconnect = useCallback(() => {
    const currentState = connectionStateRef.current;
    if (currentState.hostConnection) {
      currentState.hostConnection.disconnect();
    }
    if (currentState.clientConnection) {
      currentState.clientConnection.disconnect();
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      hostConnection: null,
      clientConnection: null,
      clientId: null,
      roomId: null,
      gameState: null,
      styleConfig: null,
      sessionConfig: null,
      isHost: false
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, connectionError: null }));
  }, []);

  const contextValue: ServerInteractionContextType = {
    ...state,
    hostRoom,
    joinRoom,
    sendGameSetup,
    sendNumberActivated,
    sendNumberDeactivated,
    sendFreeSpaceUpdate,
    sendAudienceInteraction,
    requestUpdate,
    disconnect,
    clearError
  };

  return (
    <ServerInteractionContext.Provider value={contextValue}>
      {children}
    </ServerInteractionContext.Provider>
  );
};
