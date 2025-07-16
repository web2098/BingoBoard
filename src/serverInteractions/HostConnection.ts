import { ServerConnection } from './ServerConnection';
import {
  HostConnectionConfig,
  HostAuthResponse,
  RequestIdMessage,
  ActivateMessage,
  DeactivateMessage,
  UpdateFreeMessage,
  ModalActivateMessage,
  ModalDeactivateMessage,
  GameState,
  StyleConfig,
  SessionConfig,
  AudienceInteractionType,
  AudienceInteractionOptions
} from './types';

export class HostConnection extends ServerConnection {
  private auth: HostAuthResponse | null = null;
  private hostConfig: HostConnectionConfig;

  constructor(config: HostConnectionConfig) {
    super(config);
    this.hostConfig = config;
  }

  public async hostRoom(): Promise<void> {

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Request timed out"), 5000);

    try {
      // Handle different URL schemes properly
      let serverUrl = this.hostConfig.serverUrl;

      // Remove trailing slash if present
      serverUrl = serverUrl.replace(/\/$/, '');

      // If no scheme is provided, assume wss://
      if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://') &&
          !serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
        serverUrl = `wss://${serverUrl}`;
      }

      // Convert to HTTP(S) for the REST API call
      const httpUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');

      const response = await fetch(`${httpUrl}/host`, {
        method: 'GET',
        headers: {
          'Authorization': this.hostConfig.authToken
        },
        credentials: 'include',
        signal: controller.signal
      });

      console.log("Fetch finished");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.auth = await response.json();
      console.log('Room hosted successfully:', this.auth);

      // Now connect to the WebSocket
      await this.connect();

    } catch (error) {
      console.error('Error hosting room:', typeof error);

      // Ensure connection state is cleared on any error
      this.auth = null;

      // Re-throw the error instead of calling onError
      throw new Error(`${error}`);
    } finally {
      // Always clear the timeout
      clearTimeout(timeoutId);
    }
  }

  protected buildWebSocketUrl(): string {
    if (!this.auth) {
      throw new Error('Must call hostRoom() before connecting');
    }

    // Handle different URL schemes properly
    let serverUrl = this.hostConfig.serverUrl;

    // Remove trailing slash if present
    serverUrl = serverUrl.replace(/\/$/, '');

    // If no scheme is provided, assume wss://
    if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://') &&
        !serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      serverUrl = `wss://${serverUrl}`;
    }

    // Convert to WebSocket scheme
    const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');

    return `${wsUrl}/start/${this.auth.room_id}?room_token=${this.auth.room_token}`;
  }

  protected onOpen(): void {
    // Request client ID after connection
    this.requestId();
  }

  public requestId(): void {
    const message: RequestIdMessage = {
      type: "request_id"
    };
    this.sendMessage(message);
  }

  public sendGameSetup(gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig): void {
    const message = {
      type: "setup",
      data: {
        game: gameState.name,
        free: gameState.freeSpaceOn,
        active: gameState.calledNumbers,
        lastNumber: gameState.lastNumber
      },
      style: {
        selectedColor: styleConfig.selectedColor,
        selectedTextColor: styleConfig.selectedTextColor,
        unselectedColor: styleConfig.unselectedColor,
        unselectedTextColor: styleConfig.unselectedTextColor,
      },
      session: {
        numbers: sessionConfig.specialNumbers
      }
    };
    console.log(`Sending game setup to all clients:`, message);
    this.sendMessage(message);
  }

  public sendGameSetupToClient(clientId: string, gameState: GameState, styleConfig: StyleConfig, sessionConfig: SessionConfig): void {
    const message = {
      type: "setup",
      client_id: clientId,
      data: {
        game: gameState.name,
        free: gameState.freeSpaceOn,
        active: gameState.calledNumbers,
        lastNumber: gameState.lastNumber
      },
      style: {
        selectedColor: styleConfig.selectedColor,
        selectedTextColor: styleConfig.selectedTextColor,
        unselectedColor: styleConfig.unselectedColor,
        unselectedTextColor: styleConfig.unselectedTextColor,
      },
      session: {
        numbers: sessionConfig.specialNumbers
      }
    };
    console.log(`Sending game setup to client ${clientId}:`, message);
    this.sendMessage(message);
  }

  public sendNumberActivated(number: number, totalSpots: number): void {
    const message: ActivateMessage = {
      type: "activate",
      id: number,
      spots: totalSpots
    };
    this.sendMessage(message);
  }

  public sendNumberDeactivated(number: number, totalSpots: number): void {
    const message: DeactivateMessage = {
      type: "deactivate",
      id: number,
      spots: totalSpots
    };
    this.sendMessage(message);
  }

  public sendFreeSpaceUpdate(freeSpaceEnabled: boolean): void {
    const message: UpdateFreeMessage = {
      type: "update_free",
      free: freeSpaceEnabled
    };
    this.sendMessage(message);
  }

  public sendAudienceInteraction(eventType: AudienceInteractionType, options: AudienceInteractionOptions = {}): void {
    const message: ModalActivateMessage = {
      type: "modal_activate",
      event_type: eventType,
      options: options
    };
    this.sendMessage(message);
  }

  public sendModalDeactivate(): void {
    console.log('HostConnection: Sending modal_deactivate message');
    const message: ModalDeactivateMessage = {
      type: "modal_deactivate"
    };
    this.sendMessage(message);
  }

  public getRoomId(): string | null {
    return this.auth?.room_id || null;
  }

  public getRoomToken(): string | null {
    return this.auth?.room_token || null;
  }

  protected handleMessage(message: any): void {
    super.handleMessage(message);
  }
}
