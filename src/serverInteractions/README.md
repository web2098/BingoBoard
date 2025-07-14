# Server Interactions - V5

This module handles all server communication for the Bingo Board application, including hosting rooms and client connections.

# Server Interactions - V5

This module handles all server communication for the Bingo Board application, including hosting rooms and client connections.

## Architecture

- **ServerInteractionService**: Singleton service for managing all server connections and state
- **useServerInteraction**: React hook providing access to the server interaction service
- **HostConnection**: Host-specific functionality for managing rooms
- **ClientConnection**: Client-specific functionality for joining rooms
- **MessageTypes**: TypeScript interfaces for all message types

## Usage

### In React Components

```typescript
import { useServerInteraction } from './serverInteractions/useServerInteraction';

const MyComponent = () => {
  const {
    isConnected,
    hostRoom,
    sendGameSetup,
    // ... other methods
  } = useServerInteraction({
    onNumberActivated: (number, spots) => {
      // Handle number activation
    }
  });

  // Use the service methods...
};
```

### Direct Service Access

```typescript
import { getServerInteractionService } from './serverInteractions/ServerInteractionService';

const service = getServerInteractionService();
const state = service.getState();
await service.hostRoom(serverUrl, authToken);
```

## Message Types

### Host Messages (Outgoing)

#### `request_id`
Request a unique client ID from the server.
```typescript
{
  type: "request_id"
}
```

#### `setup`
Send current game state to clients.
```typescript
{
  type: "setup",
  data: {
    game: string,           // Current game name
    free: boolean,          // Free space enabled
    active: number[],       // Called numbers
    lastNumber: number      // Most recently called number
  },
  style: {
    selectedColor: string,
    selectedTextColor: string,
    unselectedColor: string,
    unselectedTextColor: string
  },
  session: {
    numbers: Record<number, string>  // Special number messages
  }
}
```

#### `activate`
Notify clients that a number was called.
```typescript
{
  type: "activate",
  id: number,              // Number that was called
  spots: number            // Total numbers called so far
}
```

#### `deactivate`
Notify clients that a number was uncalled.
```typescript
{
  type: "deactivate",
  id: number,              // Number that was uncalled
  spots: number            // Total numbers called after removal
}
```

#### `update_free`
Update free space setting for all clients.
```typescript
{
  type: "update_free",
  free: boolean            // New free space setting
}
```

#### `modal_activate`
Trigger audience interaction modal on all clients.
```typescript
{
  type: "modal_activate",
  event_type: string,      // Type of interaction (clap, boo, etc.)
  options: {
    font_size?: string,
    isGraphic?: boolean,
    [key: string]: any
  }
}
```

### Host Messages (Incoming)

#### `id`
Server assigns a unique ID to the host.
```typescript
{
  type: "id",
  client_id: string        // Unique identifier for this host
}
```

#### `update`
Request for status update from specific client.
```typescript
{
  type: "update",
  client_id: string        // ID of client requesting update
}
```

### Client Messages (Outgoing)

#### `update`
Request current game state from host.
```typescript
{
  type: "update",
  client_id: string        // Client's unique ID
}
```

### Client Messages (Incoming)

#### `id`
Server assigns a unique ID to the client.
```typescript
{
  type: "id",
  client_id: string        // Unique identifier for this client
}
```

#### `setup`
Receive current game state from host.
```typescript
{
  type: "setup",
  data: {
    game: string,
    free: boolean,
    active: number[],
    lastNumber: number
  },
  style: {
    selectedColor: string,
    selectedTextColor: string,
    unselectedColor: string,
    unselectedTextColor: string
  },
  session: {
    numbers: Record<number, string>
  }
}
```

#### `activate`
Number was called by host.
```typescript
{
  type: "activate",
  id: number,
  spots: number
}
```

#### `deactivate`
Number was uncalled by host.
```typescript
{
  type: "deactivate",
  id: number,
  spots: number
}
```

#### `update_free`
Free space setting changed.
```typescript
{
  type: "update_free",
  free: boolean
}
```

#### `modal_activate`
Display audience interaction modal.
```typescript
{
  type: "modal_activate",
  event_type: string,
  options: object
}
```

## Connection Flow

### Host Connection
1. Host calls `/host` endpoint with authorization
2. Server returns `room_id` and `room_token`
3. Host connects to WebSocket at `/start/{room_id}?room_token={token}`
4. Host sends `request_id` message
5. Server responds with `id` message containing `client_id`
6. Host can now send game updates to clients

### Client Connection
1. Client scans QR code or enters room ID
2. Client connects to WebSocket at `/join/{room_id}`
3. Client sends `update` message to request current state
4. Host receives `update` message and sends `setup` response
5. Client receives ongoing game updates

## Error Handling

- Automatic reconnection with exponential backoff
- Connection state tracking
- Error callbacks for handling connection failures
- Graceful degradation when server is unavailable

## Usage Examples

### Setting up Host Connection
```typescript
const hostConnection = new HostConnection({
  serverUrl: 'ws://localhost:8080',
  authToken: 'your-auth-token',
  onMessage: (message) => console.log('Received:', message),
  onError: (error) => console.error('Connection error:', error)
});

await hostConnection.connect();
```

### Setting up Client Connection
```typescript
const clientConnection = new ClientConnection({
  serverUrl: 'ws://localhost:8080',
  roomId: 'room-123',
  onMessage: (message) => console.log('Received:', message),
  onError: (error) => console.error('Connection error:', error)
});

await clientConnection.connect();
```
