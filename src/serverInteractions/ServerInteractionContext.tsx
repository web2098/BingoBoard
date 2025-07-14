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
        console.log('Received setup message:', message);
        console.log('Setup data:', message.data);
        console.log('Active numbers:', message.data.active);

        const gameState: GameState = {
          name: message.data.game,
          freeSpaceOn: message.data.free,
          calledNumbers: message.data.active || [],
          lastNumber: message.data.lastNumber
        };

        console.log('Created gameState:', gameState);

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
        // Update internal game state
        setState(prev => {
          if (prev.gameState) {
            const updatedGameState = {
              ...prev.gameState,
              calledNumbers: prev.gameState.calledNumbers.includes(message.id)
                ? prev.gameState.calledNumbers
                : [...prev.gameState.calledNumbers, message.id],
              lastNumber: message.id
            };
            return { ...prev, gameState: updatedGameState };
          }
          return prev;
        });

        if (onNumberActivated) {
          onNumberActivated(message.id, message.spots);
        }
        break;

      case 'deactivate':
        // Update internal game state
        setState(prev => {
          if (prev.gameState) {
            const updatedCalledNumbers = prev.gameState.calledNumbers.filter(n => n !== message.id);
            const updatedGameState = {
              ...prev.gameState,
              calledNumbers: updatedCalledNumbers,
              lastNumber: updatedCalledNumbers.length > 0 ? updatedCalledNumbers[updatedCalledNumbers.length - 1] : undefined
            };
            return { ...prev, gameState: updatedGameState };
          }
          return prev;
        });

        if (onNumberDeactivated) {
          onNumberDeactivated(message.id, message.spots);
        }
        break;

      case 'update_free':
        // Update internal game state
        setState(prev => {
          if (prev.gameState) {
            const updatedGameState = {
              ...prev.gameState,
              freeSpaceOn: message.free
            };
            return { ...prev, gameState: updatedGameState };
          }
          return prev;
        });

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
        console.log('Received update request from client:', message.client_id);
        const currentState = connectionStateRef.current;
        console.log('Current state for update:', {
          isHost: currentState.isHost,
          gameState: currentState.gameState,
          hasStyleConfig: !!currentState.styleConfig,
          hasSessionConfig: !!currentState.sessionConfig
        });

        if (currentState.isHost && currentState.gameState && currentState.styleConfig && currentState.sessionConfig) {
          console.log('Sending game setup to client:', message.client_id);
          console.log('Game state being sent:', currentState.gameState);
          // Re-send current state to requesting client
          currentState.hostConnection?.sendGameSetupToClient(
            message.client_id,
            currentState.gameState,
            currentState.styleConfig,
            currentState.sessionConfig
          );

          // Notify the app that a client requested an update
          if (onGameStateUpdate) {
            onGameStateUpdate(currentState.gameState, currentState.styleConfig, currentState.sessionConfig);
          }
        } else {
          console.log('Cannot send update - missing state:', {
            isHost: currentState.isHost,
            hasGameState: !!currentState.gameState,
            hasStyleConfig: !!currentState.styleConfig,
            hasSessionConfig: !!currentState.sessionConfig
          });
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

  //Auto-connect effect with configurable retry interval
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

      // Check if we're on the client page - if so, don't auto-connect
      const isClientPage = window.location.pathname.includes('/client');

      if (roomId && !isClientPage) {
        // This is a client joining via QR code (but not on the dedicated client page)
        console.log('Auto-connecting as client to room:', roomId);
        joinRoom(serverUrl, roomId);
      } else if (!roomId && !isClientPage) {
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
