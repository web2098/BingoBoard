import { ServerConnectionConfig } from './types';

export class ServerConnection {
  protected ws: WebSocket | null = null;
  protected config: ServerConnectionConfig;
  protected clientId: string | null = null;
  protected retryTime: number = 1000;
  protected maxRetryTime: number = 30000;
  protected isConnecting: boolean = false;
  protected shouldReconnect: boolean = true;
  protected connectionTimeoutId: NodeJS.Timeout | null = null;

  constructor(config: ServerConnectionConfig) {
    this.config = config;
  }

  protected async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.buildWebSocketUrl();
      console.log('Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      // Set up connection timeout (default 5 seconds)
      const timeoutMs = this.config.connectionTimeout || 5000;
      this.connectionTimeoutId = setTimeout(() => {
        if (this.isConnecting && this.ws) {
          console.log(`Connection timeout after ${timeoutMs}ms`);
          this.ws.close();
          this.isConnecting = false;

          const timeoutError = new Error(`Connection timeout after ${timeoutMs}ms`);
          this.config.onError(timeoutError);

          if (this.shouldReconnect) {
            console.log('Retrying connection due to timeout');
            this.retryConnection();
          }
        }
      }, timeoutMs);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.retryTime = 1000; // Reset retry time on successful connection

        // Clear the timeout since connection succeeded
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }

        this.onOpen();
        if (this.config.onOpen) {
          this.config.onOpen();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;

        // Clear the timeout since connection failed
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }

        const wsError = new Error('WebSocket connection error');
        this.config.onError(wsError);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;

        // Clear the timeout since connection closed
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }

        if (this.config.onClose) {
          this.config.onClose();
        }

        if (this.shouldReconnect && event.code !== 1000) { // 1000 = normal closure
          console.log('Retrying connection after close');
          this.retryConnection();
        }
      };

    } catch (error) {
      this.isConnecting = false;

      // Clear the timeout since connection failed
      if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
      }

      this.config.onError(error as Error);

      if (this.shouldReconnect) {
        console.log('Retrying connection due to error');
        this.retryConnection();
      }
    }
  }

  protected buildWebSocketUrl(): string {
    // Override in subclasses
    throw new Error('buildWebSocketUrl must be implemented by subclass');
  }

  protected onOpen(): void {
    // Override in subclasses for connection-specific initialization
  }

  protected handleMessage(message: any): void {
    if (message.type === 'id') {
      this.clientId = message.conn_id;
      console.log('Received client ID:', this.clientId);
    }

    this.config.onMessage(message);
  }

  protected retryConnection(): void {
    console.log(`Retrying connection in ${this.retryTime / 1000} seconds...`);

    setTimeout(() => {
      console.log(`Adjust retry time from ${this.retryTime}ms to ${Math.min(this.retryTime * 2, this.maxRetryTime)}ms`);
      if (this.retryTime < this.maxRetryTime) {
        this.retryTime *= 2; // Exponential backoff
      }
      this.connect();
    }, this.retryTime);
  }

  public sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log('Sending message:', messageStr);
      this.ws.send(messageStr);
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  public getClientId(): string | null {
    return this.clientId;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public disconnect(): void {
    this.shouldReconnect = false;

    // Clear any pending connection timeout
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
  }
}
