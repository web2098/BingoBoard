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
    // Request current game state after connection
    this.requestUpdate();
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

  protected handleMessage(message: any): void {
    super.handleMessage(message);

    // Handle client-specific messages
    switch (message.type) {
      case 'setup':
        console.log('Received game setup:', message.data);
        break;
      case 'activate':
        console.log(`Number ${message.id} activated (${message.spots} total)`);
        break;
      case 'deactivate':
        console.log(`Number ${message.id} deactivated (${message.spots} total)`);
        break;
      case 'update_free':
        console.log(`Free space updated: ${message.free}`);
        break;
      case 'modal_activate':
        console.log(`Audience interaction: ${message.event_type}`, message.options);
        break;
    }
  }
}
