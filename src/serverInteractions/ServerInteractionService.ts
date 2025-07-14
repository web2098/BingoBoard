import { HostConnection } from './HostConnection';
import { ClientConnection } from './ClientConnection';
import { GameState, StyleConfig, SessionConfig, AudienceInteractionType, AudienceInteractionOptions } from './types';
import { getSetting } from '../utils/settings';
import {
  getCurrentSession,
  getLastCalledNumbers,
  getLastCalledNumbersReversed,
  getLastCalledNumber
} from '../utils/telemetry';

interface ServerInteractionState {
  // Connection state
  isConnecting: boolean; // New state to track connection attempts
  isConnected: boolean;
  isHost: boolean;
  clientId: string | null;
  roomId: string | null;
  connectionError: string | null;

  // Host-specific state
  hostConnection: HostConnection | null;

  // Client-specific state
  clientConnection: ClientConnection | null;
  lastSetupMessage: any | null;
  lastActivateMessage: any | null;
  lastDeactivateMessage: any | null;
  lastFreeSpaceMessage: any | null;
}

type StateChangeCallback = (state: ServerInteractionState) => void;

class ServerInteractionService {
  private static instance: ServerInteractionService | null = null;
  private state: ServerInteractionState;
  private callbacks: Set<StateChangeCallback> = new Set();

  // Callback props
  private onNumberActivated?: (number: number, totalSpots: number) => void;
  private onNumberDeactivated?: (number: number, totalSpots: number) => void;
  private onFreeSpaceUpdate?: (freeSpaceEnabled: boolean) => void;
  private onAudienceInteraction?: (eventType: string, options: any) => void;
  private onModalDeactivate?: () => void;

  private constructor() {
    this.state = {
      isConnecting: false,
      isConnected: false,
      isHost: false,
      clientId: null,
      roomId: null,
      connectionError: null,
      hostConnection: null,
      clientConnection: null,
      lastSetupMessage: null,
      lastActivateMessage: null,
      lastDeactivateMessage: null,
      lastFreeSpaceMessage: null
    };
  }

  public static getInstance(): ServerInteractionService {
    if (!ServerInteractionService.instance) {
      ServerInteractionService.instance = new ServerInteractionService();
    }
    return ServerInteractionService.instance;
  }

  public static reset(): void {
    if (ServerInteractionService.instance) {
      ServerInteractionService.instance.disconnect();
    }
    ServerInteractionService.instance = null;
  }

  // State management
  private setState(updater: Partial<ServerInteractionState> | ((prev: ServerInteractionState) => ServerInteractionState)): void {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }

    // Notify all subscribed components
    this.callbacks.forEach(callback => callback(this.state));
  }

  public getState(): ServerInteractionState {
    return { ...this.state };
  }

  public subscribe(callback: StateChangeCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // Set callback handlers
  public setCallbacks(callbacks: {
    onNumberActivated?: (number: number, totalSpots: number) => void;
    onNumberDeactivated?: (number: number, totalSpots: number) => void;
    onFreeSpaceUpdate?: (freeSpaceEnabled: boolean) => void;
    onAudienceInteraction?: (eventType: string, options: any) => void;
    onModalDeactivate?: () => void;
  }): void {
    this.onNumberActivated = callbacks.onNumberActivated;
    this.onNumberDeactivated = callbacks.onNumberDeactivated;
    this.onFreeSpaceUpdate = callbacks.onFreeSpaceUpdate;
    this.onAudienceInteraction = callbacks.onAudienceInteraction;
    this.onModalDeactivate = callbacks.onModalDeactivate;
  }

  // Helper functions
  private buildGameStateFromTelemetry(): GameState | null {
    const currentSession = getCurrentSession();
    if (!currentSession) return null;

    return {
      name: currentSession.gameName,
      freeSpaceOn: currentSession.freeSpace,
      calledNumbers: getLastCalledNumbersReversed(),
      lastNumber: getLastCalledNumber() || undefined
    };
  }

  private buildStyleConfig(): StyleConfig {
    return {
      selectedColor: getSetting('boardHighlightColor', '#1e4d2b'),
      selectedTextColor: getSetting('highlightTextColor', '#ffffff'),
      unselectedColor: getSetting('backgroundColor', '#ffffff'),
      unselectedTextColor: getSetting('textColor', '#000000')
    };
  }

  private buildSessionConfig(): SessionConfig {
    return {
      specialNumbers: JSON.parse(localStorage.getItem('specialNumbers') || '{}')
    };
  }

  // Message handler
  private handleMessage = (message: any): void => {
    console.log("Handle message server interaction service");
    console.log('Received message:', message);
    switch (message.type) {
      case 'id':
        this.setState({ clientId: message.client_id });
        break;

      case 'setup':
        console.log('Received setup message:', message);
        this.setState({ lastSetupMessage: message });
        break;

      case 'activate':
        this.setState({ lastActivateMessage: message });

        const currentCalledNumbers = getLastCalledNumbers();
        const expectedSpotsAfterActivate = currentCalledNumbers.includes(message.id)
          ? currentCalledNumbers.length
          : currentCalledNumbers.length + 1;

        if (message.spots !== expectedSpotsAfterActivate && this.state.clientConnection) {
          console.log(`Spots mismatch on activate: server=${message.spots}, expected=${expectedSpotsAfterActivate}. Requesting update.`);
          this.state.clientConnection.requestUpdate();
        }

        if (this.onNumberActivated) {
          this.onNumberActivated(message.id, message.spots);
        }
        break;

      case 'deactivate':
        this.setState({ lastDeactivateMessage: message });

        const currentCalledNumbersForDeactivate = getLastCalledNumbers();
        const expectedSpotsAfterDeactivate = currentCalledNumbersForDeactivate.includes(message.id)
          ? currentCalledNumbersForDeactivate.length - 1
          : currentCalledNumbersForDeactivate.length;

        if (message.spots !== expectedSpotsAfterDeactivate && this.state.clientConnection) {
          console.log(`Spots mismatch on deactivate: server=${message.spots}, expected=${expectedSpotsAfterDeactivate}. Requesting update.`);
          this.state.clientConnection.requestUpdate();
        }

        if (this.onNumberDeactivated) {
          this.onNumberDeactivated(message.id, message.spots);
        }
        break;

      case 'update_free':
        this.setState({ lastFreeSpaceMessage: message });

        if (this.onFreeSpaceUpdate) {
          this.onFreeSpaceUpdate(message.free);
        }
        break;

      case 'modal_activate':
        if (this.onAudienceInteraction) {
          this.onAudienceInteraction(message.event_type, message.options);
        }
        break;

      case 'modal_deactivate':
        console.log('Received modal_deactivate message');
        if (this.onModalDeactivate) {
          console.log('Calling onModalDeactivate callback');
          this.onModalDeactivate();
        } else {
          console.log('No onModalDeactivate callback set');
        }
        break;

      case 'update':
        console.log('This is an update message');
        if (this.state.isHost && this.state.hostConnection) {
          const gameState = this.buildGameStateFromTelemetry();
          const styleConfig = this.buildStyleConfig();
          const sessionConfig = this.buildSessionConfig();

          if (gameState) {
            this.state.hostConnection.sendGameSetupToClient(
              message.client_id,
              gameState,
              styleConfig,
              sessionConfig
            );
          }
          else
          {
            console.log("No game state");
          }
        }
        else{
            console.log(`IsHost ${this.state.isHost} HostConnection ${this.state.hostConnection}`);
        }
        break;
    }
  };

  private handleError = (error: Error): void => {
    console.error('Server interaction error:', error);
    this.setState({
      connectionError: error.message,
      isConnecting: false,
      isConnected: false,
      hostConnection: null,
      clientConnection: null
    });
  };

  private handleOpen = (): void => {
    this.setState({
      isConnecting: false,
      isConnected: true,
      connectionError: null
    });
  };

  private handleClose = (): void => {
    this.setState({
      isConnecting: false,
      isConnected: false,
      hostConnection: null,
      clientConnection: null
    });
  };

  // Public API methods
  public async hostRoom(serverUrl: string, authToken: string): Promise<boolean> {
    try {
      const connection = new HostConnection({
        serverUrl,
        authToken,
        onMessage: this.handleMessage,
        onError: this.handleError,
        onOpen: this.handleOpen,
        onClose: this.handleClose,
        connectionTimeout: 5000
      });

      await connection.hostRoom();

      this.setState({
        hostConnection: connection,
        isHost: true,
        roomId: connection.getRoomId(),
        connectionError: null
      });

      return true;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  public async joinRoom(serverUrl: string, roomId: string): Promise<boolean> {
    try {
      const connection = new ClientConnection({
        serverUrl,
        roomId,
        onMessage: this.handleMessage,
        onError: this.handleError,
        onOpen: this.handleOpen,
        onClose: this.handleClose,
        connectionTimeout: 5000
      });

      const success = await connection.connectToRoom();
      if (success) {
        this.setState({
          clientConnection: connection,
          isHost: false,
          roomId,
          connectionError: null
        });
      }
      return success;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  public sendGameSetup(gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.sendGameSetup(gameState, styleConfig, sessionConfig);
    }
  }

  public sendNumberActivated(number: number, totalSpots: number): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.sendNumberActivated(number, totalSpots);
    }
  }

  public sendNumberDeactivated(number: number, totalSpots: number): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.sendNumberDeactivated(number, totalSpots);
    }
  }

  public sendFreeSpaceUpdate(freeSpaceEnabled: boolean): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.sendFreeSpaceUpdate(freeSpaceEnabled);
    }
  }

  public sendAudienceInteraction(eventType: AudienceInteractionType, options: AudienceInteractionOptions = {}): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.sendAudienceInteraction(eventType, options);
    }
  }

  public sendModalDeactivate(): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.sendModalDeactivate();
    }
  }

  public requestUpdate(): void {
    if (this.state.clientConnection) {
      this.state.clientConnection.requestUpdate();
    }
  }

  public disconnect(): void {
    if (this.state.hostConnection) {
      this.state.hostConnection.disconnect();
    }
    if (this.state.clientConnection) {
      this.state.clientConnection.disconnect();
    }
    this.setState({
      isConnecting: false,
      isConnected: false,
      hostConnection: null,
      clientConnection: null,
      clientId: null,
      roomId: null,
      isHost: false,
      lastSetupMessage: null,
      lastActivateMessage: null,
      lastDeactivateMessage: null,
      lastFreeSpaceMessage: null
    });
  }

  public clearError(): void {
    this.setState({ connectionError: null });
  }

  // Auto-connection functionality
  public async autoConnect(): Promise<void> {
    // Don't auto-connect if already connected
    if (this.state.isConnecting){
        return;
    }
    this.state.isConnecting = true;

    if (this.state.isConnected || this.state.hostConnection || this.state.clientConnection) {
      return;
    }

    const serverUrl = getSetting('serverUrl', '');
    const authToken = getSetting('serverAuthToken', '');

    // Don't auto-connect if no server URL is configured
    if (!serverUrl.trim()) {
      console.log('No server URL configured, skipping auto-connect');
      return;
    }

    // Check if this is a client connection from QR code scanning
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');

    // Check if we're on the client page - if so, don't auto-connect as host
    const isClientPage = window.location.pathname.includes('/client');

    if (roomId && !isClientPage) {
      // This would be a client connection, but we're not on client page
      console.log('Room ID detected but not on client page, skipping auto-connect');
      return;
    } else if (!roomId && !isClientPage) {
      // This is a host connection
      if (authToken.trim()) {
        console.log('Auto-connecting as host to server:', serverUrl);
        try {
          await this.hostRoom(serverUrl, authToken);
          console.log('Auto-connect as host successful');
        } catch (error) {
          console.error('Auto-connect as host failed:', error);
        }
      } else {
        console.log('No auth token configured, skipping host auto-connect');
      }
    }
  }

  // Start auto-connection with retry logic
  public startAutoConnect(retryIntervalSeconds: number = 10): () => void {
    // Initial connection attempt
    this.autoConnect();

    // Set up retry interval
    const retryInterval = setInterval(() => {
      this.autoConnect();
    }, retryIntervalSeconds * 1000);

    // Return cleanup function
    return () => {
      clearInterval(retryInterval);
    };
  }
}

// Export convenience functions
export const getServerInteractionService = () => ServerInteractionService.getInstance();
export const resetServerInteractionService = () => ServerInteractionService.reset();

// Initialize the service early (optional)
export const initializeServerInteraction = () => {
  const service = ServerInteractionService.getInstance();
  console.log('ServerInteractionService initialized');
  return service;
};

export default ServerInteractionService;
