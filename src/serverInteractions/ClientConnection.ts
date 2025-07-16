import { ServerConnection } from './ServerConnection';
import {
  ClientConnectionConfig,
  ClientUpdateMessage
} from './types';

export class ClientConnection extends ServerConnection {
  private clientConfig: ClientConnectionConfig;
  private roomId: string;

  constructor(config: ClientConnectionConfig) {
    super(config);
    this.clientConfig = config;
    this.roomId = config.roomId;
  }

  public async connectToRoom(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } catch (error) {
      console.error('Error connecting to room:', error);
      this.config.onError(error as Error);
      return false;
    }
  }

  protected buildWebSocketUrl(): string {
    // Handle different URL schemes properly
    let serverUrl = this.clientConfig.serverUrl;

    // Remove trailing slash if present
    serverUrl = serverUrl.replace(/\/$/, '');

    // If no scheme is provided, assume wss://
    if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://') &&
        !serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      serverUrl = `wss://${serverUrl}`;
    }

    // Convert to WebSocket scheme
    const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');

    return `${wsUrl}/join/${this.roomId}`;
  }

  protected onOpen(): void {
    // If we already have a client ID from session storage, request update directly
    // Otherwise, request a new client ID first
    this.requestClientId();
  }

  public requestClientId(): void {
    const message = {
      type: "request_id"
    };
    this.sendMessage(message);
  }

  public requestUpdate(): void {
    if (!this.clientId) {
      // If we don't have a client ID yet, wait a moment and try again
      setTimeout(() => this.requestUpdate(), 100);
      return;
    }

    const message: ClientUpdateMessage = {
      type: "update",
      client_id: this.clientId
    };
    this.sendMessage(message);
  }

  public setRoomId(roomId: string): void {
    this.roomId = roomId;
    this.clientConfig.roomId = roomId;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public clearStoredClientId(): void {
    console.log('Clearing stored client ID');
    sessionStorage.removeItem('bingo_client_id');
    this.clientId = null;
  }

  public getStoredClientId(): string | null {
    return sessionStorage.getItem('bingo_client_id');
  }

  protected handleMessage(message: any): void {
    //console.log('Received message:', message);
    super.handleMessage(message);

    // // Handle client-specific messages
    switch (message.type) {
      case 'id':
        this.clientId = message.conn_id;
        // Now request the current game state
        this.requestUpdate();
        break;
    //   case 'setup':
    //     console.log('Received game setup:', message.data);
    //     break;
    //   case 'activate':
    //     console.log(`Number ${message.id} activated (${message.spots} total)`);
    //     break;
    //   case 'deactivate':
    //     console.log(`Number ${message.id} deactivated (${message.spots} total)`);
    //     break;
    //   case 'update_free':
    //     console.log(`Free space updated: ${message.free}`);
    //     break;
    //   case 'modal_activate':
    //     console.log(`Audience interaction: ${message.event_type}`, message.options);
    //     break;
    }
  }
}
